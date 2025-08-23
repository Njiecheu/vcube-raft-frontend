import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import './VCubePSUserDashboard.css';

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

interface Provider {
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
  companyName?: string;
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
  providerName?: string;
}

const VCubePSUserDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // États principaux
  const [providers, setProviders] = useState<Provider[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<number | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentProviderId, setCurrentProviderId] = useState<string>('');

  const userName = localStorage.getItem('userName') || 'Utilisateur';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    checkAuth();
    loadVehicles();
    loadUserReservations();
    
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(() => {
      if (selectedVehicleId) {
        loadSeats();
      }
      loadUserReservations();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const checkAuth = () => {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    
    if (!userRole || userRole !== 'USER' || !userId) {
      navigate('/');
      return;
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Charger véhicules et fournisseurs
  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [vehiclesData, providersData] = await Promise.all([
        apiService.getAllVehicles(),
        apiService.getAllProviders()
      ]);

      setVehicles(vehiclesData as Vehicle[]);
      setProviders(providersData as Provider[]);
    } catch (err) {
      console.error('Erreur lors du chargement des véhicules:', err);
      setError('Erreur lors du chargement des véhicules');
    } finally {
      setLoading(false);
    }
  };

  // Charger les sièges d'un véhicule
  const loadSeats = async () => {
    if (!selectedVehicleId) {
      setSeats([]);
      return;
    }

    try {
      setError('');
      
      // Trouver le véhicule sélectionné pour récupérer le providerId
      const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
      if (selectedVehicle) {
        setCurrentProviderId(selectedVehicle.providerId);
      }

      const vehicleSeats = await apiService.getVehicleSeats(selectedVehicleId);
      const seatsData = vehicleSeats as Seat[];
      
      // Si pas de sièges dans la DB, créer des sièges par défaut
      if (seatsData.length === 0) {
        const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
        const capacity = selectedVehicle?.capacity || selectedVehicle?.seatCount || 0;
        
        const defaultSeats = Array.from({ length: capacity }, (_, index) => ({
          id: `default-seat-${selectedVehicleId}-${index + 1}`,
          vehicleId: selectedVehicleId,
          label: `S${index + 1}`,
          seatNumber: `S${index + 1}`,
          available: true,
          isReserved: false
        }));
        
        setSeats(defaultSeats);
      } else {
        setSeats(seatsData);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des sièges:', err);
      setError('Erreur lors du chargement des sièges');
    }
  };

  // Sélectionner un siège
  const selectSeat = (seatId: string, seatNumber: number) => {
    setSelectedSeat(seatId);
    setSelectedSeatNumber(seatNumber);
  };

  // Effectuer une réservation
  const makeReservation = async () => {
    if (!selectedSeat || !selectedVehicleId || !currentProviderId || !userId) {
      setError('Veuillez sélectionner un siège');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      await apiService.createReservation({
        userId,
        providerId: currentProviderId,
        vehicleId: selectedVehicleId,
        seatId: selectedSeat,
        status: 'COMMITTED'
      });

      setSuccess('Réservation effectuée avec succès !');
      
      // Réinitialiser la sélection
      setSelectedSeat(null);
      setSelectedSeatNumber(null);
      
      // Recharger les données
      await loadSeats();
      await loadUserReservations();
      
    } catch (err) {
      console.error('Erreur réservation:', err);
      setError('Erreur lors de la réservation');
    }
  };

  // Charger les réservations de l'utilisateur
  const loadUserReservations = async () => {
    if (!userId) return;

    try {
      const userReservations = await apiService.getUserReservations(userId);
      
      // Enrichir les réservations avec noms des véhicules et providers
      const enrichedReservations = (userReservations as Reservation[]).map(reservation => {
        const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
        const provider = providers.find(p => p.id === reservation.providerId);
        return {
          ...reservation,
          vehicleName: vehicle?.name || 'Véhicule inconnu',
          providerName: provider?.name || provider?.companyName || 'Fournisseur inconnu'
        };
      });
      
      setReservations(enrichedReservations);
    } catch (err) {
      console.error('Erreur lors du chargement des réservations:', err);
    }
  };

  // Annuler une réservation
  const cancelReservation = async (reservationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await apiService.cancelReservation(reservationId);
      setSuccess('Réservation annulée avec succès');
      
      await loadUserReservations();
      if (selectedVehicleId) {
        await loadSeats();
      }
    } catch (err) {
      console.error('Erreur d\'annulation:', err);
      setError('Erreur lors de l\'annulation');
    }
  };

  // Grouper véhicules par fournisseur
  const getGroupedVehicles = () => {
    const grouped: { [key: string]: { provider: Provider; vehicles: Vehicle[] } } = {};
    
    vehicles.forEach(vehicle => {
      const provider = providers.find(p => p.id === vehicle.providerId);
      if (provider) {
        if (!grouped[provider.id]) {
          grouped[provider.id] = { provider, vehicles: [] };
        }
        grouped[provider.id].vehicles.push(vehicle);
      }
    });
    
    return grouped;
  };

  // Gérer la sélection de véhicule
  const handleVehicleSelection = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setSelectedSeat(null);
    setSelectedSeatNumber(null);
    if (vehicleId) {
      // Petite attente pour que les états se mettent à jour
      setTimeout(() => loadSeats(), 100);
    }
  };

  const groupedVehicles = getGroupedVehicles();

  if (loading) {
    return (
      <div className="user-dashboard-container">
        <nav className="navbar">
          <h1>🚗 VCube-PS - Tableau de Bord Utilisateur</h1>
          <div className="user-info">
            <span>Chargement...</span>
          </div>
        </nav>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      <nav className="navbar">
        <h1>🚗 VCube-PS - Tableau de Bord Utilisateur</h1>
        <div className="user-info">
          <span id="user-name">{userName}</span>
          <button className="logout-btn" onClick={logout}>Déconnexion</button>
        </div>
      </nav>

      <div className="container">
        <div className="dashboard-grid">
          {/* Réservation de sièges */}
          <div className="card">
            <h2>🎫 Réserver un Siège</h2>
            
            <div className="vehicle-selector">
              <label htmlFor="vehicle-select">Sélectionner un véhicule :</label>
              <select 
                id="vehicle-select" 
                value={selectedVehicleId}
                onChange={(e) => handleVehicleSelection(e.target.value)}
              >
                <option value="">Choisir un véhicule...</option>
                {Object.values(groupedVehicles).map(({ provider, vehicles: providerVehicles }) => (
                  <optgroup key={provider.id} label={provider.name || provider.companyName || 'Fournisseur'}>
                    {providerVehicles.map(vehicle => {
                      let vehicleDisplay = vehicle.name || 'Véhicule';
                      if (vehicle.make && vehicle.model) {
                        vehicleDisplay = `${vehicle.make} ${vehicle.model}`;
                      } else if (vehicle.make) {
                        vehicleDisplay = vehicle.make;
                      } else if (vehicle.model) {
                        vehicleDisplay = vehicle.model;
                      }
                      
                      if (vehicle.licensePlate) {
                        vehicleDisplay += ` (${vehicle.licensePlate})`;
                      }

                      return (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicleDisplay}
                        </option>
                      );
                    })}
                  </optgroup>
                ))}
              </select>
            </div>
            
            {selectedVehicleId && (
              <div id="seat-map-container">
                <div className="seat-map" id="seat-map">
                  {seats.map((seat, index) => {
                    const isSelected = selectedSeat === seat.id;
                    const isReserved = !seat.available || seat.isReserved;
                    const seatNumber = index + 1;
                    
                    return (
                      <div
                        key={seat.id}
                        className={`seat ${isReserved ? 'reserved' : 'available'} ${isSelected ? 'selected' : ''}`}
                        onClick={() => seat.available && !seat.isReserved && selectSeat(seat.id, seatNumber)}
                        style={{ cursor: isReserved ? 'not-allowed' : 'pointer' }}
                      >
                        S{seatNumber}
                      </div>
                    );
                  })}
                </div>
                
                <div className="legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#28a745' }}></div>
                    <span>Disponible</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#dc3545' }}></div>
                    <span>Réservé</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#007bff' }}></div>
                    <span>Sélectionné</span>
                  </div>
                </div>
                
                <div className="reservation-form">
                  {selectedSeatNumber && (
                    <div id="selected-seat-info">
                      <p><strong>Siège sélectionné :</strong> S{selectedSeatNumber}</p>
                    </div>
                  )}
                  
                  <button 
                    id="reserve-btn" 
                    className="btn btn-primary" 
                    onClick={makeReservation}
                    disabled={!selectedSeat}
                  >
                    Réserver ce Siège
                  </button>
                </div>
              </div>
            )}
            
            <div id="reservation-alert">
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
          </div>
          
          {/* Mes réservations */}
          <div className="card">
            <h2>📋 Mes Réservations</h2>
            <div className="reservation-list" id="reservation-list">
              {reservations.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>Aucune réservation trouvée</p>
              ) : (
                reservations.map(reservation => {
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
                        <p><strong>Véhicule:</strong> {reservation.vehicleName}</p>
                        <p><strong>Fournisseur:</strong> {reservation.providerName}</p>
                        <p><strong>Siège:</strong> {reservation.seatId.substring(0, 8)}...</p>
                        <p><strong>Date:</strong> {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <div>
                        <span className={`status-badge ${statusClass}`}>{statusText}</span>
                        {reservation.status === 'COMMITTED' && (
                          <button 
                            className="btn" 
                            style={{ 
                              marginTop: '0.5rem', 
                              padding: '0.4rem 0.8rem', 
                              fontSize: '0.8rem', 
                              background: '#dc3545', 
                              color: 'white' 
                            }}
                            onClick={() => cancelReservation(reservation.id)}
                          >
                            Annuler
                          </button>
                        )}
                      </div>
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

export default VCubePSUserDashboard;
