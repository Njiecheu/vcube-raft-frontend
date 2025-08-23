// Configuration multi-nœuds pour le failover (extension future)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// URLs de secours pour le failover (non utilisées actuellement)
const BACKUP_URLS = import.meta.env.VITE_API_BACKUP_URLS 
  ? import.meta.env.VITE_API_BACKUP_URLS.split(',').map((url: string) => url.trim())
  : ['http://localhost:8081', 'http://localhost:8082'];

// Liste complète des nœuds disponibles
const ALL_API_NODES = [API_BASE_URL, ...BACKUP_URLS];

// TODO: Implémenter le failover automatique dans une future version
console.log('🔧 Configuration multi-nœuds:', { primary: API_BASE_URL, backups: BACKUP_URLS });

export interface RaftMetrics {
  currentTerm: number;
  currentLeader: string;
  nodeState: string;
  voteRequestCount: number;
  appendEntriesCount: number;
  leaderElectionCount: number;
  timestamp: string;
}

export interface ReservationMetrics {
  totalReservations: number;
  successfulReservations: number;
  failedReservations: number;
  redirectedReservations: number;
  averageProcessingTimeMs: number;
  timestamp: string;
  successRate: number;
  redirectionRate: number;
}

export interface PerformanceTestConfig {
  numberOfProviders: number;
  seatsPerProvider: number;
  numberOfNodes: number;
  numberOfUsers: number;
  testDurationMinutes: number;
  reservationRate?: number;
  enableStress?: boolean;
  enableFailures?: boolean;
  enableAutoSubscription?: boolean;
  subscriptionRate?: number;
  enableConflictSimulation?: boolean;
  conflictIntensity?: number;
  aggressiveSubscriberCount?: number;
}

class ApiService {
  private currentNodeIndex = 0;
  private failedNodes = new Set<number>();
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 secondes
  private readonly REQUEST_TIMEOUT = 5000; // 5 secondes

  constructor() {
    console.log('🔧 ApiService initialisé avec failover multi-nœuds');
    console.log('📍 Nœuds disponibles:', ALL_API_NODES);
  }

  private getCurrentNodeUrl(): string {
    return ALL_API_NODES[this.currentNodeIndex];
  }

  private getNextHealthyNode(): number {
    for (let i = 0; i < ALL_API_NODES.length; i++) {
      const nodeIndex = (this.currentNodeIndex + i) % ALL_API_NODES.length;
      if (!this.failedNodes.has(nodeIndex)) {
        return nodeIndex;
      }
    }
    // Si tous les nœuds sont marqués comme défaillants, réessayer avec le premier
    this.failedNodes.clear();
    return 0;
  }

  private markNodeAsFailed(nodeIndex: number): void {
    this.failedNodes.add(nodeIndex);
    console.warn(`❌ Nœud ${nodeIndex} (${ALL_API_NODES[nodeIndex]}) marqué comme défaillant`);
    
    // Basculer vers le prochain nœud sain
    this.currentNodeIndex = this.getNextHealthyNode();
    console.log(`🔄 Basculement vers le nœud ${this.currentNodeIndex} (${this.getCurrentNodeUrl()})`);
  }

  private async performHealthCheck(): Promise<void> {
    const now = Date.now();
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) {
      return;
    }

    this.lastHealthCheck = now;
    console.log('🏥 Vérification de santé des nœuds...');

