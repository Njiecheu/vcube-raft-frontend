import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import './UserDashboard.css';

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

const NewUserDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // États principaux
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'providers' | 'reservations'>('providers');

  const userName = localStorage.getItem('userName') || 'Utilisateur';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    loadInitialData();
  }, []);

  // Charger les données initiales
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [providersData, userReservations] = await Promise.all([
        apiService.getAllProviders(),
        userId ? apiService.getUserReservations(userId) : Promise.resolve([])
      ]);

      setProviders(providersData as Provider[]);
      setReservations(userReservations as Reservation[]);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les véhicules d'un fournisseur
  const loadProviderVehicles = async (provider: Provider) => {
    try {
      setError('');
      setSelectedProvider(provider);
      setSelectedVehicle(null);
      setSeats([]);
      setSelectedSeats([]);

      const allVehicles = await apiService.getAllVehicles();
      const providerVehicles = (allVehicles as Vehicle[]).filter(
        vehicle => vehicle.providerId === provider.id && vehicle.published
      );
      
      setVehicles(providerVehicles);
    } catch (err) {
      setError('Erreur lors du chargement des véhicules');
      console.error('Erreur chargement véhicules:', err);
    }
  };

  // Charger les sièges d'un véhicule
  const loadVehicleSeats = async (vehicle: Vehicle) => {
    try {
      setError('');
      setSelectedVehicle(vehicle);
      setSelectedSeats([]);

      const vehicleSeats = await apiService.getVehicleSeats(vehicle.id);
      setSeats(vehicleSeats as Seat[]);
    } catch (err) {
      setError('Erreur lors du chargement des sièges');
      console.error('Erreur chargement sièges:', err);
    }
  };

  // Gérer la sélection des sièges
  const toggleSeatSelection = (seatId: string, isReserved: boolean) => {
    if (isReserved) return;

    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  // Effectuer une réservation
  const makeReservation = async () => {
    if (!selectedVehicle || selectedSeats.length === 0 || !userId) {
      setError('Veuillez sélectionner des sièges');
      return;
    }

    try {
      setError('');
      
      for (const seatId of selectedSeats) {
        await apiService.createReservation({
          userId,
          vehicleId: selectedVehicle.id,
          seatId,
          status: 'COMMITTED'
        });
      }

      alert(`Réservation confirmée pour ${selectedSeats.length} siège(s) !`);
      
      // Recharger les données
      await loadInitialData();
      await loadVehicleSeats(selectedVehicle);
      setSelectedSeats([]);
      
    } catch (err) {
      setError('Erreur lors de la réservation');
      console.error('Erreur réservation:', err);
    }
  };

  // Annuler une réservation
  const cancelReservation = async (reservationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await apiService.cancelReservation(reservationId);
      await loadInitialData();
      
      if (selectedVehicle) {
        await loadVehicleSeats(selectedVehicle);
      }
    } catch (err) {
      setError('Erreur lors de l\'annulation');
      console.error('Erreur annulation:', err);
    }
  };

  // Supprimer une réservation
  const deleteReservation = async (reservationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette réservation ?')) {
      return;
    }

    try {
      await apiService.deleteReservation(reservationId);
      await loadInitialData();
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error('Erreur suppression:', err);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Rendu de la grille de sièges
  const renderSeatGrid = () => {
    if (!selectedVehicle) {
      return (
        <div className="seat-grid-placeholder">
          <p>Sélectionnez un véhicule pour voir les sièges disponibles</p>
        </div>
      );
    }

    // Si pas de sièges chargés, créer des sièges par défaut
    const seatsToRender = seats.length > 0 ? seats : 
      Array.from({ length: selectedVehicle.capacity || selectedVehicle.seatCount || 0 }, (_, index) => ({
        id: `seat-${index + 1}`,
        vehicleId: selectedVehicle.id,
        label: `S${index + 1}`,
        seatNumber: `S${index + 1}`,
        available: true,
        isReserved: false
      }));

    const seatsPerRow = 4;
    const rows = Math.ceil(seatsToRender.length / seatsPerRow);
    
    return (
      <div className="seat-grid">
        <div className="seat-legend">
          <div className="legend-item">
            <div className="seat-demo available"></div>
            <span>Disponible</span>
          </div>
          <div className="legend-item">
            <div className="seat-demo reserved"></div>
            <span>Réservé</span>
          </div>
          <div className="legend-item">
            <div className="seat-demo selected"></div>
            <span>Sélectionné</span>
          </div>
        </div>

        <div className="seat-rows">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="seat-row">
              {Array.from({ length: seatsPerRow }, (_, seatIndex) => {
                const seatNumber = rowIndex * seatsPerRow + seatIndex;
                if (seatNumber >= seatsToRender.length) return null;

                const seat = seatsToRender[seatNumber];
                const isSelected = selectedSeats.includes(seat.id);
                const isReserved = !seat.available || !!seat.isReserved;

                return (
                  <button
                    key={seat.id}
                    className={`seat ${isReserved ? 'reserved' : 'available'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSeatSelection(seat.id, isReserved)}
                    disabled={isReserved}
                    title={isReserved ? 'Siège déjà réservé' : `Siège ${seat.label || seat.seatNumber}`}
                  >
                    {seat.label || seat.seatNumber}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {selectedSeats.length > 0 && (
          <div className="reservation-summary">
            <p>Sièges sélectionnés: {selectedSeats.length}</p>
            <button className="reserve-btn" onClick={makeReservation}>
              🎫 Réserver {selectedSeats.length} siège(s)
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="dashboard-header">
          <h1>Tableau de bord utilisateur</h1>
        </div>
        <div className="loading">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>👤 Bienvenue {userName}</h1>
            <p>Recherchez et réservez vos places</p>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => setError('')}>✖️</button>
        </div>
      )}

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'providers' ? 'active' : ''}`}
          onClick={() => setActiveTab('providers')}
        >
          🚐 Fournisseurs & Véhicules
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          🎫 Mes Réservations ({reservations.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'providers' && (
          <div className="providers-section">
            <div className="content-layout">
              {/* Section Fournisseurs */}
              <div className="providers-panel">
                <h2>🏢 Fournisseurs disponibles</h2>
                {providers.length === 0 ? (
                  <div className="empty-state">
                    <p>Aucun fournisseur disponible</p>
                  </div>
                ) : (
                  <div className="providers-grid">
                    {providers.map(provider => (
                      <div 
                        key={provider.id} 
                        className={`provider-card ${selectedProvider?.id === provider.id ? 'selected' : ''}`}
                        onClick={() => loadProviderVehicles(provider)}
                      >
                        <div className="provider-header">
                          <h3>{provider.name}</h3>
                          <span className="provider-role">Fournisseur</span>
                        </div>
                        <div className="provider-info">
                          <p>📧 {provider.email}</p>
                          {provider.phoneNumber && (
                            <p>📞 {provider.phoneNumber}</p>
                          )}
                        </div>
                        <div className="provider-actions">
                          <span className="click-hint">Cliquer pour voir les véhicules</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section Véhicules */}
              {selectedProvider && (
                <div className="vehicles-panel">
                  <h2>🚗 Véhicules de {selectedProvider.name}</h2>
                  {vehicles.length === 0 ? (
                    <div className="empty-state">
                      <p>Aucun véhicule publié par ce fournisseur</p>
                    </div>
                  ) : (
                    <div className="vehicles-grid">
                      {vehicles.map(vehicle => (
                        <div 
                          key={vehicle.id} 
                          className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                          onClick={() => loadVehicleSeats(vehicle)}
                        >
                          <div className="vehicle-header">
                            <h3>{vehicle.name}</h3>
                            <span className="vehicle-published">✅ Publié</span>
                          </div>
                          <div className="vehicle-details">
                            <p><strong>Marque:</strong> {vehicle.make}</p>
                            <p><strong>Modèle:</strong> {vehicle.model}</p>
                            <p><strong>Plaque:</strong> {vehicle.licensePlate}</p>
                            <p><strong>Capacité:</strong> {vehicle.capacity || vehicle.seatCount} places</p>
                          </div>
                          <div className="vehicle-actions">
                            <span className="click-hint">Cliquer pour sélectionner des sièges</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section Sièges */}
              {selectedVehicle && (
                <div className="seats-panel">
                  <h2>💺 Sièges - {selectedVehicle.name}</h2>
                  {renderSeatGrid()}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="reservations-section">
            <h2>🎫 Mes Réservations</h2>
            {reservations.length === 0 ? (
              <div className="empty-state">
                <p>Vous n'avez aucune réservation</p>
                <button 
                  className="primary-btn"
                  onClick={() => setActiveTab('providers')}
                >
                  ➕ Faire une réservation
                </button>
              </div>
            ) : (
              <div className="reservations-grid">
                {reservations.map(reservation => (
                  <div key={reservation.id} className="reservation-card">
                    <div className="reservation-header">
                      <h3>Réservation #{reservation.id.substring(0, 8)}</h3>
                      <span className={`status status-${reservation.status.toLowerCase()}`}>
                        {reservation.status === 'COMMITTED' && '✅ Confirmée'}
                        {reservation.status === 'PENDING' && '⏳ En attente'}
                        {reservation.status === 'CANCELLED' && '❌ Annulée'}
                        {reservation.status === 'REJECTED' && '🚫 Rejetée'}
                      </span>
                    </div>
                    <div className="reservation-details">
                      <p><strong>Véhicule:</strong> {reservation.vehicleId}</p>
                      <p><strong>Siège:</strong> {reservation.seatId}</p>
                      <p><strong>Date:</strong> {new Date(reservation.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="reservation-actions">
                      {reservation.status === 'COMMITTED' && (
                        <button 
                          className="cancel-btn"
                          onClick={() => cancelReservation(reservation.id)}
                        >
                          ❌ Annuler
                        </button>
                      )}
                      {reservation.status === 'CANCELLED' && (
                        <button 
                          className="delete-btn"
                          onClick={() => deleteReservation(reservation.id)}
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewUserDashboard;
