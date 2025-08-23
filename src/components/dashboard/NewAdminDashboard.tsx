import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';
import './AdminDashboard.css';

interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalVehicles: number;
  totalReservations: number;
  activeReservations: number;
  pendingReservations: number;
  completedReservations: number;
  cancelledReservations: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalProviders: 0,
    totalVehicles: 0,
    totalReservations: 0,
    activeReservations: 0,
    pendingReservations: 0,
    completedReservations: 0,
    cancelledReservations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!user.id || user.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    loadAdminData();
  }, [navigate, user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');

      // Charger toutes les données en parallèle
      const [usersData, providersData, vehiclesData, reservationsData] = await Promise.all([
        apiService.getAllUsers(),
        apiService.getAllProviders(),
        apiService.getAllVehicles(),
        apiService.getAllReservations()
      ]);

      // Calculer les statistiques
      const users = usersData as any[];
      const providers = providersData as any[];
      const vehicles = vehiclesData as any[];
      const reservations = reservationsData as any[];

      const adminStats: AdminStats = {
        totalUsers: users.length,
        totalProviders: providers.length,
        totalVehicles: vehicles.length,
        totalReservations: reservations.length,
        activeReservations: reservations.filter((r: any) => r.status === 'COMMITTED').length,
        pendingReservations: reservations.filter((r: any) => r.status === 'PENDING').length,
        completedReservations: reservations.filter((r: any) => r.status === 'COMPLETED').length,
        cancelledReservations: reservations.filter((r: any) => r.status === 'CANCELLED').length
      };

      setStats(adminStats);
    } catch (err) {
      console.error('Erreur chargement données admin:', err);
      setError('Erreur lors du chargement des données');
      
      // Données de fallback pour la démonstration
      setStats({
        totalUsers: 45,
        totalProviders: 8,
        totalVehicles: 32,
        totalReservations: 156,
        activeReservations: 23,
        pendingReservations: 12,
        completedReservations: 98,
        cancelledReservations: 23
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const reservationChartData: ChartData = {
    labels: ['Actives', 'En attente', 'Complétées', 'Annulées'],
    datasets: [{
      label: 'Réservations',
      data: [
        stats.activeReservations,
        stats.pendingReservations,
        stats.completedReservations,
        stats.cancelledReservations
      ],
      backgroundColor: [
        'rgba(40, 167, 69, 0.8)',
        'rgba(255, 193, 7, 0.8)',
        'rgba(0, 123, 255, 0.8)',
        'rgba(220, 53, 69, 0.8)'
      ],
      borderColor: [
        'rgba(40, 167, 69, 1)',
        'rgba(255, 193, 7, 1)',
        'rgba(0, 123, 255, 1)',
        'rgba(220, 53, 69, 1)'
      ],
      borderWidth: 2
    }]
  };

  const systemChartData: ChartData = {
    labels: ['Utilisateurs', 'Fournisseurs', 'Véhicules'],
    datasets: [{
      label: 'Système',
      data: [stats.totalUsers, stats.totalProviders, stats.totalVehicles],
      backgroundColor: [
        'rgba(102, 126, 234, 0.8)',
        'rgba(118, 75, 162, 0.8)',
        'rgba(255, 99, 132, 0.8)'
      ],
      borderColor: [
        'rgba(102, 126, 234, 1)',
        'rgba(118, 75, 162, 1)',
        'rgba(255, 99, 132, 1)'
      ],
      borderWidth: 2
    }]
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Chargement du dashboard administrateur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>⚙️ Dashboard Administrateur</h1>
          <div className="header-info">
            <span>👤 {user.email}</span>
            <button onClick={handleLogout} className="logout-btn">
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Alert d'erreur */}
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
            <button onClick={() => setError('')} className="alert-close">×</button>
          </div>
        )}

        {/* Statistiques globales */}
        <div className="stats-grid">
          <div className="stat-card users">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Utilisateurs</h3>
              <p className="stat-number">{stats.totalUsers}</p>
            </div>
          </div>
          
          <div className="stat-card providers">
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3>Fournisseurs</h3>
              <p className="stat-number">{stats.totalProviders}</p>
            </div>
          </div>
          
          <div className="stat-card vehicles">
            <div className="stat-icon">🚐</div>
            <div className="stat-content">
              <h3>Véhicules</h3>
              <p className="stat-number">{stats.totalVehicles}</p>
            </div>
          </div>
          
          <div className="stat-card reservations">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>Réservations</h3>
              <p className="stat-number">{stats.totalReservations}</p>
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="charts-grid">
          {/* Graphique des réservations */}
          <div className="chart-card">
            <h3>📊 Répartition des Réservations</h3>
            <div className="chart-container">
              <div className="pie-chart" id="reservations-chart">
                {reservationChartData.datasets[0].data.map((value, index) => {
                  const total = reservationChartData.datasets[0].data.reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (value / total * 100) : 0;
                  const color = reservationChartData.datasets[0].backgroundColor[index];
                  
                  return (
                    <div key={index} className="chart-segment" style={{
                      backgroundColor: color,
                      width: `${Math.max(percentage, 5)}%`
                    }}>
                      <span className="segment-label">
                        {reservationChartData.labels[index]}: {value} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Graphique du système */}
          <div className="chart-card">
            <h3>📈 Vue d'ensemble du Système</h3>
            <div className="chart-container">
              <div className="bar-chart" id="system-chart">
                {systemChartData.datasets[0].data.map((value, index) => {
                  const maxValue = Math.max(...systemChartData.datasets[0].data);
                  const height = (value / maxValue * 100);
                  const color = systemChartData.datasets[0].backgroundColor[index];
                  
                  return (
                    <div key={index} className="bar-segment">
                      <div 
                        className="bar" 
                        style={{
                          height: `${height}%`,
                          backgroundColor: color
                        }}
                      >
                        <span className="bar-value">{value}</span>
                      </div>
                      <span className="bar-label">{systemChartData.labels[index]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tendances */}
          <div className="chart-card">
            <h3>📊 Métriques de Performance</h3>
            <div className="metrics-container">
              <div className="metric-item">
                <span className="metric-label">Taux d'occupation:</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill" 
                    style={{
                      width: `${(stats.activeReservations / stats.totalReservations * 100) || 0}%`,
                      backgroundColor: '#28a745'
                    }}
                  ></div>
                </div>
                <span className="metric-value">
                  {((stats.activeReservations / stats.totalReservations * 100) || 0).toFixed(1)}%
                </span>
              </div>

              <div className="metric-item">
                <span className="metric-label">Taux de conversion:</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill" 
                    style={{
                      width: `${((stats.completedReservations / stats.totalReservations * 100) || 0)}%`,
                      backgroundColor: '#007bff'
                    }}
                  ></div>
                </div>
                <span className="metric-value">
                  {((stats.completedReservations / stats.totalReservations * 100) || 0).toFixed(1)}%
                </span>
              </div>

              <div className="metric-item">
                <span className="metric-label">Taux d'annulation:</span>
                <div className="metric-bar">
                  <div 
                    className="metric-fill" 
                    style={{
                      width: `${((stats.cancelledReservations / stats.totalReservations * 100) || 0)}%`,
                      backgroundColor: '#dc3545'
                    }}
                  ></div>
                </div>
                <span className="metric-value">
                  {((stats.cancelledReservations / stats.totalReservations * 100) || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions d'administration */}
        <div className="admin-actions">
          <h3>🔧 Actions d'Administration</h3>
          <div className="actions-grid">
            <button className="action-btn users-btn">
              👥 Gérer les Utilisateurs
            </button>
            <button className="action-btn providers-btn">
              🏢 Gérer les Fournisseurs
            </button>
            <button className="action-btn vehicles-btn">
              🚐 Gérer les Véhicules
            </button>
            <button className="action-btn reservations-btn">
              📋 Gérer les Réservations
            </button>
            <button className="action-btn reports-btn">
              📊 Générer des Rapports
            </button>
            <button className="action-btn settings-btn">
              ⚙️ Paramètres Système
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
