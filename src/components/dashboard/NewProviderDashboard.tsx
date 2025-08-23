import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';
import './NewProviderDashboard.css';

interface User {
  id: string;
  email: string;
  role: string;
}

interface Vehicle {
  id: string;
  name: string;
  capacity: number;
  make: string;
  model: string;
  licensePlate: string;
  providerId: string;
  published: boolean;
  seats?: Seat[];
}

interface Seat {
  id: string;
  vehicleId: string;
  label: string;
  available: boolean;
}

interface VehicleStats {
  totalSeats: number;
  reservedSeats: number;
  availableSeats: number;
}

interface CreateVehicleForm {
  name: string;
  type: string;
  capacity: number;
  status: 'PUBLISHED' | 'DRAFT';
}

const NewProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleStats, setVehicleStats] = useState<Map<string, VehicleStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [createForm, setCreateForm] = useState<CreateVehicleForm>({
    name: '',
    type: 'BUS',
    capacity: 20,
    status: 'DRAFT'
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'PROVIDER') {
      navigate('/login');
      return;
    }

    setUser(parsedUser);
    loadDashboardData(parsedUser.id);
  }, [navigate]);

  const loadDashboardData = async (providerId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Charger les véhicules du fournisseur
      const vehiclesData = await apiService.getProviderVehicles(providerId);
      setVehicles(vehiclesData as Vehicle[]);

      // Charger les statistiques pour chaque véhicule
      const statsMap = new Map<string, VehicleStats>();
      for (const vehicle of vehiclesData as Vehicle[]) {
        const seats = await apiService.getVehicleSeats(vehicle.id);
        
        const totalSeats = vehicle.capacity;
        const reservedSeats = (seats as Seat[]).filter(seat => !seat.available).length;
        const availableSeats = totalSeats - reservedSeats;

        statsMap.set(vehicle.id, {
          totalSeats,
          reservedSeats,
          availableSeats
        });
      }
      setVehicleStats(statsMap);

    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      
      // Créer le véhicule
      const vehicleData = {
        ...createForm,
        providerId: user.id
      };

      const newVehicle = await apiService.createVehicle(vehicleData);
      
      // Créer les sièges pour le véhicule
      await apiService.createVehicleSeats(newVehicle.id, createForm.capacity);

      // Recharger les données
      await loadDashboardData(user.id);
      
      // Réinitialiser le formulaire
      setCreateForm({
        name: '',
        type: 'BUS',
        capacity: 20,
        status: 'DRAFT'
      });
      setShowCreateForm(false);

    } catch (err) {
      console.error('Erreur création véhicule:', err);
      setError('Erreur lors de la création du véhicule');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishVehicle = async (vehicleId: string, newStatus: 'PUBLISHED' | 'DRAFT') => {
    try {
      await apiService.updateVehicleStatus(vehicleId, newStatus);
      await loadDashboardData(user!.id);
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) {
      return;
    }

    try {
      await apiService.deleteVehicle(vehicleId);
      await loadDashboardData(user!.id);
    } catch (err) {
      console.error('Erreur suppression véhicule:', err);
      setError('Erreur lors de la suppression du véhicule');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getDashboardStats = () => {
    const totalVehicles = vehicles.length;
    const publishedVehicles = vehicles.filter(v => v.published).length;
    const draftVehicles = vehicles.filter(v => !v.published).length;
    
    let totalSeats = 0;
    let totalReserved = 0;
    let totalAvailable = 0;

    vehicleStats.forEach(stats => {
      totalSeats += stats.totalSeats;
      totalReserved += stats.reservedSeats;
      totalAvailable += stats.availableSeats;
    });

    return {
      totalVehicles,
      publishedVehicles,
      draftVehicles,
      totalSeats,
      totalReserved,
      totalAvailable
    };
  };

  if (loading) {
    return (
      <div className="provider-dashboard">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = getDashboardStats();

  return (
    <div className="provider-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🚐 Dashboard Fournisseur</h1>
          <div className="header-info">
            <span>👤 {user?.email}</span>
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
            <button onClick={() => setError(null)} className="alert-close">×</button>
          </div>
        )}

        {/* Statistiques globales */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🚐</div>
            <div className="stat-content">
              <h3>Véhicules Total</h3>
              <p className="stat-number">{stats.totalVehicles}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Publiés</h3>
              <p className="stat-number">{stats.publishedVehicles}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <h3>Brouillons</h3>
              <p className="stat-number">{stats.draftVehicles}</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">💺</div>
            <div className="stat-content">
              <h3>Sièges Total</h3>
              <p className="stat-number">{stats.totalSeats}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔴</div>
            <div className="stat-content">
              <h3>Sièges Réservés</h3>
              <p className="stat-number">{stats.totalReserved}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <h3>Sièges Libres</h3>
              <p className="stat-number">{stats.totalAvailable}</p>
            </div>
          </div>
        </div>

        {/* Section Création de véhicule */}
        <div className="create-section">
          <div className="section-header">
            <h2>🚗 Créer un Nouveau Véhicule</h2>
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="toggle-form-btn"
            >
              {showCreateForm ? 'Annuler' : 'Nouveau Véhicule'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateVehicle} className="create-form">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="name">Nom du véhicule *</label>
                  <input
                    type="text"
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    placeholder="Ex: Bus Express 001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="type">Type de véhicule</label>
                  <select
                    id="type"
                    value={createForm.type}
                    onChange={(e) => setCreateForm({...createForm, type: e.target.value})}
                  >
                    <option value="BUS">Bus</option>
                    <option value="MINIBUS">Minibus</option>
                    <option value="CAR">Voiture</option>
                    <option value="VAN">Van</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="capacity">Nombre de places *</label>
                  <input
                    type="number"
                    id="capacity"
                    min="1"
                    max="100"
                    value={createForm.capacity}
                    onChange={(e) => setCreateForm({...createForm, capacity: parseInt(e.target.value)})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Statut</label>
                  <select
                    id="status"
                    value={createForm.status}
                    onChange={(e) => setCreateForm({...createForm, status: e.target.value as 'PUBLISHED' | 'DRAFT'})}
                  >
                    <option value="DRAFT">📝 Brouillon</option>
                    <option value="PUBLISHED">✅ Publié</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="create-btn" disabled={loading}>
                  {loading ? 'Création...' : 'Créer le Véhicule'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Liste des véhicules */}
        <div className="vehicles-section">
          <h2>🚐 Mes Véhicules ({vehicles.length})</h2>
          
          {vehicles.length === 0 ? (
            <div className="no-vehicles">
              <p>Aucun véhicule créé pour le moment.</p>
              <p>Commencez par créer votre premier véhicule !</p>
            </div>
          ) : (
            <div className="vehicles-grid">
              {vehicles.map((vehicle) => {
                const stats = vehicleStats.get(vehicle.id);
                return (
                  <div key={vehicle.id} className="vehicle-card">
                    <div className="vehicle-header">
                      <div className="vehicle-info">
                        <h3>{vehicle.name}</h3>
                        <p className="vehicle-type">{vehicle.make} {vehicle.model}</p>
                      </div>
                      <div className="vehicle-status">
                        <span className={`status-badge ${vehicle.published ? 'published' : 'draft'}`}>
                          {vehicle.published ? '✅ Publié' : '📝 Brouillon'}
                        </span>
                      </div>
                    </div>

                    <div className="vehicle-stats">
                      <div className="stat-item">
                        <span className="stat-label">Capacité totale:</span>
                        <span className="stat-value">{vehicle.capacity} places</span>
                      </div>
                      
                      {stats && (
                        <>
                          <div className="stat-item">
                            <span className="stat-label">Sièges réservés:</span>
                            <span className="stat-value reserved">{stats.reservedSeats}</span>
                          </div>
                          
                          <div className="stat-item">
                            <span className="stat-label">Sièges libres:</span>
                            <span className="stat-value available">{stats.availableSeats}</span>
                          </div>

                          <div className="occupation-bar">
                            <div 
                              className="occupation-fill"
                              style={{
                                width: `${(stats.reservedSeats / stats.totalSeats) * 100}%`
                              }}
                            ></div>
                          </div>
                          <p className="occupation-text">
                            {Math.round((stats.reservedSeats / stats.totalSeats) * 100)}% occupé
                          </p>
                        </>
                      )}
                    </div>

                    <div className="vehicle-actions">
                      {!vehicle.published ? (
                        <button
                          onClick={() => handlePublishVehicle(vehicle.id, 'PUBLISHED')}
                          className="publish-btn"
                        >
                          ✅ Publier
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePublishVehicle(vehicle.id, 'DRAFT')}
                          className="unpublish-btn"
                        >
                          📝 Mettre en brouillon
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="delete-btn"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>

                    <div className="vehicle-meta">
                      <p>Plaque: {vehicle.licensePlate}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewProviderDashboard;
