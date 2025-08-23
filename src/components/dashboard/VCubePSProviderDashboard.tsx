import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import './VCubeProviderDashboard.css';

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  licensePlate: string;
  capacity: number;
  published: boolean;
  providerId: string;
  seatCount?: number;
}

interface Seat {
  id: string;
  vehicleId: string;
  label: string;
  available: boolean;
  seatNumber?: string;
  isReserved?: boolean;
}

interface Reservation {
  id: string;
  userId: string;
  providerId: string;
  vehicleId: string;
  seatId: string;
  status: 'COMMITTED' | 'PENDING' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  vehicleName?: string;
  userName?: string;
}

const VCubePSProviderDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // États principaux
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  
  // Stats
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [totalSeats, setTotalSeats] = useState(0);
  const [totalReservations, setTotalReservations] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);

  // Formulaire
  const [formData, setFormData] = useState({
    vehicleId: '',
    vehicleName: '',
    vehicleCapacity: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleLicense: '',
    vehicleStatus: 'draft'
  });

  const providerName = localStorage.getItem('userName') || 'Fournisseur';
  const providerId = localStorage.getItem('userId');

  useEffect(() => {
    checkAuth();
    loadProviderData();
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(() => {
      loadProviderData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkAuth = () => {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    
    if (!userRole || userRole !== 'PROVIDER' || !userId) {
      navigate('/');
      return;
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const loadProviderData = async () => {
    await Promise.all([
      loadProviderStats(),
      loadProviderVehicles(),
      loadProviderReservations()
    ]);
  };

  const loadProviderStats = async () => {
    if (!providerId) return;

    try {
      const vehiclesResponse = await apiService.getProviderVehicles(providerId);
      const vehicles = vehiclesResponse as Vehicle[];
      
      let totalSeats = 0;
      let occupiedSeats = 0;
      
      for (const vehicle of vehicles) {
        try {
          const seatsResponse = await apiService.getVehicleSeats(vehicle.id);
          const seats = seatsResponse as Seat[];
          totalSeats += seats.length;
          occupiedSeats += seats.filter(seat => !seat.available).length;
        } catch (error) {
          console.error('Erreur lors du chargement des sièges:', error);
          // Si pas de sièges dans la DB, utiliser la capacité du véhicule
          totalSeats += vehicle.capacity || 0;
        }
      }
      
      const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;
      
      setTotalVehicles(vehicles.length);
      setTotalSeats(totalSeats);
      setTotalReservations(occupiedSeats);
      setOccupancyRate(occupancyRate);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setTotalVehicles(0);
      setTotalSeats(0);
      setTotalReservations(0);
      setOccupancyRate(0);
    }
  };

  const loadProviderVehicles = async () => {
    if (!providerId) return;

    try {
      setLoading(true);
      const vehiclesResponse = await apiService.getProviderVehicles(providerId);
      setVehicles(vehiclesResponse as Vehicle[]);
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error);
      setError('Erreur lors du chargement des véhicules');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProviderReservations = async () => {
    if (!providerId) return;

    try {
      // Charger toutes les réservations et filtrer par provider
      const allReservationsResponse = await apiService.getAllReservations();
      const allReservations = allReservationsResponse as Reservation[];
      
      // Filtrer les réservations pour ce provider
      const providerReservations = allReservations.filter(reservation => 
        reservation.providerId === providerId
      );
      
      setReservations(providerReservations);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      // En cas d'erreur, initialiser avec un tableau vide
      setReservations([]);
    }
  };

  const toggleVehicleForm = () => {
    setShowVehicleForm(!showVehicleForm);
    if (!showVehicleForm) {
      resetVehicleForm();
    }
  };

  const cancelVehicleForm = () => {
    setShowVehicleForm(false);
    resetVehicleForm();
  };

  const resetVehicleForm = () => {
    setFormData({
      vehicleId: '',
      vehicleName: '',
      vehicleCapacity: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleLicense: '',
      vehicleStatus: 'draft'
    });
    setEditingVehicleId(null);
  };

  const editVehicle = async (vehicleId: string) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) {
        showAlert('Véhicule introuvable', 'error');
        return;
      }
      
      setFormData({
        vehicleId: vehicle.id,
        vehicleName: vehicle.name || '',
        vehicleCapacity: vehicle.capacity?.toString() || '',
        vehicleMake: vehicle.make || '',
        vehicleModel: vehicle.model || '',
        vehicleLicense: vehicle.licensePlate || '',
        vehicleStatus: vehicle.published ? 'published' : 'draft'
      });
      
      setShowVehicleForm(true);
      setEditingVehicleId(vehicleId);
    } catch (error) {
      console.error('Erreur lors du chargement du véhicule:', error);
      showAlert('Erreur lors du chargement du véhicule', 'error');
    }
  };

  const publishVehicle = async (vehicleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir publier ce véhicule ? Il sera visible par tous les utilisateurs.')) {
      try {
        await apiService.updateVehicleStatus(vehicleId, 'PUBLISHED');
        showAlert('Véhicule publié avec succès !', 'success');
        loadProviderVehicles();
        loadProviderStats();
      } catch (error) {
        console.error('Erreur lors de la publication:', error);
        showAlert('Erreur lors de la publication', 'error');
      }
    }
  };

  const unpublishVehicle = async (vehicleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir dépublier ce véhicule ? Il ne sera plus visible par les utilisateurs.')) {
      try {
        await apiService.updateVehicleStatus(vehicleId, 'DRAFT');
        showAlert('Véhicule dépublié avec succès !', 'success');
        loadProviderVehicles();
        loadProviderStats();
      } catch (error) {
        console.error('Erreur lors de la dépublication:', error);
        showAlert('Erreur lors de la dépublication', 'error');
      }
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.')) {
      try {
        await apiService.deleteVehicle(vehicleId);
        showAlert('Véhicule supprimé avec succès !', 'success');
        loadProviderVehicles();
        loadProviderStats();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showAlert('Erreur lors de la suppression', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!providerId) return;

    const vehicleData = {
      name: formData.vehicleName,
      capacity: parseInt(formData.vehicleCapacity),
      make: formData.vehicleMake,
      model: formData.vehicleModel,
      licensePlate: formData.vehicleLicense,
      published: formData.vehicleStatus === 'published',
      providerId: providerId
    };
    
    const isEditing = editingVehicleId && editingVehicleId.trim() !== '';
    
    try {
      if (isEditing) {
        showAlert('Modification non implémentée - veuillez recréer le véhicule', 'error');
      } else {
        await apiService.createVehicle(vehicleData);
        showAlert('Véhicule créé avec succès !', 'success');
        cancelVehicleForm();
        loadProviderVehicles();
        loadProviderStats();
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showAlert('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showAlert = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 5000);
  };

  // Fonction pour obtenir les sièges d'un véhicule (utilisé pour l'affichage)
  const [vehicleSeats, setVehicleSeats] = useState<{ [key: string]: Seat[] }>({});

  useEffect(() => {
    const loadAllSeats = async () => {
      const seatsMap: { [key: string]: Seat[] } = {};
      for (const vehicle of vehicles) {
        try {
          const seats = await apiService.getVehicleSeats(vehicle.id) as Seat[];
          seatsMap[vehicle.id] = seats;
        } catch (error) {
          console.error('Erreur lors du chargement des sièges:', error);
          // Créer des sièges par défaut si aucun n'existe
          const defaultSeats = Array.from({ length: vehicle.capacity || 0 }, (_, index) => ({
            id: `default-seat-${vehicle.id}-${index + 1}`,
            vehicleId: vehicle.id,
            label: `S${index + 1}`,
            seatNumber: `S${index + 1}`,
            available: true,
            isReserved: false
          }));
          seatsMap[vehicle.id] = defaultSeats;
        }
      }
      setVehicleSeats(seatsMap);
    };

    if (vehicles.length > 0) {
      loadAllSeats();
    }
  }, [vehicles]);

  if (loading) {
    return (
      <div className="provider-dashboard-container">
        <nav className="navbar">
          <h1>🚐 VCube-PS - Tableau de Bord Fournisseur</h1>
          <div className="user-info">
            <span>Chargement...</span>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="provider-dashboard-container">
      <nav className="navbar">
        <h1>🚐 VCube-PS - Tableau de Bord Fournisseur</h1>
        <div className="user-info">
          <span id="provider-name">{providerName}</span>
          <button className="logout-btn" onClick={logout}>Déconnexion</button>
        </div>
      </nav>

      <div className="container">
        {/* Alertes */}
        <div id="alert-container">
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              {success}
            </div>
          )}
        </div>
        
        {/* Statistiques */}
        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-icon">🚐</div>
            <div className="stat-number" id="total-vehicles">{totalVehicles}</div>
            <div className="stat-label">Mes Véhicules</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">💺</div>
            <div className="stat-number" id="total-seats">{totalSeats}</div>
            <div className="stat-label">Sièges Totaux</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">🎫</div>
            <div className="stat-number" id="total-reservations">{totalReservations}</div>
            <div className="stat-label">Réservations</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-number" id="occupancy-rate">{occupancyRate}%</div>
            <div className="stat-label">Taux d'Occupation</div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Gestion des véhicules */}
          <div className="card">
            <h2>🚐 Mes Véhicules</h2>
            
            <button className="btn toggle-form-btn" onClick={toggleVehicleForm}>
              <span id="form-toggle-text">
                {showVehicleForm ? '✖️ Fermer le formulaire' : '➕ Ajouter un Véhicule'}
              </span>
            </button>
            
            {showVehicleForm && (
              <div className="add-vehicle-form">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="vehicle-name">Nom du véhicule</label>
                    <input 
                      type="text" 
                      id="vehicle-name" 
                      name="vehicleName" 
                      value={formData.vehicleName}
                      onChange={handleInputChange}
                      required 
                      placeholder="Ex: Bus Express A1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="vehicle-capacity">Nombre de places</label>
                    <input 
                      type="number" 
                      id="vehicle-capacity" 
                      name="vehicleCapacity" 
                      value={formData.vehicleCapacity}
                      onChange={handleInputChange}
                      min="10" 
                      max="80" 
                      required 
                      placeholder="Ex: 40"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="vehicle-make">Marque</label>
                    <input 
                      type="text" 
                      id="vehicle-make" 
                      name="vehicleMake" 
                      value={formData.vehicleMake}
                      onChange={handleInputChange}
                      placeholder="Ex: Mercedes, Volvo, Iveco"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="vehicle-model">Modèle</label>
                    <input 
                      type="text" 
                      id="vehicle-model" 
                      name="vehicleModel" 
                      value={formData.vehicleModel}
                      onChange={handleInputChange}
                      placeholder="Ex: Citaro, 7900, Crossway"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="vehicle-license">Plaque d'immatriculation</label>
                    <input 
                      type="text" 
                      id="vehicle-license" 
                      name="vehicleLicense" 
                      value={formData.vehicleLicense}
                      onChange={handleInputChange}
                      placeholder="Ex: AB-123-CD"
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-primary">
                    {editingVehicleId ? 'Modifier le Véhicule' : 'Ajouter le Véhicule'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={cancelVehicleForm}>
                    Annuler
                  </button>
                </form>
              </div>
            )}
            
            <div id="vehicle-alert"></div>
            
            <div className="vehicle-list">
              {vehicles.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>Chargement des véhicules...</p>
              ) : (
                vehicles.map(vehicle => {
                  const seats = vehicleSeats[vehicle.id] || [];
                  const availableSeats = seats.filter(seat => seat.available).length;
                  const totalSeats = seats.length;

                  return (
                    <div key={vehicle.id} className="vehicle-item">
                      <div className="vehicle-header">
                        <div className="vehicle-title">
                          {vehicle.name || `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'Véhicule'}
                        </div>
                        <div className="vehicle-plate">
                          {vehicle.licensePlate || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="vehicle-info">
                        <div className="info-item">
                          <div className="info-label">Type</div>
                          <div className="info-value">{vehicle.make || 'N/A'} {vehicle.model || ''}</div>
                        </div>
                        <div className="info-item">
                          <div className="info-label">Capacité</div>
                          <div className="info-value">{vehicle.capacity || 0} places</div>
                        </div>
                        <div className="info-item">
                          <div className="info-label">Sièges disponibles</div>
                          <div className="info-value">{availableSeats} / {totalSeats}</div>
                        </div>
                        <div className="info-item">
                          <div className="info-label">Statut</div>
                          <div className="info-value">
                            <span className={`status-badge ${vehicle.published ? 'status-committed' : 'status-pending'}`}>
                              {vehicle.published ? 'Publié' : 'Brouillon'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Grille des sièges */}
                      <div className="seat-grid">
                        {seats.slice(0, 12).map((seat, index) => (
                          <div
                            key={seat.id}
                            className={`seat-mini ${seat.available ? 'available' : 'reserved'}`}
                          >
                            {index + 1}
                          </div>
                        ))}
                        {seats.length > 12 && (
                          <div className="seat-mini" style={{ background: '#999', color: 'white' }}>
                            +{seats.length - 12}
                          </div>
                        )}
                      </div>
                      
                      {/* Boutons d'action */}
                      <div className="vehicle-actions">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => editVehicle(vehicle.id)}
                          title="Modifier le véhicule"
                        >
                          ✏️ Modifier
                        </button>
                        
                        {vehicle.published ? (
                          <button 
                            className="btn btn-warning btn-sm"
                            onClick={() => unpublishVehicle(vehicle.id)}
                            title="Dépublier le véhicule"
                          >
                            👁️‍🗨️ Dépublier
                          </button>
                        ) : (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => publishVehicle(vehicle.id)}
                            title="Publier le véhicule"
                          >
                            📢 Publier
                          </button>
                        )}
                        
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteVehicle(vehicle.id)}
                          title="Supprimer le véhicule"
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Réservations */}
          <div className="card">
            <h2>📋 Réservations de mes Véhicules</h2>
            <div className="reservation-list">
              {reservations.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>Aucune réservation trouvée</p>
              ) : (
                reservations.map(reservation => {
                  const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
                  const statusClass = `status-${reservation.status.toLowerCase()}`;
                  const statusText = {
                    'PENDING': 'En attente',
                    'COMMITTED': 'Confirmée',
                    'REJECTED': 'Rejetée',
                    'CANCELLED': 'Annulée'
                  }[reservation.status] || reservation.status;

                  return (
                    <div key={reservation.id} className="reservation-item">
                      <div className="reservation-info">
                        <h4>Réservation #{reservation.id.substring(0, 8)}</h4>
                        <p><strong>Véhicule:</strong> {vehicle?.name || vehicle?.make || 'Véhicule inconnu'}</p>
                        <p><strong>Siège:</strong> {reservation.seatId.substring(0, 8)}...</p>
                        <p><strong>Date:</strong> {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <span className={`status-badge ${statusClass}`}>{statusText}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VCubePSProviderDashboard;
