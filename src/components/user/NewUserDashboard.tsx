import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/apiService';
import './NewUserDashboard.css';

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
  vehicleName?: string;
  providerName?: string;
}

const NewUserDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // États principaux
  const [providers, setProviders] = useState<Provider[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userName = localStorage.getItem('userName') || 'Utilisateur';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    loadAllData();
  }, []);

  // Charger toutes les données initiales
  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [providersData, vehiclesData, userReservations] = await Promise.all([
        apiService.getAllProviders(),
        apiService.getAllVehicles(), 
        userId ? apiService.getUserReservations(userId) : Promise.resolve([])
      ]);

      setProviders(providersData as Provider[]);
      
      // Filtrer seulement les véhicules publiés
      const publishedVehicles = (vehiclesData as Vehicle[]).filter(v => v.published);
      setVehicles(publishedVehicles);
      
      // Enrichir les réservations avec noms des véhicules et providers
      const enrichedReservations = (userReservations as Reservation[]).map(reservation => {
        const vehicle = (vehiclesData as Vehicle[]).find(v => v.id === reservation.vehicleId);
        const provider = (providersData as Provider[]).find(p => p.id === reservation.providerId);
        return {
          ...reservation,
          vehicleName: vehicle?.name || 'Véhicule inconnu',
          providerName: provider?.name || 'Fournisseur inconnu'
        };
      });
      
      setReservations(enrichedReservations);
    } catch (err) {
      console.error('Erreur chargement données:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Charger les sièges quand un véhicule est sélectionné
  const handleVehicleSelection = async (vehicleId: string) => {
    if (!vehicleId) {
      setSeats([]);
      setSelectedSeats([]);
      setSelectedVehicleId('');
      return;
    }

    try {
      setError('');
      setSelectedVehicleId(vehicleId);
      setSelectedSeats([]);
      
      const vehicleSeats = await apiService.getVehicleSeats(vehicleId);
      const seatsData = vehicleSeats as Seat[];
      
      // Si pas de sièges dans la DB, créer des sièges par défaut
      if (seatsData.length === 0) {
        const selectedVehicle = vehicles.find(v => v.id === vehicleId);
        const capacity = selectedVehicle?.capacity || selectedVehicle?.seatCount || 0;
        
        const defaultSeats = Array.from({ length: capacity }, (_, index) => ({
          id: `default-seat-${vehicleId}-${index + 1}`,
          vehicleId: vehicleId,
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
      console.error('Erreur chargement sièges:', err);
      setError('Erreur lors du chargement des sièges');
    }
  };

  // Gérer la sélection des sièges
  const toggleSeatSelection = (seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat || !seat.available || seat.isReserved) return;

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
    if (!selectedVehicleId || selectedSeats.length === 0 || !userId) {
      setError('Veuillez sélectionner des sièges');
      return;
    }

    try {
      setError('');
      
      for (const seatId of selectedSeats) {
        await apiService.createReservation({
          userId,
          vehicleId: selectedVehicleId,
          seatId,
          status: 'COMMITTED'
        });
      }

      alert(`Réservation confirmée pour ${selectedSeats.length} siège(s) !`);
      
      // Recharger les données
      await loadAllData();
      await handleVehicleSelection(selectedVehicleId);
      
    } catch (err) {
      console.error('Erreur réservation:', err);
      setError('Erreur lors de la réservation');
    }
  };

  // Annuler une réservation
  const cancelReservation = async (reservationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      await apiService.cancelReservation(reservationId);
      await loadAllData();
      
      // Recharger les sièges si un véhicule est sélectionné
      if (selectedVehicleId) {
        await handleVehicleSelection(selectedVehicleId);
      }
    } catch (err) {
      console.error('Erreur annulation:', err);
      setError('Erreur lors de l\'annulation');
    }
  };

  // Supprimer une réservation
  const deleteReservation = async (reservationId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer définitivement cette réservation ?')) {
      return;
    }

    try {
      await apiService.deleteReservation(reservationId);
      await loadAllData();
    } catch (err) {
      console.error('Erreur suppression:', err);
      setError('Erreur lors de la suppression');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Grouper véhicules par fournisseur pour le select
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

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="dashboard-header">
          <h1>Chargement...</h1>
        </div>
      </div>
    );
  }

  const groupedVehicles = getGroupedVehicles();

  return (
    <div className="user-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>👤 Dashboard Utilisateur - {userName}</h1>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={() => setError('')}>✖️</button>
        </div>
      )}

      {/* Layout principal avec 3 divisions */}
      <div className="dashboard-layout">
        
        {/* DIV 1: Liste déroulante Providers/Véhicules */}
        <div className="selection-panel">
          <h2>🚗 Sélection du véhicule</h2>
          <div className="vehicle-selector">
            <label htmlFor="vehicle-select">Choisir un véhicule :</label>
            <select
              id="vehicle-select"
              value={selectedVehicleId}
              onChange={(e) => handleVehicleSelection(e.target.value)}
              className="vehicle-dropdown"
            >
              <option value="">-- Sélectionner un véhicule --</option>
              {Object.values(groupedVehicles).map(({ provider, vehicles: providerVehicles }) => (
                <optgroup key={provider.id} label={`🏢 ${provider.name}`}>
                  {providerVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      🚐 {vehicle.name} ({vehicle.make} {vehicle.model}) - {vehicle.capacity} places
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        {/* DIV 2: Grille des sièges */}
        <div className="seats-panel">
          <h2>� Sélection des sièges</h2>
          
          {selectedVehicleId ? (
            <>
              {/* Légende */}
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

              {/* Grille des sièges */}
              <div className="seat-grid">
                {seats.map(seat => {
                  const isSelected = selectedSeats.includes(seat.id);
                  const isReserved = !seat.available || !!seat.isReserved;
                  
                  return (
                    <button
                      key={seat.id}
                      className={`seat ${isReserved ? 'reserved' : 'available'} ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSeatSelection(seat.id)}
                      disabled={isReserved}
                      title={isReserved ? 'Siège déjà réservé' : `Siège ${seat.label || seat.seatNumber}`}
                    >
                      {seat.label || seat.seatNumber}
                    </button>
                  );
                })}
              </div>

              {/* Bouton réserver */}
              {selectedSeats.length > 0 && (
                <div className="reservation-actions">
                  <p>Sièges sélectionnés: {selectedSeats.length}</p>
                  <button className="reserve-btn" onClick={makeReservation}>
                    🎫 Réserver {selectedSeats.length} siège(s)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>Sélectionnez un véhicule pour voir les sièges disponibles</p>
            </div>
          )}
        </div>

        {/* DIV 3: Liste des réservations */}
        <div className="reservations-panel">
          <h2>🎫 Mes Réservations ({reservations.length})</h2>
          
          {reservations.length === 0 ? (
            <div className="empty-state">
              <p>Aucune réservation</p>
            </div>
          ) : (
            <div className="reservations-list">
              {reservations.map(reservation => (
                <div key={reservation.id} className="reservation-item">
                  <div className="reservation-header">
                    <h4>#{reservation.id.substring(0, 8)}</h4>
                    <span className={`status status-${reservation.status.toLowerCase()}`}>
                      {reservation.status === 'COMMITTED' && '✅ Confirmée'}
                      {reservation.status === 'PENDING' && '⏳ En attente'}
                      {reservation.status === 'CANCELLED' && '❌ Annulée'}
                      {reservation.status === 'REJECTED' && '🚫 Rejetée'}
                    </span>
                  </div>
                  
                  <div className="reservation-details">
                    <p><strong>Véhicule:</strong> {reservation.vehicleName}</p>
                    <p><strong>Fournisseur:</strong> {reservation.providerName}</p>
                    <p><strong>Siège:</strong> {reservation.seatId}</p>
                    <p><strong>Date:</strong> {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}</p>
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
        
      </div>
    </div>
  );
};

export default NewUserDashboard;
