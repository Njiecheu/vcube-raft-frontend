import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import './UserDashboard.css';

interface Reservation {
  id: string;
  userId: string;
  providerId: string;
  vehicleId: string;
  seatId: string;
  status: 'COMMITTED' | 'PENDING' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  providerName?: string;
}

interface Provider {
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
}

const UserDashboard: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [userReservations, availableProviders] = await Promise.all([
        apiService.getUserReservations(),
        apiService.getProviders()
      ]);
      
      setReservations(Array.isArray(userReservations) ? userReservations : []);
      setProviders(Array.isArray(availableProviders) ? availableProviders : []);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error('Erreur chargement données utilisateur:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSeats = async (providerId: string) => {
    try {
      setLoading(true);
      const providerSeats = await apiService.getSeats(providerId);
      setSeats(Array.isArray(providerSeats) ? providerSeats : []);
      setSelectedProvider(providerId);
    } catch (err) {
      setError('Erreur lors du chargement des sièges');
      console.error('Erreur chargement sièges:', err);
    } finally {
      setLoading(false);
    }
  };

  const makeReservation = async (seatId: string) => {
    try {
      setLoading(true);
      await apiService.reserveSeat({
        providerId: selectedProvider,
        seatId: seatId,
        userId: localStorage.getItem('userId')
      });
      
      // Recharger les données
      await loadUserData();
      if (selectedProvider) {
        await loadSeats(selectedProvider);
      }
    } catch (err) {
      setError('Erreur lors de la réservation');
      console.error('Erreur réservation:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      setLoading(true);
      await apiService.cancelReservation(reservationId);
      await loadUserData();
    } catch (err) {
      setError('Erreur lors de l\'annulation');
      console.error('Erreur annulation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && reservations.length === 0) {
    return (
      <div className="user-dashboard-root">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem' }}>Chargement de votre tableau de bord...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard-root">
      <nav className="navbar">
        <h1>👤 VCube-PS - Tableau de Bord Utilisateur</h1>
        <div className="user-info">
          <span>{localStorage.getItem('userName') || 'Utilisateur'}</span>
          <button 
            className="logout-btn" 
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
          >
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="container">
        {error && (
          <div style={{ 
            background: '#fee', 
            border: '1px solid #fcc', 
            color: '#c33', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '2rem' 
          }}>
            {error}
          </div>
        )}

        <div className="dashboard-grid">
          {/* Mes réservations */}
          <div className="card">
            <h2>📝 Mes Réservations</h2>
            
            {reservations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Aucune réservation</p>
                <p style={{ fontSize: '0.9rem' }}>Commencez par réserver un siège !</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reservations.map((reservation) => (
                  <div key={reservation.id} 
                       style={{ 
                         border: '1px solid #e1e5e9', 
                         borderRadius: '8px', 
                         padding: '1rem',
                         transition: 'box-shadow 0.3s ease'
                       }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <h3 style={{ fontWeight: 600, color: '#333', marginBottom: '0.25rem' }}>
                          Siège {reservation.seatId}
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>
                          Fournisseur: {reservation.providerName || reservation.providerId}
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: reservation.status === 'COMMITTED' ? '#d4edda' : 
                                   reservation.status === 'PENDING' ? '#fff3cd' : '#f8d7da',
                        color: reservation.status === 'COMMITTED' ? '#155724' :
                               reservation.status === 'PENDING' ? '#856404' : '#721c24'
                      }}>
                        {reservation.status === 'COMMITTED' ? '✅ Confirmé' :
                         reservation.status === 'PENDING' ? '⏳ En attente' :
                         reservation.status === 'REJECTED' ? '❌ Rejeté' : '🚫 Annulé'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.75rem' }}>
                      {new Date(reservation.createdAt).toLocaleString()}
                    </p>
                    {reservation.status === 'COMMITTED' && (
                      <button
                        onClick={() => cancelReservation(reservation.id)}
                        disabled={loading}
                        style={{
                          color: '#dc3545',
                          background: 'none',
                          border: 'none',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          opacity: loading ? 0.5 : 1
                        }}
                      >
                        Annuler la réservation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Réserver un siège */}
          <div className="card">
            <h2>🎫 Réserver un Siège</h2>
            
            {/* Sélection du fournisseur */}
            <div className="vehicle-selector">
              <label>Choisir un fournisseur</label>
              <select
                value={selectedProvider}
                onChange={(e) => {
                  if (e.target.value) {
                    loadSeats(e.target.value);
                  } else {
                    setSelectedProvider('');
                    setSeats([]);
                  }
                }}
                disabled={loading}
              >
                <option value="">-- Sélectionner un fournisseur --</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name} - {provider.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Sièges disponibles */}
            {selectedProvider && (
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#333', marginBottom: '1rem' }}>
                  Sièges disponibles
                </h3>
                {seats.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', padding: '1rem' }}>
                    Aucun siège disponible pour ce fournisseur
                  </p>
                ) : (
                  <div className="seat-map">
                    {seats.map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => makeReservation(seat.id)}
                        disabled={loading || seat.status !== 'AVAILABLE'}
                        className={`seat ${seat.status === 'AVAILABLE' ? 'available' : 'reserved'}`}
                      >
                        {seat.id}
                        {seat.status === 'AVAILABLE' ? ' 🟢' : ' 🔴'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Statistiques utilisateur */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h2>📊 Mes Statistiques</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#e3f2fd', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>Total Réservations</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1976d2' }}>{reservations.length}</p>
            </div>
            <div style={{ background: '#e8f5e8', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>Confirmées</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#388e3c' }}>
                {reservations.filter(r => r.status === 'COMMITTED').length}
              </p>
            </div>
            <div style={{ background: '#fff8e1', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>En Attente</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>
                {reservations.filter(r => r.status === 'PENDING').length}
              </p>
            </div>
            <div style={{ background: '#ffebee', padding: '1rem', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666', marginBottom: '0.5rem' }}>Annulées</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d32f2f' }}>
                {reservations.filter(r => r.status === 'CANCELLED').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
