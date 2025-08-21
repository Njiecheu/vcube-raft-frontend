import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { Chart } from 'chart.js/auto';

interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalReservations: number;
  totalSeats: number;
  availableSeats: number;
  averageProcessingTime: number;
}

interface TopProvider {
  providerId: string;
  reservationCount: number;
}

interface ChartData {
  timestamp: number;
  value: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [topProviders, setTopProviders] = useState<TopProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const adminName = localStorage.getItem('userName') || 'Administrateur';
  
  // Chart refs
  const reservationsChartRef = useRef<HTMLCanvasElement | null>(null);
  const processingChartRef = useRef<HTMLCanvasElement | null>(null);
  const raftChartRef = useRef<HTMLCanvasElement | null>(null);
  const hourlyChartRef = useRef<HTMLCanvasElement | null>(null);

  // Charts instances
  const [charts, setCharts] = useState<{[key: string]: Chart}>({});

  // Logout function
  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Authentication check
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    if (!userRole || userRole !== 'ADMIN' || !userId) {
      navigate('/');
      return;
    }
  }, [navigate]);

  // Initial load and interval
  useEffect(() => {
    initializeCharts();
    refreshAllData();
    
    const interval = setInterval(refreshAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializeCharts = () => {
    console.log('Initializing charts...');
    
    // Graphique des réservations par seconde
    if (reservationsChartRef.current) {
      console.log('Creating reservations chart...');
      const ctx = reservationsChartRef.current.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(102, 126, 234, 0.8)');
        gradient.addColorStop(0.5, 'rgba(102, 126, 234, 0.4)');
        gradient.addColorStop(1, 'rgba(102, 126, 234, 0.1)');

        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Point 1', 'Point 2', 'Point 3'], // Données de test
            datasets: [{
              label: 'Trafic de Réservations',
              data: [10, 20, 15], // Données de test
              borderColor: '#667eea',
              backgroundColor: gradient,
              borderWidth: 4,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });

        setCharts(prev => ({ ...prev, reservations: chart }));
        console.log('Reservations chart created successfully');
      }
    } else {
      console.log('Reservations chart ref not available');
    }

    // Graphique du temps de traitement
    if (processingChartRef.current) {
      console.log('Creating processing chart...');
      const ctx = processingChartRef.current.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Sample 1', 'Sample 2', 'Sample 3'], // Données de test
            datasets: [{
              label: 'Temps de Réponse',
              data: [50, 75, 100], // Données de test
              backgroundColor: 'rgba(102, 126, 234, 0.8)',
              borderColor: 'rgba(102, 126, 234, 1)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });

        setCharts(prev => ({ ...prev, processing: chart }));
        console.log('Processing chart created successfully');
      }
    } else {
      console.log('Processing chart ref not available');
    }

    // Graphique du consensus Raft
    if (raftChartRef.current) {
      console.log('Creating raft chart...');
      const ctx = raftChartRef.current.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['T1', 'T2', 'T3'], // Données de test
            datasets: [{
              label: 'Latence Consensus',
              data: [25, 30, 20], // Données de test
              borderColor: '#dc3545',
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
              borderWidth: 4,
              fill: true,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });

        setCharts(prev => ({ ...prev, raft: chart }));
        console.log('Raft chart created successfully');
      }
    } else {
      console.log('Raft chart ref not available');
    }

    // Graphique par heure
    if (hourlyChartRef.current) {
      console.log('Creating hourly chart...');
      const ctx = hourlyChartRef.current.getContext('2d');
      if (ctx) {
        const chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: Array.from({length: 24}, (_, i) => `${i}h`),
            datasets: [{
              label: 'Réservations',
              data: Array.from({length: 24}, () => Math.floor(Math.random() * 20)), // Données de test
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true }
            }
          }
        });

        setCharts(prev => ({ ...prev, hourly: chart }));
        console.log('Hourly chart created successfully');
      }
    } else {
      console.log('Hourly chart ref not available');
    }

    console.log('Charts initialization completed');
  };

  const refreshAllData = async () => {
    try {
      await Promise.all([
        loadSystemStats(),
        loadPerformanceCharts(),
        loadTopProviders()
      ]);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const loadPerformanceCharts = async () => {
    try {
      // Charger les données des graphiques
      const responses = await Promise.all([
        fetch('/api/admin/charts/reservations-per-second'),
        fetch('/api/admin/charts/processing-time'),
        fetch('/api/admin/charts/raft-consensus'),
        fetch('/api/admin/charts/reservations-by-hour')
      ]);

      const [reservationsData, processingData, raftData, hourlyData] = await Promise.all(
        responses.map(r => r.ok ? r.json() : [])
      );

      // Mettre à jour les graphiques
      updateChart('reservations', reservationsData);
      updateChart('processing', processingData);
      updateChart('raft', raftData);
      
      if (charts.hourly && hourlyData) {
        const hourlyArray = new Array(24).fill(0);
        Object.entries(hourlyData).forEach(([hour, count]) => {
          hourlyArray[parseInt(hour)] = count as number;
        });
        charts.hourly.data.datasets[0].data = hourlyArray;
        charts.hourly.update();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des graphiques:', error);
    }
  };

  const loadTopProviders = async () => {
    try {
      const response = await fetch('/api/admin/charts/top-providers');
      if (response.ok) {
        const data = await response.json();
        setTopProviders(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fournisseurs:', error);
    }
  };

  const updateChart = (chartName: string, data: ChartData[]) => {
    const chart = charts[chartName];
    if (!chart || !data) return;

    const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);
    const labels = sortedData.map(d => new Date(d.timestamp).toLocaleTimeString());
    const values = sortedData.map(d => d.value);

    chart.data.labels = labels.slice(-20);
    chart.data.datasets[0].data = values.slice(-20);
    chart.update();
  };

  if (loading) {
    return (
      <div className="admin-dashboard-root">
        <div className="loading">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-root">
      <nav className="navbar">
        <h1>⚙️ VCube-PS - Administration</h1>
        <div className="user-info">
          <span>{adminName}</span>
          <button className="logout-btn" onClick={logout}>Déconnexion</button>
        </div>
      </nav>

      <div className="container">
        {/* Statistiques générales */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-number">{stats?.totalUsers ?? '-'}</div>
            <div className="stat-label">Utilisateurs</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🚐</div>
            <div className="stat-number">{stats?.totalProviders ?? '-'}</div>
            <div className="stat-label">Fournisseurs</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🎫</div>
            <div className="stat-number">{stats?.totalReservations ?? '-'}</div>
            <div className="stat-label">Réservations</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💺</div>
            <div className="stat-number">{stats?.totalSeats ?? '-'}</div>
            <div className="stat-label">Sièges Totaux</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-number">{stats?.availableSeats ?? '-'}</div>
            <div className="stat-label">Sièges Disponibles</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">⚡</div>
            <div className="stat-number">
              {stats?.averageProcessingTime ? Math.round(stats.averageProcessingTime) : '-'}
            </div>
            <div className="stat-label">Temps Moyen (ms)</div>
          </div>
        </div>

        <button className="refresh-btn" onClick={refreshAllData}>
          🔄 Actualiser les Données
        </button>

        {/* Graphiques de performance */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3>📊 Réservations par Seconde</h3>
            <div className="chart-container">
              <canvas ref={reservationsChartRef}></canvas>
            </div>
          </div>
          
          <div className="chart-card">
            <h3>⏱️ Temps de Traitement</h3>
            <div className="chart-container">
              <canvas ref={processingChartRef}></canvas>
            </div>
          </div>
        </div>
        
        <div className="charts-grid">
          <div className="chart-card">
            <h3>🏛️ Consensus Raft</h3>
            <div className="chart-container">
              <canvas ref={raftChartRef}></canvas>
            </div>
          </div>
          
          <div className="chart-card">
            <h3>🕐 Répartition par Heure</h3>
            <div className="chart-container">
              <canvas ref={hourlyChartRef}></canvas>
            </div>
          </div>
        </div>

        {/* Tableau des fournisseurs Top */}
        <div className="performance-table">
          <h3>🏆 Top Fournisseurs</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Fournisseur ID</th>
                <th>Réservations</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {topProviders.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>
                    Chargement des données...
                  </td>
                </tr>
              ) : (
                topProviders.map((provider, index) => (
                  <tr key={provider.providerId}>
                    <td>{index + 1}</td>
                    <td>{provider.providerId.substring(0, 12)}...</td>
                    <td>
                      <span className="metric-value">{provider.reservationCount}</span>{' '}
                      <span className="metric-unit">réservations</span>
                    </td>
                    <td>
                      <span className="status-indicator status-online"></span>
                      Actif
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