    // Tester tous les nœuds marqués comme défaillants pour voir s'ils sont revenus
    const healthCheckPromises = Array.from(this.failedNodes).map(async (nodeIndex) => {
      try {
        const response = await fetch(`${ALL_API_NODES[nodeIndex]}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.ok) {
          this.failedNodes.delete(nodeIndex);
          console.log(`✅ Nœud ${nodeIndex} (${ALL_API_NODES[nodeIndex]}) est de nouveau disponible`);
        }
      } catch (error) {
        // Nœud toujours indisponible
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  private async fetchWithFailover(endpoint: string, options: RequestInit = {}): Promise<Response> {
    await this.performHealthCheck();

    let lastError: Error | null = null;
    const maxAttempts = ALL_API_NODES.length;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const nodeUrl = this.getCurrentNodeUrl();
      
      try {
        console.log(`🔄 Tentative ${attempt + 1}/${maxAttempts}: ${nodeUrl}${endpoint}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

        const response = await fetch(`${nodeUrl}${endpoint}`, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          console.log(`✅ Succès avec le nœud ${this.currentNodeIndex}: ${nodeUrl}`);
          return response;
        } else if (response.status >= 500) {
          // Erreur serveur, essayer le nœud suivant
          throw new Error(`Erreur serveur ${response.status}: ${response.statusText}`);
        } else {
          // Erreur client (400-499), ne pas faire de failover
          console.log(`⚠️ Erreur client ${response.status}, pas de failover`);
          return response;
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`❌ Échec nœud ${this.currentNodeIndex} (${nodeUrl}):`, error);
        
        // Marquer le nœud comme défaillant et passer au suivant
        this.markNodeAsFailed(this.currentNodeIndex);
        
        if (attempt === maxAttempts - 1) {
          break;
        }
      }
    }

    // Tous les nœuds ont échoué
    console.error('💥 Tous les nœuds API sont indisponibles');
    throw new Error(`Tous les nœuds API sont indisponibles. Dernière erreur: ${lastError?.message}`);
  }

  private getAuthHeaders(): HeadersInit {
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    return {
      'Content-Type': 'application/json',
      ...(userId && { 'X-User-Id': userId }),
      ...(userRole && { 'X-User-Role': userRole })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  }

  // ============== AUTHENTIFICATION ==============

  async login(credentials: { username: string; password: string }) {
    try {
      const response = await this.fetchWithFailover('/api/auth/login', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials)
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  }

  async register(userData: { username: string; email: string; password: string; role: string }) {
    try {
      const response = await this.fetchWithFailover('/api/auth/register', {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      throw error;
    }
  }  // ============== MÉTRIQUES RAFT (VRAIS ENDPOINTS) ==============

  async getRaftMetrics(): Promise<RaftMetrics> {
    const response = await this.fetchWithFailover('/api/metrics/raft/current', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getRaftChartData() {
    const response = await this.fetchWithFailover('/api/metrics/raft/chart-data', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getRaftStatus() {
    const response = await this.fetchWithFailover('/api/raft/status', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== MÉTRIQUES DE RÉSERVATION (VRAIS ENDPOINTS) ==============

  async getReservationMetrics(): Promise<ReservationMetrics> {
    const response = await this.fetchWithFailover('/api/metrics/reservations/current', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getReservationChartData() {
    const response = await this.fetchWithFailover('/api/metrics/reservations/chart-data', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== MÉTRIQUES DASHBOARD (VRAIS ENDPOINTS) ==============

  async getDashboardMetrics() {
    const response = await this.fetchWithFailover('/api/metrics/dashboard', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== MÉTRIQUES HISTORIQUES ==============

  async getLatencyHistory() {
    const response = await this.fetchWithFailover('/api/metrics/latency/history', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getThroughputHistory() {
    const response = await this.fetchWithFailover('/api/metrics/throughput/history', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getVCubeOverheadHistory() {
    const response = await this.fetchWithFailover('/api/metrics/vcube/overhead/history', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getVCubeCompactionHistory() {
    const response = await this.fetchWithFailover('/api/metrics/vcube/compaction/history', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== TESTS DE PERFORMANCE (VRAIS ENDPOINTS) ==============

  async runPerformanceTest(config: PerformanceTestConfig) {
    const response = await this.fetchWithFailover('/api/performance-test/run', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(config)
    });
    return this.handleResponse(response);
  }

  async runQuickTest(params: { providers: number; seatsPerProvider: number; nodes: number; users: number }) {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await this.fetchWithFailover(`/api/performance-test/quick-test?${queryParams}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async runStressTest(params: { providers: number; seatsPerProvider: number; nodes: number; users: number }) {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await this.fetchWithFailover(`/api/performance-test/stress-test?${queryParams}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async stopPerformanceTest() {
    const response = await this.fetchWithFailover('/api/performance-test/stop', {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getTestStatus() {
    const response = await this.fetchWithFailover('/api/performance-test/status', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getCurrentTestResults() {
    const response = await this.fetchWithFailover('/api/performance-test/current-results', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== SOUSCRIPTIONS (VRAIS ENDPOINTS) ==============

  async startAutoSubscription(config: any) {
    const response = await this.fetchWithFailover('/api/performance-test/subscriptions/start', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(config)
    });
    return this.handleResponse(response);
  }

  async stopAutoSubscription() {
    const response = await this.fetchWithFailover('/api/performance-test/subscriptions/stop', {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getSubscriptionMetrics() {
    const response = await this.fetchWithFailover('/api/performance-test/subscriptions/metrics', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== MÉTRIQUES EN TEMPS RÉEL (SERVER-SENT EVENTS) ==============

  private createEventSourceWithFailover(endpoint: string): EventSource {
    const currentUrl = this.getCurrentNodeUrl();
    console.log(`🔗 Création EventSource: ${currentUrl}${endpoint}`);
    
    const eventSource = new EventSource(`${currentUrl}${endpoint}`);
    
    // Gérer les erreurs de connexion
    eventSource.onerror = (error) => {
      console.warn(`❌ Erreur EventSource sur ${currentUrl}${endpoint}:`, error);
      // Note: Pour une gestion complète du failover des EventSource,
      // il faudrait fermer cette connexion et en créer une nouvelle
      // sur un autre nœud, mais cela nécessite une logique plus complexe
      // au niveau du composant qui utilise l'EventSource
    };
    
    return eventSource;
  }

  createRaftEventStream(): EventSource {
    return this.createEventSourceWithFailover('/api/metrics/raft/events/stream');
  }

  createReservationEventStream(): EventSource {
    return this.createEventSourceWithFailover('/api/metrics/reservations/events/stream');
  }

  createVCubeEventStream(): EventSource {
    return this.createEventSourceWithFailover('/api/metrics/vcube/events/stream');
  }

  // ============== RÉSERVATIONS ==============

  async getProviders() {
    try {
      const response = await this.fetchWithFailover('/api/providers', {
        headers: this.getAuthHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      console.warn('API providers endpoint not available, using test endpoint');
      const response = await this.fetchWithFailover('/api/test/providers', {
        headers: this.getAuthHeaders()
      });
      return this.handleResponse(response);
    }
  }

  async getSeats(providerId: string) {
    const response = await this.fetchWithFailover(`/api/providers/${providerId}/seats`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async reserveSeat(reservationData: any) {
    const response = await this.fetchWithFailover('/reservations/', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(reservationData)
    });
    return this.handleResponse(response);
  }

  async getUserReservations() {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const response = await this.fetchWithFailover(`/reservations/byUser/${userId}`, {
        headers: this.getAuthHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      console.warn('Erreur lors du chargement des réservations:', error);
      // Retourner un tableau vide en cas d'erreur
      return [];
    }
  }

  async cancelReservation(reservationId: string) {
    const response = await this.fetchWithFailover(`/api/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== ADMIN ==============

  async getAdminStats() {
    try {
      const response = await this.fetchWithFailover('/api/admin/stats', {
        headers: this.getAuthHeaders()
      });
      return this.handleResponse(response);
    } catch (error) {
      console.warn('Admin stats endpoint not available, using test stats');
      const response = await this.fetchWithFailover('/api/test/stats', {
        headers: this.getAuthHeaders()
      });
      return this.handleResponse(response);
    }
  }

  async getReservationsByHour() {
    const response = await this.fetchWithFailover('/api/admin/charts/reservations-by-hour', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getTopProviders() {
    const response = await this.fetchWithFailover('/api/admin/charts/top-providers', {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== MONITORING MULTI-NŒUDS ==============

  async getNodesHealthStatus(): Promise<{
    currentNode: number;
    nodes: Array<{
      index: number;
      url: string;
      status: 'healthy' | 'failed' | 'unknown';
      lastChecked: Date | null;
      responseTime?: number;
    }>;
  }> {
    const nodes = ALL_API_NODES.map((url, index) => ({
      index,
      url,
      status: (this.failedNodes.has(index) ? 'failed' : 'healthy') as 'healthy' | 'failed' | 'unknown',
      lastChecked: null as Date | null,
      responseTime: undefined as number | undefined
    }));

    // Tester tous les nœuds en parallèle
    const healthChecks = nodes.map(async (node) => {
      const startTime = Date.now();
      try {
        const response = await fetch(`${node.url}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        const endTime = Date.now();
        
        node.lastChecked = new Date();
        node.responseTime = endTime - startTime;
        node.status = response.ok ? 'healthy' : 'failed';
      } catch (error) {
        node.lastChecked = new Date();
        node.status = 'failed';
      }
      return node;
    });

    await Promise.allSettled(healthChecks);

    return {
      currentNode: this.currentNodeIndex,
      nodes
    };
  }

  // Méthode pour forcer le basculement vers un nœud spécifique
  switchToNode(nodeIndex: number): boolean {
    if (nodeIndex >= 0 && nodeIndex < ALL_API_NODES.length) {
      console.log(`🔄 Basculement manuel vers le nœud ${nodeIndex} (${ALL_API_NODES[nodeIndex]})`);
      this.currentNodeIndex = nodeIndex;
      this.failedNodes.delete(nodeIndex); // Retirer le nœud des nœuds défaillants
      return true;
    }
    return false;
  }

  // Réinitialiser l'état des nœuds défaillants
  resetFailedNodes(): void {
    console.log('🔄 Réinitialisation de l\'état des nœuds défaillants');
    this.failedNodes.clear();
  }
}

// Instance singleton
export const apiService = new ApiService();
export default apiService;
