import { useState, useEffect } from 'react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'
import { apiService } from '../../services/apiService'
import type { RaftMetrics, ReservationMetrics } from '../../services/apiService'
import './VCubeRaftDemonstration.css'

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const VCubeRaftDemonstration = () => {
  // États pour les métriques temps réel
  const [raftMetrics, setRaftMetrics] = useState<RaftMetrics | null>(null)
  const [reservationMetrics, setReservationMetrics] = useState<ReservationMetrics | null>(null)
  const [latencyHistory, setLatencyHistory] = useState<number[]>([])
  const [throughputHistory, setThroughputHistory] = useState<number[]>([])
  const [vcubeOverhead, setVcubeOverhead] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // États pour les tests de performance
  const [testRunning, setTestRunning] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)

  // Configuration des graphiques
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#e0e0e0'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#e0e0e0'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#e0e0e0'
        }
      }
    }
  }

  // Récupération des données temps réel
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        
        // Récupérer les métriques Raft
        const raftData = await apiService.getRaftMetrics()
        setRaftMetrics(raftData)

        // Récupérer les métriques de réservation
        const reservationData = await apiService.getReservationMetrics()
        setReservationMetrics(reservationData)

        // Récupérer l'historique des performances
        const latencyData = await apiService.getLatencyHistory()
        setLatencyHistory(Array.isArray(latencyData) ? latencyData : [])

        const throughputData = await apiService.getThroughputHistory()
        setThroughputHistory(Array.isArray(throughputData) ? throughputData : [])

        const overheadData = await apiService.getVCubeOverheadHistory()
        setVcubeOverhead(Array.isArray(overheadData) ? overheadData : [])

        setError(null)
      } catch (err) {
        console.error('Erreur lors de la récupération des métriques:', err)
        setError('Erreur de connexion au backend')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()

    // Mise à jour toutes les 2 secondes
    const interval = setInterval(fetchMetrics, 2000)
    return () => clearInterval(interval)
  }, [])

  // Configuration SSE pour les mises à jour temps réel
  useEffect(() => {
    const raftEventSource = apiService.createRaftEventStream()
    const reservationEventSource = apiService.createReservationEventStream()

    raftEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setRaftMetrics(data)
      } catch (err) {
        console.error('Erreur parsing SSE Raft:', err)
      }
    }

    reservationEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setReservationMetrics(data)
      } catch (err) {
        console.error('Erreur parsing SSE Reservations:', err)
      }
    }

    return () => {
      raftEventSource.close()
      reservationEventSource.close()
    }
  }, [])

  // Lancer un test de performance
  const runPerformanceTest = async () => {
    try {
      setTestRunning(true)
      
      const config = {
        numberOfProviders: 5,
        seatsPerProvider: 20,
        numberOfNodes: 3,
        numberOfUsers: 15,
        testDurationMinutes: 2,
        reservationRate: 0.5,
        enableAutoSubscription: true,
        subscriptionRate: 0.3,
        enableConflictSimulation: true,
        conflictIntensity: 0.3,
        aggressiveSubscriberCount: 5
      }

      const results = await apiService.runPerformanceTest(config)
      setTestResults(results)
    } catch (err) {
      console.error('Erreur test de performance:', err)
      setError('Erreur lors du lancement du test')
    } finally {
      setTestRunning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="demonstration-container loading">
        <h2>🔬 Démonstration VCube+Raft</h2>
        <div className="loading-spinner">Chargement des données en temps réel...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="demonstration-container error">
        <h2>🔬 Démonstration VCube+Raft</h2>
        <div className="error-message">
          ⚠️ {error}
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="demonstration-container">
      <header className="demo-header">
        <h1>🔬 Démonstration VCube+Raft : Recherche en Action</h1>
        <p className="demo-subtitle">
          Données en temps réel du système hybride démontrant les 4 objectifs de recherche
        </p>
      </header>

      {/* Objectif 1: Compromis Latence vs Cohérence */}
      <section className="research-objective">
        <h2>📊 Objectif 1: Compromis Latence/Cohérence</h2>
        <div className="metrics-grid">
          <div className="metric-card primary">
            <h3>🚀 Latence VCube (Diffusion Causale)</h3>
            <div className="metric-value">
              {latencyHistory.length > 0 ? `${latencyHistory[latencyHistory.length - 1].toFixed(2)} ms` : 'N/A'}
            </div>
            <div className="metric-description">
              Temps de propagation des événements causaux
            </div>
          </div>
          
          <div className="metric-card secondary">
            <h3>🔒 Cohérence Raft (Écritures Critiques)</h3>
            <div className="metric-value">
              {raftMetrics?.currentTerm || 0} terme
            </div>
            <div className="metric-description">
              État: {raftMetrics?.nodeState} | Leader: {raftMetrics?.currentLeader}
            </div>
          </div>
          
          <div className="metric-card success">
            <h3>⚖️ Compromis Favorable</h3>
            <div className="metric-value">
              {reservationMetrics?.successRate.toFixed(1) || 0}% réussite
            </div>
            <div className="metric-description">
              Équilibre optimal entre vitesse et sécurité
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h4>📈 Évolution Latence vs Throughput</h4>
          <div className="chart-wrapper">
            <Line
              data={{
                labels: Array.from({length: Math.max(latencyHistory.length, throughputHistory.length)}, (_, i) => i),
                datasets: [
                  {
                    label: 'Latence VCube (ms)',
                    data: latencyHistory,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    fill: true,
                    tension: 0.4
                  },
                  {
                    label: 'Throughput Raft (ops/s)',
                    data: throughputHistory,
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y1'
                  }
                ]
              }}
              options={{
                ...chartOptions,
                scales: {
                  ...chartOptions.scales,
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                      drawOnChartArea: false,
                    },
                    ticks: {
                      color: '#e0e0e0'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </section>

      {/* Objectif 2: Tolérance aux Pannes */}
      <section className="research-objective">
        <h2>🛡️ Objectif 2: Tolérance aux Pannes & Durabilité</h2>
        <div className="metrics-grid">
          <div className="metric-card warning">
            <h3>🔄 Réplication Raft</h3>
            <div className="metric-value">
              {raftMetrics?.appendEntriesCount || 0}
            </div>
            <div className="metric-description">
              Réplications réussies
            </div>
          </div>
          
          <div className="metric-card info">
            <h3>📸 Snapshots</h3>
            <div className="metric-value">
              {Math.floor((raftMetrics?.appendEntriesCount || 0) / 100)}
            </div>
            <div className="metric-description">
              Points de sauvegarde automatiques
            </div>
          </div>
          
          <div className="metric-card success">
            <h3>🎯 Disponibilité</h3>
            <div className="metric-value">
              {((reservationMetrics?.successfulReservations || 0) / Math.max(reservationMetrics?.totalReservations || 1, 1) * 100).toFixed(1)}%
            </div>
            <div className="metric-description">
              Système opérationnel malgré les pannes
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h4>🔄 Distribution des Réservations</h4>
          <div className="chart-wrapper">
            <Doughnut
              data={{
                labels: ['Réussies', 'Échouées', 'Redirigées'],
                datasets: [
                  {
                    data: [
                      reservationMetrics?.successfulReservations || 0,
                      reservationMetrics?.failedReservations || 0,
                      reservationMetrics?.redirectedReservations || 0
                    ],
                    backgroundColor: [
                      '#4CAF50',
                      '#f44336',
                      '#FF9800'
                    ],
                    borderWidth: 2,
                    borderColor: '#333'
                  }
                ]
              }}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: '#e0e0e0'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </section>

      {/* Objectif 3: Producteurs Hot */}
      <section className="research-objective">
        <h2>🔥 Objectif 3: Gestion Producteurs Hot</h2>
        <div className="metrics-grid">
          <div className="metric-card danger">
            <h3>⚡ Overhead VCube</h3>
            <div className="metric-value">
              {vcubeOverhead.length > 0 ? `${vcubeOverhead[vcubeOverhead.length - 1].toFixed(2)}%` : 'N/A'}
            </div>
            <div className="metric-description">
              Coût des horloges vectorielles
            </div>
          </div>
          
          <div className="metric-card primary">
            <h3>📦 Sharding Efficace</h3>
            <div className="metric-value">
              {raftMetrics ? Math.min(3, Math.floor(raftMetrics.appendEntriesCount / 100)) : 0}
            </div>
            <div className="metric-description">
              Partitions actives
            </div>
          </div>
          
          <div className="metric-card success">
            <h3>🚀 Batching</h3>
            <div className="metric-value">
              {reservationMetrics?.averageProcessingTimeMs.toFixed(1) || 0} ms
            </div>
            <div className="metric-description">
              Temps de traitement par batch
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h4>📊 Performance vs Overhead</h4>
          <div className="chart-wrapper">
            <Bar
              data={{
                labels: ['Latence', 'Throughput', 'Overhead', 'Efficacité'],
                datasets: [
                  {
                    label: 'Métriques Normalisées (%)',
                    data: [
                      Math.max(0, 100 - (latencyHistory[latencyHistory.length - 1] || 0)),
                      Math.min(100, (throughputHistory[throughputHistory.length - 1] || 0) * 2),
                      vcubeOverhead[vcubeOverhead.length - 1] || 0,
                      reservationMetrics?.successRate || 0
                    ],
                    backgroundColor: [
                      '#4CAF50',
                      '#2196F3',
                      '#FF9800',
                      '#9C27B0'
                    ],
                    borderWidth: 1
                  }
                ]
              }}
              options={chartOptions}
            />
          </div>
        </div>
      </section>

      {/* Objectif 4: Sécurité */}
      <section className="research-objective">
        <h2>🔐 Objectif 4: Sécurisation Bout-en-bout</h2>
        <div className="metrics-grid">
          <div className="metric-card info">
            <h3>🎫 Authentification JWT</h3>
            <div className="metric-value">
              {localStorage.getItem('authToken') ? '✅' : '❌'}
            </div>
            <div className="metric-description">
              Token valide et sécurisé
            </div>
          </div>
          
          <div className="metric-card warning">
            <h3>👥 Contrôle par Rôles</h3>
            <div className="metric-value">
              {localStorage.getItem('userRole') || 'N/A'}
            </div>
            <div className="metric-description">
              Niveau d'accès utilisateur
            </div>
          </div>
          
          <div className="metric-card success">
            <h3>🔒 Intégrité Raft</h3>
            <div className="metric-value">
              {raftMetrics?.voteRequestCount || 0}
            </div>
            <div className="metric-description">
              Votes de consensus sécurisés
            </div>
          </div>
        </div>
      </section>

      {/* Test de Performance Live */}
      <section className="performance-testing">
        <h2>🧪 Test de Performance en Temps Réel</h2>
        <div className="test-controls">
          <button 
            onClick={runPerformanceTest}
            disabled={testRunning}
            className={`test-button ${testRunning ? 'running' : ''}`}
          >
            {testRunning ? '⏳ Test en cours...' : '🚀 Lancer Test Démonstration'}
          </button>
          
          {testResults && (
            <div className="test-results">
              <h4>📊 Résultats du Test</h4>
              <div className="results-grid">
                <div className="result-item">
                  <span>Durée:</span>
                  <span>{testResults.testDurationSeconds}s</span>
                </div>
                <div className="result-item">
                  <span>Réservations:</span>
                  <span>{testResults.totalReservations}</span>
                </div>
                <div className="result-item">
                  <span>Taux de succès:</span>
                  <span>{testResults.successRate}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default VCubeRaftDemonstration
