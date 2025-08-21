const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
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
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials)
    });
    return this.handleResponse(response);
  }

  async register(userData: { username: string; email: string; password: string; role: string }) {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return this.handleResponse(response);
  }

  // ============== MÉTRIQUES RAFT (VRAIS ENDPOINTS) ==============

  async getRaftMetrics(): Promise<RaftMetrics> {
    const response = await fetch(`${API_BASE_URL}/api/metrics/raft/current`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getRaftChartData() {
    const response = await fetch(`${API_BASE_URL}/api/metrics/raft/chart-data`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getRaftStatus() {
    const response = await fetch(`${API_BASE_URL}/api/raft/status`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== MÉTRIQUES DE RÉSERVATION (VRAIS ENDPOINTS) ==============

  async getReservationMetrics(): Promise<ReservationMetrics> {
    const response = await fetch(`${API_BASE_URL}/api/metrics/reservations/current`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getReservationChartData() {
    const response = await fetch(`${API_BASE_URL}/api/metrics/reservations/chart-data`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== MÉTRIQUES DASHBOARD (VRAIS ENDPOINTS) ==============

  async getDashboardMetrics() {
    const response = await fetch(`${API_BASE_URL}/api/metrics/dashboard`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== MÉTRIQUES HISTORIQUES ==============

  async getLatencyHistory() {
    const response = await fetch(`${API_BASE_URL}/api/metrics/latency/history`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getThroughputHistory() {
    const response = await fetch(`${API_BASE_URL}/api/metrics/throughput/history`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getVCubeOverheadHistory() {
    const response = await fetch(`${API_BASE_URL}/api/metrics/vcube/overhead/history`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getVCubeCompactionHistory() {
    const response = await fetch(`${API_BASE_URL}/api/metrics/vcube/compaction/history`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== TESTS DE PERFORMANCE (VRAIS ENDPOINTS) ==============

  async runPerformanceTest(config: PerformanceTestConfig) {
    const response = await fetch(`${API_BASE_URL}/api/performance-test/run`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(config)
    });
    return this.handleResponse(response);
  }

  async runQuickTest(params: { providers: number; seatsPerProvider: number; nodes: number; users: number }) {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/api/performance-test/quick-test?${queryParams}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async runStressTest(params: { providers: number; seatsPerProvider: number; nodes: number; users: number }) {
    const queryParams = new URLSearchParams(params as any).toString();
    const response = await fetch(`${API_BASE_URL}/api/performance-test/stress-test?${queryParams}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async stopPerformanceTest() {
    const response = await fetch(`${API_BASE_URL}/api/performance-test/stop`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getTestStatus() {
    const response = await fetch(`${API_BASE_URL}/api/performance-test/status`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getCurrentTestResults() {
    const response = await fetch(`${API_BASE_URL}/api/performance-test/current-results`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== SOUSCRIPTIONS (VRAIS ENDPOINTS) ==============

  async startAutoSubscription(config: any) {
    const response = await fetch(`${API_BASE_URL}/api/performance-test/subscriptions/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(config)
    });
    return this.handleResponse(response);
  }

  async stopAutoSubscription() {
    const response = await fetch(`${API_BASE_URL}/api/performance-test/subscriptions/stop`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getSubscriptionMetrics() {
    const response = await fetch(`${API_BASE_URL}/api/performance-test/subscriptions/metrics`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== MÉTRIQUES EN TEMPS RÉEL (SERVER-SENT EVENTS) ==============

  createRaftEventStream(): EventSource {
    return new EventSource(`${API_BASE_URL}/api/metrics/raft/events/stream`);
  }

  createReservationEventStream(): EventSource {
    return new EventSource(`${API_BASE_URL}/api/metrics/reservations/events/stream`);
  }

  createVCubeEventStream(): EventSource {
    return new EventSource(`${API_BASE_URL}/api/metrics/vcube/events/stream`);
  }

  // ============== RÉSERVATIONS ==============

  async getProviders() {
    const response = await fetch(`${API_BASE_URL}/api/providers`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getSeats(providerId: string) {
    const response = await fetch(`${API_BASE_URL}/api/providers/${providerId}/seats`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async reserveSeat(reservationData: any) {
    const response = await fetch(`${API_BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(reservationData)
    });
    return this.handleResponse(response);
  }

  async getUserReservations() {
    const response = await fetch(`${API_BASE_URL}/api/reservations/user`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async cancelReservation(reservationId: string) {
    const response = await fetch(`${API_BASE_URL}/api/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  // ============== ADMIN ==============

  async getAdminStats() {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getReservationsByHour() {
    const response = await fetch(`${API_BASE_URL}/api/admin/charts/reservations-by-hour`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getTopProviders() {
    const response = await fetch(`${API_BASE_URL}/api/admin/charts/top-providers`, {
      headers: this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }
}

// Instance singleton
export const apiService = new ApiService();
export default apiService;
