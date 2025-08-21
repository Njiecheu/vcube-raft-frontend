import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import './ProviderDashboard.css'

interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  licensePlate: string
  capacity: number
  published: boolean
  providerId: string
  departure?: string
  destination?: string
  departureTime?: string
  price?: number
}


interface Seat {
  id: string;
  available: boolean;
}

interface ProviderStats {
  totalVehicles: number;
  totalSeats: number;
  totalReservations: number;
  occupancyRate: number;
  revenue: number;
}

interface VehicleFormData {
  name: string;
  make: string;
  model: string;
  licensePlate: string;
  capacity: number;
  published: string;
}

interface AlertMessage {
  message: string
  type: 'success' | 'error'
}

const ProviderDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [stats, setStats] = useState<ProviderStats>({
    totalVehicles: 0,
    totalSeats: 0,
    totalReservations: 0,
    occupancyRate: 0,
    revenue: 0,
  });
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [alert, setAlert] = useState<AlertMessage | null>(null)
  const [formData, setFormData] = useState<VehicleFormData>({
    name: '',
    make: '',
    model: '',
    licensePlate: '',
    capacity: 40,
    published: 'draft',
  })

  // ID du provider connecté (récupéré depuis localStorage)
  const providerId = localStorage.getItem('userId') || "provider-123"
  const providerName = localStorage.getItem('userName') || 'Fournisseur'

  // Logout function
  const logout = () => {
    localStorage.clear()
    navigate('/')
  }

  useEffect(() => {
    loadProviderData()
    // Actualisation automatique toutes les 30 secondes
    const interval = setInterval(loadProviderData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadProviderData = async () => {
    await Promise.all([
      loadProviderStats(),
      loadProviderVehicles()
    ])
    setLoading(false)
  }

  const loadProviderStats = async () => {
    try {
      const vehiclesResponse = await axios.get(`/api/integrated/providers/${providerId}/vehicles`)
      const vehicles = vehiclesResponse.data

      let totalSeats = 0
      let occupiedSeats = 0

      for (const vehicle of vehicles) {
        try {
          const seatsResponse = await axios.get(`/api/integrated/vehicles/${vehicle.id}/seats`)
          const seats = seatsResponse.data
          totalSeats += seats.length
          occupiedSeats += seats.filter((seat: Seat) => !seat.available).length
        } catch (error) {
          console.error('Erreur lors du chargement des sièges:', error)
        }
      }

      const occupancyRate = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0

      setStats({
        totalVehicles: vehicles.length,
        totalSeats,
        totalReservations: occupiedSeats,
        occupancyRate,
        revenue: occupiedSeats * 25 // Exemple de calcul de revenus
      })
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      setStats({
        totalVehicles: 0,
        totalSeats: 0,
        totalReservations: 0,
        occupancyRate: 0,
        revenue: 0
      })
    }
  }

  const loadProviderVehicles = async () => {
    try {
      const response = await axios.get(`/api/integrated/providers/${providerId}/vehicles`)
      setVehicles(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des véhicules:', error)
      showAlert('Erreur lors du chargement des véhicules', 'error')
    }
  }

  const toggleVehicleForm = () => {
    setShowVehicleForm(!showVehicleForm)
    if (showVehicleForm) {
      resetForm()
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      make: '',
      model: '',
      licensePlate: '',
      capacity: 40,
      published: 'draft',
    });
    setEditingVehicleId(null);
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) : value
    }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vehicleData = {
      name: formData.name,
      capacity: formData.capacity,
      make: formData.make,
      model: formData.model,
      licensePlate: formData.licensePlate,
      published: formData.published === 'published',
      providerId
    };
    try {
      if (editingVehicleId) {
        await axios.put(`/api/integrated/vehicles/${editingVehicleId}`, vehicleData);
        showAlert('Véhicule modifié avec succès !', 'success');
      } else {
        await axios.post('/api/integrated/vehicles', vehicleData);
        showAlert('Véhicule créé avec succès !', 'success');
      }
      setShowVehicleForm(false);
      resetForm();
      loadProviderData();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      showAlert('Erreur lors de la sauvegarde du véhicule', 'error');
    }
  }

  const editVehicle = async (vehicleId: string) => {
    try {
      const response = await axios.get(`/api/integrated/vehicles/${vehicleId}`);
      const vehicle = response.data;
      setFormData({
        name: vehicle.name || '',
        capacity: vehicle.capacity || 40,
        make: vehicle.make || '',
        model: vehicle.model || '',
        licensePlate: vehicle.licensePlate || '',
        published: vehicle.published ? 'published' : 'draft',
      });
      setEditingVehicleId(vehicleId);
      setShowVehicleForm(true);
    } catch (error) {
      console.error('Erreur lors du chargement du véhicule:', error);
      showAlert('Erreur lors du chargement du véhicule', 'error');
    }
  }

  const publishVehicle = async (vehicleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir publier ce véhicule ? Il sera visible par tous les utilisateurs.')) {
      try {
        await axios.post(`/api/integrated/vehicles/${vehicleId}/publish`)
        showAlert('Véhicule publié avec succès !', 'success')
        loadProviderVehicles()
      } catch (error) {
        console.error('Erreur lors de la publication:', error)
        showAlert('Erreur lors de la publication', 'error')
      }
    }
  }

  const unpublishVehicle = async (vehicleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir dépublier ce véhicule ? Il ne sera plus visible par les utilisateurs.')) {
      try {
        await axios.post(`/api/integrated/vehicles/${vehicleId}/unpublish`)
        showAlert('Véhicule dépublié avec succès !', 'success')
        loadProviderVehicles()
      } catch (error) {
        console.error('Erreur lors de la dépublication:', error)
        showAlert('Erreur lors de la dépublication', 'error')
      }
    }
  }

  const deleteVehicle = async (vehicleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ? Cette action est irréversible.')) {
      try {
        await axios.delete(`/api/integrated/vehicles/${vehicleId}`)
        showAlert('Véhicule supprimé avec succès !', 'success')
        loadProviderData()
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        showAlert('Erreur lors de la suppression', 'error')
      }
    }
  }

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlert({ message, type })
    setTimeout(() => setAlert(null), 5000)
  }

  const VehicleItem: React.FC<{ vehicle: Vehicle }> = ({ vehicle }) => {
    const [seats, setSeats] = useState<Seat[]>([])
    
    useEffect(() => {
      const loadSeats = async () => {
        try {
          const response = await axios.get(`/api/integrated/vehicles/${vehicle.id}/seats`)
          setSeats(response.data)
        } catch (error) {
          console.error('Erreur lors du chargement des sièges:', error)
        }
      }
      loadSeats()
    }, [vehicle.id])

    const availableSeats = seats.filter(seat => seat.available).length
    const totalSeats = seats.length

    return (
      <div className="vehicle-item">
        <div className="vehicle-header">
          <div className="vehicle-title">
            {vehicle.name || `${vehicle.make} ${vehicle.model}`}
          </div>
          <div className={`vehicle-status status-${vehicle.published ? 'published' : 'draft'}`}>
            {vehicle.published ? 'Publié' : 'Brouillon'}
          </div>
        </div>
        
        <div className="vehicle-details">
          <div className="detail-item">
            <div className="detail-label">Marque</div>
            <div className="detail-value">{vehicle.make || 'N/A'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Modèle</div>
            <div className="detail-value">{vehicle.model || 'N/A'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Plaque</div>
            <div className="detail-value">{vehicle.licensePlate || 'N/A'}</div>
          </div>
          <div className="detail-item">
            <div className="detail-label">Sièges</div>
            <div className="detail-value">{availableSeats} / {totalSeats} disponibles</div>
          </div>
        </div>
        
        <div className="vehicle-actions">
          <button 
            className="btn-edit" 
            onClick={() => editVehicle(vehicle.id)}
          >
            ✏️ Modifier
          </button>
          {vehicle.published ? (
            <button 
              className="btn-unpublish" 
              onClick={() => unpublishVehicle(vehicle.id)}
            >
              📤 Dépublier
            </button>
          ) : (
            <button 
              className="btn-publish" 
              onClick={() => publishVehicle(vehicle.id)}
            >
              📢 Publier
            </button>
          )}
          <button 
            className="btn-delete" 
            onClick={() => deleteVehicle(vehicle.id)}
          >
            🗑️ Supprimer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="provider-dashboard-root">
      <nav className="navbar">
        <h1>🚐 VCube-PS - Tableau de Bord Fournisseur</h1>
        <div className="user-info">
          <span>{providerName}</span>
          <button className="logout-btn" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="container">
        {/* Alertes */}
        {alert && (
          <div className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        )}
        
        {/* Statistiques */}
        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-icon">🚐</div>
            <div className="stat-number">{stats.totalVehicles}</div>
            <div className="stat-label">Mes Véhicules</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">💺</div>
            <div className="stat-number">{stats.totalSeats}</div>
            <div className="stat-label">Sièges Totaux</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">🎫</div>
            <div className="stat-number">{stats.totalReservations}</div>
            <div className="stat-label">Réservations</div>
          </div>
          
          <div className="card stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-number">{stats.occupancyRate}%</div>
            <div className="stat-label">Taux d'Occupation</div>
          </div>
        </div>

        {/* Gestion des véhicules */}
        <div className="card">
          <h2>🚐 Gestion des Véhicules</h2>
          
          {/* Bouton pour afficher/masquer le formulaire */}
          <button className="btn toggle-form-btn" onClick={toggleVehicleForm}>
            {showVehicleForm ? '✖️ Fermer le formulaire' : '+ Ajouter un Véhicule'}
          </button>
          
          {/* Formulaire d'ajout/modification de véhicule */}
          {showVehicleForm && (
            <div className="vehicle-form-container">
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="vehicleName">Nom du véhicule</label>
                    <input
                      type="text"
                      id="vehicleName"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      placeholder="Ex: Bus Express A1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="vehicleCapacity">Nombre de places</label>
                    <input
                      type="number"
                      id="vehicleCapacity"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleFormChange}
                      min={10}
                      max={80}
                      placeholder="Ex: 40"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="vehicleMake">Marque</label>
                    <input
                      type="text"
                      id="vehicleMake"
                      name="make"
                      value={formData.make}
                      onChange={handleFormChange}
                      placeholder="Ex: Mercedes, Volvo, Iveco"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="vehicleModel">Modèle</label>
                    <input
                      type="text"
                      id="vehicleModel"
                      name="model"
                      value={formData.model}
                      onChange={handleFormChange}
                      placeholder="Ex: Citaro, 7900, Crossway"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="vehicleLicense">Plaque d'immatriculation</label>
                    <input
                      type="text"
                      id="vehicleLicense"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleFormChange}
                      placeholder="Ex: AB-123-CD"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="vehicleStatus">Statut</label>
                    <select
                      id="vehicleStatus"
                      name="published"
                      value={formData.published}
                      onChange={handleFormChange}
                    >
                      <option value="draft">Brouillon</option>
                      <option value="published">Publié</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingVehicleId ? 'Modifier le Véhicule' : 'Créer le Véhicule'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowVehicleForm(false)
                      resetForm()
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Liste des véhicules */}
          <div className="vehicles-list">
            {loading ? (
              <p style={{ textAlign: 'center', color: '#666' }}>
                Chargement des véhicules...
              </p>
            ) : vehicles.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>
                Aucun véhicule trouvé. Ajoutez votre premier véhicule !
              </p>
            ) : (
              vehicles.map(vehicle => (
                <VehicleItem key={vehicle.id} vehicle={vehicle} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProviderDashboard;
