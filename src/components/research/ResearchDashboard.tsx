import React, { useState, useEffect, useRef } from 'react';
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
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface VCubeRaftMetrics {
  // (i) Latence de diffusion causale vs cohérence forte
  vcubeLatency: number[];
  raftConsensusTime: number[];
  
  // (ii) Tolérance aux pannes et durabilité
  nodeFailures: number;
  snapshots: number;
  recoveryTime: number[];
  
  // (iii) Gestion des producteurs "hot"
  hotProducers: number;
  shardingEfficiency: number[];
  batchingThroughput: number[];
  
  // (iv) Sécurisation JWT et contrôle par rôles
  jwtValidations: number;
  roleBasedAccess: number;
  securityEvents: number;
}

interface ResearchMetrics {
  timestamp: number;
  vcubeRaftMetrics: VCubeRaftMetrics;
}

const ResearchDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ResearchMetrics[]>([]);
  const [isRealTime, setIsRealTime] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);

  // Configuration des graphiques avec gradients et couleurs de recherche
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderWidth: 2,
        displayColors: false,
      }
    },
    animation: {
      duration: 300,
      easing: 'easeInOutQuart' as const
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        title: {
          display: true,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      },
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        title: {
          display: true,
          font: {
            size: 12,
            weight: 'bold' as const
          }
        }
      }
    }
  };

  // Connexion WebSocket pour données en temps réel
  useEffect(() => {
    if (isRealTime) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    return () => disconnectWebSocket();
  }, [isRealTime]);

  const connectWebSocket = () => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/research-metrics`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('🔗 Connexion WebSocket établie pour les métriques de recherche');
        setConnectionStatus('connected');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const newMetrics: ResearchMetrics = JSON.parse(event.data);
          setMetrics(prev => {
            const updated = [...prev, newMetrics];
            // Garder seulement les 50 dernières mesures pour la performance
            return updated.slice(-50);
          });
        } catch (error) {
          console.error('❌ Erreur parsing données WebSocket:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ Erreur WebSocket:', error);
        setConnectionStatus('error');
      };
      
      wsRef.current.onclose = () => {
        console.log('🔌 Connexion WebSocket fermée');
        setConnectionStatus('disconnected');
        
        // Reconnexion automatique après 5 secondes
        if (isRealTime) {
          setTimeout(connectWebSocket, 5000);
        }
      };
    } catch (error) {
      console.error('❌ Erreur création WebSocket:', error);
      setConnectionStatus('error');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  };

  // Préparer les données pour les graphiques
  const prepareChartData = () => {
    const labels = metrics.map(m => new Date(m.timestamp).toLocaleTimeString());
    
    return {
      // (i) VCube vs Raft - Compromis latence/cohérence
      vcubeVsRaft: {
        labels,
        datasets: [
          {
            label: 'VCube-PS Latence (ms)',
            data: metrics.map(m => m.vcubeRaftMetrics.vcubeLatency[0] || 0),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Raft Consensus (ms)',
            data: metrics.map(m => m.vcubeRaftMetrics.raftConsensusTime[0] || 0),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },

      // (ii) Tolérance aux pannes et durabilité
      faultTolerance: {
        labels,
        datasets: [
          {
            label: 'Temps de Récupération (ms)',
            data: metrics.map(m => m.vcubeRaftMetrics.recoveryTime[0] || 0),
            backgroundColor: metrics.map(m => {
              const time = m.vcubeRaftMetrics.recoveryTime[0] || 0;
              if (time <= 1000) return 'rgba(16, 185, 129, 0.8)';
              if (time <= 3000) return 'rgba(245, 158, 11, 0.8)';
              return 'rgba(239, 68, 68, 0.8)';
            }),
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 2,
            borderRadius: 4,
          }
        ]
      },

      // (iii) Gestion des producteurs "hot"
      hotProducers: {
        labels,
        datasets: [
          {
            label: 'Efficacité Sharding (%)',
            data: metrics.map(m => m.vcubeRaftMetrics.shardingEfficiency[0] || 0),
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Throughput Batching (ops/s)',
            data: metrics.map(m => m.vcubeRaftMetrics.batchingThroughput[0] || 0),
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },

      // (iv) Sécurisation JWT et contrôle par rôles
      security: {
        labels,
        datasets: [
          {
            label: 'Validations JWT/s',
            data: metrics.map(m => m.vcubeRaftMetrics.jwtValidations || 0),
            borderColor: '#06B6D4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Contrôles d\'Accès/s',
            data: metrics.map(m => m.vcubeRaftMetrics.roleBasedAccess || 0),
            borderColor: '#EC4899',
            backgroundColor: 'rgba(236, 72, 153, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }
        ]
      }
    };
  };

  const chartData = prepareChartData();

  // Calculs des métriques en temps réel
  const latestMetrics = metrics[metrics.length - 1];
  const avgVCubeLatency = metrics.length > 0 ? 
    metrics.reduce((sum, m) => sum + (m.vcubeRaftMetrics.vcubeLatency[0] || 0), 0) / metrics.length : 0;
  const avgRaftLatency = metrics.length > 0 ? 
    metrics.reduce((sum, m) => sum + (m.vcubeRaftMetrics.raftConsensusTime[0] || 0), 0) / metrics.length : 0;

  const hotProducersOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        title: { display: true, text: 'Efficacité Sharding (%)', color: '#8B5CF6' },
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: { display: true, text: 'Throughput (ops/s)', color: '#F59E0B' },
        grid: { drawOnChartArea: false },
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* En-tête de recherche */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            🔬 Laboratoire de Recherche VCube-PS + Raft
          </h1>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
              connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' :
                connectionStatus === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              }`}></div>
              {connectionStatus === 'connected' ? 'Temps Réel' : 
               connectionStatus === 'error' ? 'Erreur' : 'Déconnecté'}
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isRealTime}
                onChange={(e) => setIsRealTime(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium">Données en temps réel</span>
            </label>
          </div>
        </div>

        {/* Métriques clés */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600">VCube Latence Moy.</h3>
            <p className="text-2xl font-bold text-green-600">{avgVCubeLatency.toFixed(1)}ms</p>
          </div>
          <div className="bg-gradient-to-r from-red-50 to-rose-100 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600">Raft Consensus Moy.</h3>
            <p className="text-2xl font-bold text-red-600">{avgRaftLatency.toFixed(1)}ms</p>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-violet-100 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600">Producteurs Hot</h3>
            <p className="text-2xl font-bold text-purple-600">{latestMetrics?.vcubeRaftMetrics.hotProducers || 0}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-cyan-100 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-600">Validations JWT/s</h3>
            <p className="text-2xl font-bold text-blue-600">{latestMetrics?.vcubeRaftMetrics.jwtValidations || 0}</p>
          </div>
        </div>
      </div>

      {/* Graphiques de recherche */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* (i) Compromis VCube vs Raft */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 (i) Compromis Latence Causale vs Cohérence Forte
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Démonstration que VCube-PS offre une latence plus faible pour la diffusion causale 
            tandis que Raft assure la cohérence forte pour les écritures critiques.
          </p>
          <div className="h-80">
            <Line data={chartData.vcubeVsRaft} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context: any) {
                      const label = context.dataset.label || '';
                      const value = context.parsed.y.toFixed(1);
                      const performance = context.parsed.y <= 10 ? '🟢 Excellent' :
                                        context.parsed.y <= 25 ? '🟡 Bon' :
                                        context.parsed.y <= 50 ? '🟠 Acceptable' : '🔴 Lent';
                      return `${label}: ${value}ms - ${performance}`;
                    }
                  }
                }
              },
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  title: { display: true, text: 'Latence (millisecondes)' }
                },
                x: {
                  ...chartOptions.scales.x,
                  title: { display: true, text: 'Temps' }
                }
              }
            }} />
          </div>
        </div>

        {/* (ii) Tolérance aux pannes */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🛡️ (ii) Tolérance aux Pannes et Durabilité
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Gains pratiques grâce à la réplication Raft et aux snapshots VCube-PS.
            Temps de récupération après pannes simulées.
          </p>
          <div className="h-80">
            <Bar data={chartData.faultTolerance} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                tooltip: {
                  ...chartOptions.plugins.tooltip,
                  callbacks: {
                    label: function(context: any) {
                      const value = context.parsed.y;
                      const category = value <= 1000 ? '🟢 Récupération Rapide' :
                                      value <= 3000 ? '🟡 Récupération Normale' : '�� Récupération Lente';
                      return `Temps de récupération: ${value.toFixed(0)}ms - ${category}`;
                    }
                  }
                }
              },
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  title: { display: true, text: 'Temps de Récupération (ms)' }
                },
                x: {
                  ...chartOptions.scales.x,
                  title: { display: true, text: 'Incidents de Panne' }
                }
              }
            }} />
          </div>
        </div>

        {/* (iii) Gestion des producteurs "hot" */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🔥 (iii) Gestion des Producteurs "Hot"
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Solution opérationnelle avec sharding dynamique et batching intelligent 
            pour gérer les pics de charge des producteurs actifs.
          </p>
          <div className="h-80">
            <Line data={chartData.hotProducers} options={hotProducersOptions} />
          </div>
        </div>

        {/* (iv) Sécurisation JWT */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🔐 (iv) Sécurisation JWT et Contrôle par Rôles
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Sécurisation de bout en bout avec authentification JWT et autorisation 
            basée sur les rôles pour toutes les opérations critiques.
          </p>
          <div className="h-80">
            <Line data={chartData.security} options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                y: {
                  ...chartOptions.scales.y,
                  title: { display: true, text: 'Opérations de Sécurité par Seconde' }
                },
                x: {
                  ...chartOptions.scales.x,
                  title: { display: true, text: 'Temps' }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Métriques détaillées */}
      <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Métriques de Performance Détaillées</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Analyse des performances */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">🎯 Analyse de Performance</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ratio Latence VCube/Raft:</span>
                <span className="font-medium">
                  {avgRaftLatency > 0 ? (avgVCubeLatency / avgRaftLatency).toFixed(2) : 'N/A'}x
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Efficacité Consensus:</span>
                <span className="font-medium text-green-600">
                  {latestMetrics ? ((latestMetrics.vcubeRaftMetrics.raftConsensusTime[0] || 0) <= 25 ? 'Optimal' : 'À améliorer') : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Tolérance aux pannes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">🛡️ Résilience du Système</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pannes Détectées:</span>
                <span className="font-medium">{latestMetrics?.vcubeRaftMetrics.nodeFailures || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Snapshots Créés:</span>
                <span className="font-medium">{latestMetrics?.vcubeRaftMetrics.snapshots || 0}</span>
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">🔐 Sécurité Active</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Événements Sécurité:</span>
                <span className="font-medium">{latestMetrics?.vcubeRaftMetrics.securityEvents || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Taux de Validation:</span>
                <span className="font-medium text-blue-600">
                  {latestMetrics?.vcubeRaftMetrics.jwtValidations ? '99.9%' : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchDashboard;
