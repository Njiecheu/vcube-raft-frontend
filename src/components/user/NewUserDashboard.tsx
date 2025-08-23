import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import './UserDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  licensePlate: string;
  capacity: number;
  published: boolean;
  providerId: string;
}

interface Seat {
  id: string;
  vehicleId: string;
  seatNumber: number;
  available: boolean;
  reserved?: boolean;
}

interface Provider {
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
}

interface Reservation {
  id: string;
  userId: string;
  providerId: string;
  vehicleId: string;
  seatId: string;
  status: 'COMMITTED' | 'PENDING' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
}

interface VehicleWithSeats extends Vehicle {
  seats: Seat[];
  provider?: Provider;
}

const NewUserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithSeats[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const userName = localStorage.getItem('userName') || 'Utilisateur';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Charger providers, vehicles et réservations en parallèle
      const [providersData, vehiclesData, reservationsData] = await Promise.all([
        loadProviders(),
        loadVehicles(),
        loadUserReservations()
      ]);

      setProviders(providersData as Provider[]);
      setReservations(reservationsData as Reservation[]);
      
      // Enrichir les vehicles avec les sièges et providers
      const enrichedVehicles = await Promise.all(
        (vehiclesData as Vehicle[]).map(async (vehicle: Vehicle) => {
          const seats = await loadSeats(vehicle.id);
          const provider = (providersData as Provider[]).find((p: Provider) => p.id === vehicle.providerId);
          return { ...vehicle, seats, provider };
        })
      );
      
      setVehicles(enrichedVehicles);
    } catch (err) {
      console.error('Erreur chargement données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test/providers`);
      return await response.json();
    } catch (error) {
      console.error('Erreur providers:', error);
      return [];
    }
  };

  const loadVehicles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/test/vehicles`);
      return await response.json();
    } catch (error) {
      console.error('Erreur vehicles:', error);
      return [];
    }
  };

  const loadSeats = async (vehicleId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/seats`);
      if (!response.ok) {
        // Générer des sièges mock si l'API n'existe pas
        const vehicle = vehicles.find(v => v.id === vehicleId);
        const capacity = vehicle?.capacity || 10;
        return Array.from({ length: capacity }, (_, index) => ({
          id: `seat-${vehicleId}-${index + 1}`,
          vehicleId,
          seatNumber: index + 1,
          available: Math.random() > 0.3, // 70% de chance d'être disponible
          reserved: false
        }));
      }
      return await response.json();
    } catch (error) {
      console.error('Erreur seats:', error);
      // Générer des sièges mock
      return Array.from({ length: 10 }, (_, index) => ({
        id: `seat-${vehicleId}-${index + 1}`,
        vehicleId,
        seatNumber: index + 1,
        available: Math.random() > 0.3,
        reserved: false
      }));
    }
  };

  const loadUserReservations = async () => {
    try {
      return await apiService.getUserReservations();
    } catch (error) {
      console.error('Erreur réservations:', error);
      return [];
    }
  };

  const reserveSeat = async () => {
    if (!selectedSeat || !selectedVehicle) {
      setError('Veuillez sélectionner un siège');
      return;
    }

    try {
      setLoading(true);
      const reservationData = {
        userId,
        providerId: selectedProvider,
        vehicleId: selectedVehicle,
        seatId: selectedSeat
      };

      const response = await fetch(`${API_BASE_URL}/reservations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-User-Role': 'USER'
        },
        body: JSON.stringify(reservationData)
      });

      if (response.ok) {
        setSelectedSeat('');
        setSelectedVehicle('');
        setSelectedProvider('');
        await loadData(); // Recharger les données
      } else {
        setError('Erreur lors de la réservation');
      }
    } catch (err) {
      setError('Erreur lors de la réservation');
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-User-Role': 'USER'
        }
      });

      if (response.ok) {
        await loadData();
      } else {
        setError('Erreur lors de l\'annulation');
      }
    } catch (err) {
      setError('Erreur lors de l\'annulation');
    } finally {
      setLoading(false);
    }
  };

  const deleteReservation = async (reservationId: string) => {
    try {
      setLoading(true);
      // Supprimer définitivement la réservation annulée
      const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId || '',
          'X-User-Role': 'USER'
        }
      });

      if (response.ok || response.status === 404) {
        // Retirer de l'état local même si l'API retourne 404
        setReservations(prev => prev.filter(r => r.id !== reservationId));
      } else {
        setError('Erreur lors de la suppression');
      }
    } catch (err) {
      setError('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getSeatColor = (seat: Seat) => {
    if (selectedSeat === seat.id) return '#007bff'; // Bleu pour sélectionné
    if (!seat.available) return '#dc3545'; // Rouge pour occupé
    return '#28a745'; // Vert pour disponible
  };

  const getSeatLabel = (seat: Seat) => {
    return `S${seat.seatNumber}`;
  };

  const filteredVehicles = selectedProvider 
    ? vehicles.filter(v => v.providerId === selectedProvider && v.published)
    : vehicles.filter(v => v.published);

  return (
    <div className="user-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🚌 Dashboard Utilisateur</h1>
          <div className="header-info">
            <span>👤 {userName}</span>
            <button onClick={logout} className="logout-btn">🚪 Déconnexion</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="alert-close">×</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Réservations Totales</h3>
              <p className="stat-number">{reservations.length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Confirmées</h3>
              <p className="stat-number">{reservations.filter(r => r.status === 'COMMITTED').length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>En Attente</h3>
              <p className="stat-number">{reservations.filter(r => r.status === 'PENDING').length}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚌</div>
            <div className="stat-content">
              <h3>Véhicules Disponibles</h3>
              <p className="stat-number">{vehicles.filter(v => v.published).length}</p>
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div className="booking-section">
          <h2>🎫 Nouvelle Réservation</h2>
          
          <div className="booking-form">
            {/* Select Provider */}
            <div className="form-group">
              <label>Fournisseur de Transport</label>
              <select 
                value={selectedProvider} 
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  setSelectedVehicle('');
                  setSelectedSeat('');
                }}
                disabled={loading}
              >
                <option value="">Tous les fournisseurs</option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Vehicle */}
            <div className="form-group">
              <label>Véhicule</label>
              <select 
                value={selectedVehicle} 
                onChange={(e) => {
                  setSelectedVehicle(e.target.value);
                  setSelectedSeat('');
                }}
                disabled={loading || !filteredVehicles.length}
              >
                <option value="">Sélectionnez un véhicule</option>
                {filteredVehicles.map(vehicle => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} ({vehicle.make} {vehicle.model}) - {vehicle.licensePlate}
                  </option>
                ))}
              </select>
            </div>

            {/* Seat Selection */}
            {selectedVehicle && (
              <div className="seat-selection">
                <h3>Sélection des Sièges</h3>
                <div className="seat-map">
                  {vehicles.find(v => v.id === selectedVehicle)?.seats.map(seat => (
                    <button
                      key={seat.id}
                      className={`seat ${selectedSeat === seat.id ? 'selected' : ''}`}
                      style={{ backgroundColor: getSeatColor(seat) }}
                      onClick={() => seat.available ? setSelectedSeat(seat.id) : null}
                      disabled={!seat.available || loading}
                      title={`Siège ${seat.seatNumber} - ${seat.available ? 'Disponible' : 'Occupé'}`}
                    >
                      {getSeatLabel(seat)}
                    </button>
                  ))}
                </div>
                
                <div className="seat-legend">
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#28a745' }}></div>
                    <span>Disponible</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#dc3545' }}></div>
                    <span>Occupé</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#007bff' }}></div>
                    <span>Sélectionné</span>
                  </div>
                </div>

                {selectedSeat && (
                  <button 
                    onClick={reserveSeat} 
                    disabled={loading}
                    className="reserve-btn"
                  >
                    {loading ? 'Réservation...' : '🎫 Réserver ce Siège'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reservations History */}
        <div className="reservations-section">
          <h2>📋 Mes Réservations</h2>
          
          {loading && <div className="loading">Chargement...</div>}
          
          {!loading && reservations.length === 0 && (
            <div className="no-data">
              <p>Aucune réservation trouvée.</p>
            </div>
          )}

          {!loading && reservations.length > 0 && (
            <div className="reservations-list">
              {reservations.map(reservation => {
                const vehicle = vehicles.find(v => v.id === reservation.vehicleId);
                const provider = providers.find(p => p.id === reservation.providerId);
                
                return (
                  <div key={reservation.id} className="reservation-card">
                    <div className="reservation-header">
                      <div className="reservation-info">
                        <h4>{vehicle?.name || 'Véhicule inconnu'}</h4>
                        <p>{provider?.name || 'Fournisseur inconnu'}</p>
                      </div>
                      <div className="reservation-status">
                        <span className={`status-badge status-${reservation.status.toLowerCase()}`}>
                          {reservation.status === 'COMMITTED' ? '✅ Confirmé' :
                           reservation.status === 'PENDING' ? '⏳ En attente' :
                           reservation.status === 'REJECTED' ? '❌ Rejeté' : '🚫 Annulé'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="reservation-details">
                      <p><strong>Siège:</strong> {reservation.seatId}</p>
                      <p><strong>Date:</strong> {new Date(reservation.createdAt).toLocaleString()}</p>
                      <p><strong>Véhicule:</strong> {vehicle?.licensePlate || 'N/A'}</p>
                    </div>
                    
                    <div className="reservation-actions">
                      {reservation.status === 'COMMITTED' && (
                        <button 
                          onClick={() => cancelReservation(reservation.id)}
                          disabled={loading}
                          className="cancel-btn"
                        >
                          🚫 Annuler
                        </button>
                      )}
                      {reservation.status === 'CANCELLED' && (
                        <button 
                          onClick={() => deleteReservation(reservation.id)}
                          disabled={loading}
                          className="delete-btn"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NewUserDashboard;
