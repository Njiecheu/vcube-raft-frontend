import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import './UserDashboard.css';

interface Provider {
  id: string;
  name: string;
  email: string;
}

interface Vehicle {
  id: string;
  model: string;
  seatCount: number;
  status: string;
  providerId: string;
}

interface Seat {
  id: string;
  seatNumber: string;
  isReserved: boolean;
  reservedBy?: string;
  vehicleId: string;
}

interface Reservation {
  id: string;
  userId: string;
  providerId: string;
  vehicleId: string;
  seatId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'PENDING';
  createdAt: string;
  vehicleModel?: string;
  seatNumber?: string;
  providerName?: string;
}

const UserDashboard: React.FC = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'reservations'>('browse');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError('');

      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('Utilisateur non connecté');
        return;
      }

      // Charger les données
      const [allProviders, allVehicles, userReservations] = await Promise.all([
        apiService.getAllProviders(),
        apiService.getAllVehicles(),
        apiService.getUserReservations(userId)
      ]);

      // Filtrer les véhicules publiés uniquement
      const publishedVehicles = (allVehicles as any[]).filter(
        (vehicle: any) => vehicle.status === 'PUBLISHED'
      );

      setProviders(allProviders as Provider[]);
      setVehicles(publishedVehicles);
      
      // Enrichir les réservations avec les informations des véhicules et fournisseurs
      const enrichedReservations = (userReservations as Reservation[]).map(reservation => {
        const vehicle = publishedVehicles.find((v: any) => v.id === reservation.vehicleId);
        const provider = (allProviders as Provider[]).find(p => p.id === reservation.providerId);
        
        return {
          ...reservation,
          vehicleModel: vehicle?.model || vehicle?.name || 'Véhicule inconnu',
          providerName: provider?.name || 'Fournisseur inconnu',
          seatNumber: reservation.seatId ? `Siège ${reservation.seatId.slice(-4)}` : 'N/A'
        };
      });
      
      setReservations(enrichedReservations);

    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur user dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicleSeats = async (vehicleId: string) => {
    try {
      const vehicleSeats = await apiService.getVehicleSeats(vehicleId);
      setSeats(vehicleSeats as Seat[]);
    } catch (err) {
      setError('Erreur lors du chargement des sièges');
      console.error('Erreur chargement sièges:', err);
    }
  };

  const handleVehicleSelect = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSelectedSeats([]);
    await loadVehicleSeats(vehicle.id);
  };

  const handleSeatToggle = (seatId: string, isReserved: boolean) => {
    if (isReserved) return; // Ne pas permettre la sélection de sièges déjà réservés

    setSelectedSeats(prev => {
      if (prev.includes(seatId)) {
        return prev.filter(id => id !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };

  const handleReservation = async () => {
    if (selectedSeats.length === 0) {
      setError('Veuillez sélectionner au moins un siège');
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('Utilisateur non connecté');
        return;
      }

      // Créer les réservations pour chaque siège sélectionné
      for (const seatId of selectedSeats) {
        await apiService.createReservation({
          userId,
          vehicleId: selectedVehicle!.id,
          seatId,
          status: 'CONFIRMED'
        });
      }

      // Recharger les données
      await loadUserData();
      await loadVehicleSeats(selectedVehicle!.id);
      setSelectedSeats([]);
      
      alert(`Réservation confirmée pour ${selectedSeats.length} siège(s) !`);

    } catch (err) {
      setError('Erreur lors de la réservation');
      console.error('Erreur réservation:', err);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await apiService.cancelReservation(reservationId);
      await loadUserData();
      
      // Recharger les sièges si un véhicule est sélectionné
      if (selectedVehicle) {
        await loadVehicleSeats(selectedVehicle.id);
      }

    } catch (err) {
      setError('Erreur lors de l\'annulation');
      console.error('Erreur annulation:', err);
    }
  };

  const handleDeleteCancelledReservation = async (reservationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette réservation ?')) {
      return;
    }

    try {
      await apiService.deleteReservation(reservationId);
      await loadUserData();
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error('Erreur suppression:', err);
    }
  };

  const renderSeatGrid = () => {
    if (!selectedVehicle || seats.length === 0) {
      return (
        <div className="seat-grid-placeholder">
          <p>Sélectionnez un véhicule pour voir les sièges disponibles</p>
        </div>
      );
    }

    // Créer une grille de sièges (par exemple 4 sièges par rangée)
    const seatsPerRow = 4;
    const rows = Math.ceil(selectedVehicle.seatCount / seatsPerRow);
    
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
                const seatNumber = rowIndex * seatsPerRow + seatIndex + 1;
                if (seatNumber > selectedVehicle.seatCount) return null;

                const seatLabel = `S${seatNumber}`;
                const seat = seats.find(s => s.seatNumber === seatLabel) || {
                  id: `seat-${seatNumber}`,
                  seatNumber: seatLabel,
                  isReserved: false,
                  vehicleId: selectedVehicle.id
                };

                const isSelected = selectedSeats.includes(seat.id);
                const isReserved = seat.isReserved;

                return (
                  <button
                    key={seat.id}
                    className={`seat ${isReserved ? 'reserved' : 'available'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSeatToggle(seat.id, isReserved)}
                    disabled={isReserved}
                    title={isReserved ? 'Siège déjà réservé' : `Siège ${seat.seatNumber}`}
                  >
                    {seat.seatNumber}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {selectedSeats.length > 0 && (
          <div className="reservation-summary">
            <p>Sièges sélectionnés: {selectedSeats.length}</p>
            <button className="reserve-btn" onClick={handleReservation}>
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
        <div className="loading-container">
          <div className="loading-spinner">🎫 Chargement des véhicules disponibles...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <header className="dashboard-header">
        <h1>🎫 Dashboard Utilisateur</h1>
        <p>Réservez vos sièges dans les véhicules disponibles</p>
      </header>

      {error && (
        <div className="error-banner">
          <p>❌ {error}</p>
          <button onClick={loadUserData}>🔄 Réessayer</button>
        </div>
      )}

      {/* Navigation */}
      <nav className="dashboard-nav">
        <button 
          className={`nav-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
        >
          🚐 Parcourir les Véhicules
        </button>
        <button 
          className={`nav-btn ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          🎫 Mes Réservations ({reservations.length})
        </button>
      </nav>

      {/* Onglet Parcourir */}
      {activeTab === 'browse' && (
        <div className="browse-section">
          {/* Liste des fournisseurs */}
          <section className="providers-section">
            <h3>🏢 Fournisseurs Disponibles ({providers.length})</h3>
            <div className="providers-grid">
              {providers.map((provider) => {
                const providerVehicles = vehicles.filter(v => v.providerId === provider.id);
                return (
                  <div key={provider.id} className="provider-card">
                    <h4>{provider.name}</h4>
                    <p>{provider.email}</p>
                    <span className="vehicle-count">{providerVehicles.length} véhicule(s)</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Liste des véhicules */}
          <section className="vehicles-section">
            <h3>🚐 Véhicules Disponibles ({vehicles.length})</h3>
            <div className="vehicles-grid">
              {vehicles.map((vehicle) => {
                const provider = providers.find(p => p.id === vehicle.providerId);
                return (
                  <div 
                    key={vehicle.id} 
                    className={`vehicle-card ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
                    onClick={() => handleVehicleSelect(vehicle)}
                  >
                    <h4>{vehicle.model}</h4>
                    <p>Fournisseur: {provider?.name || 'Inconnu'}</p>
                    <span className="seat-count">💺 {vehicle.seatCount} places</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sélection des sièges */}
          {selectedVehicle && (
            <section className="seat-selection-section">
              <h3>💺 Sélection des Sièges - {selectedVehicle.model}</h3>
              {renderSeatGrid()}
            </section>
          )}
        </div>
      )}

      {/* Onglet Réservations */}
      {activeTab === 'reservations' && (
        <div className="reservations-section">
          <h3>🎫 Mes Réservations ({reservations.length})</h3>
          
          {reservations.length === 0 ? (
            <div className="empty-state">
              <p>Aucune réservation trouvée. Commencez par réserver un siège !</p>
            </div>
          ) : (
            <div className="reservations-list">
              {reservations.map((reservation) => (
                <div key={reservation.id} className={`reservation-card ${reservation.status.toLowerCase()}`}>
                  <div className="reservation-header">
                    <h4>Réservation #{reservation.id.slice(-6)}</h4>
                    <div className={`status-badge ${reservation.status.toLowerCase()}`}>
                      {reservation.status === 'CONFIRMED' ? '✅ Confirmée' : 
                       reservation.status === 'CANCELLED' ? '❌ Annulée' : 
                       '⏳ En attente'}
                    </div>
                  </div>

                  <div className="reservation-details">
                    <p><strong>Véhicule:</strong> {reservation.vehicleModel || 'N/A'}</p>
                    <p><strong>Siège:</strong> {reservation.seatNumber || 'N/A'}</p>
                    <p><strong>Fournisseur:</strong> {reservation.providerName || 'N/A'}</p>
                    <p><strong>Date:</strong> {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>

                  <div className="reservation-actions">
                    {reservation.status === 'CONFIRMED' && (
                      <button 
                        className="cancel-btn"
                        onClick={() => handleCancelReservation(reservation.id)}
                      >
                        ❌ Annuler la réservation
                      </button>
                    )}
                    
                    {reservation.status === 'CANCELLED' && (
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteCancelledReservation(reservation.id)}
                      >
                        🗑️ Supprimer définitivement
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
  );
};

export default UserDashboard;
