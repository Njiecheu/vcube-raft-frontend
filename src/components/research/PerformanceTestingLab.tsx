import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface TestConfiguration {
  numberOfProviders: number;
  seatsPerProvider: number;
  numberOfNodes: number;
  numberOfUsers: number;
  testDurationMinutes: number;
  enableAutoSubscription: boolean;
  subscriptionRate: number;
  enableConflictSimulation: boolean;
  enableStress: boolean;
  hotProducerCount: number;
}

interface TestResults {
  testId: string;
  configuration: TestConfiguration;
  metrics: {
    vcubeLatency: number[];
    raftConsensusTime: number[];
    throughput: number[];
    successRate: number;
    conflictRate: number;
    hotProducerEfficiency: number;
    securityValidations: number;
  };
  completed: boolean;
  duration: number;
}

const PerformanceTestingLab: React.FC = () => {
  const [testConfig, setTestConfig] = useState<TestConfiguration>({
    numberOfProviders: 5,
    seatsPerProvider: 20,
    numberOfNodes: 3,
    numberOfUsers: 15,
    testDurationMinutes: 5,
    enableAutoSubscription: true,
    subscriptionRate: 0.3,
    enableConflictSimulation: true,
    enableStress: false,
    hotProducerCount: 3
  });

  const [testHistory, setTestHistory] = useState<TestResults[]>([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);

  // Démarrage d'un nouveau test
  const startPerformanceTest = async () => {
    setIsTestRunning(true);
    setRealTimeData([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/performance-test/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(testConfig)
      });

      if (response.ok) {
        // Démarrer le monitoring en temps réel
        startRealTimeMonitoring();
      } else {
        throw new Error('Erreur lors du démarrage du test');
      }
    } catch (error) {
      console.error('Erreur test de performance:', error);
      setIsTestRunning(false);
    }
  };

  // Monitoring en temps réel pendant le test
  const startRealTimeMonitoring = () => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/performance-test/current-results`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setRealTimeData(prev => [...prev, {
            timestamp: Date.now(),
            ...data
          }]);

          // Vérifier si le test est terminé
          if (data.completed) {
            setIsTestRunning(false);
            setTestHistory(prev => [...prev, data]);
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Erreur monitoring temps réel:', error);
      }
    }, 2000); // Mise à jour toutes les 2 secondes

    return () => clearInterval(interval);
  };

  // Arrêt manuel du test
  const stopTest = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/performance-test/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      setIsTestRunning(false);
    } catch (error) {
      console.error('Erreur arrêt test:', error);
    }
  };

  // Configuration des graphiques temps réel
  const realTimeChartData = {
    labels: realTimeData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'VCube-PS Latence (ms)',
        data: realTimeData.map(d => d.vcubeLatency || 0),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      },
      {
        label: 'Raft Consensus (ms)',
        data: realTimeData.map(d => d.raftConsensusTime || 0),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  };

  const throughputChartData = {
    labels: realTimeData.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Throughput (ops/sec)',
        data: realTimeData.map(d => d.throughput || 0),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: '#8B5CF6',
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🧪 Laboratoire de Tests de Performance VCube-PS + Raft
        </h1>
        <p className="text-gray-600">
          Démonstration des performances, tolérance aux pannes, et sécurisation 
          du système hybride VCube-PS + Raft pour la réservation de sièges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration du test */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚙️ Configuration du Test</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fournisseurs
              </label>
              <input
                type="number"
                value={testConfig.numberOfProviders}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  numberOfProviders: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isTestRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sièges par fournisseur
              </label>
              <input
                type="number"
                value={testConfig.seatsPerProvider}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  seatsPerProvider: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isTestRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nœuds Raft
              </label>
              <input
                type="number"
                value={testConfig.numberOfNodes}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  numberOfNodes: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isTestRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Utilisateurs simultanés
              </label>
              <input
                type="number"
                value={testConfig.numberOfUsers}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  numberOfUsers: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isTestRunning}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée (minutes)
              </label>
              <input
                type="number"
                value={testConfig.testDurationMinutes}
                onChange={(e) => setTestConfig(prev => ({
                  ...prev,
                  testDurationMinutes: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isTestRunning}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={testConfig.enableAutoSubscription}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    enableAutoSubscription: e.target.checked
                  }))}
                  disabled={isTestRunning}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Souscriptions automatiques</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={testConfig.enableConflictSimulation}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    enableConflictSimulation: e.target.checked
                  }))}
                  disabled={isTestRunning}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Simulation de conflits</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={testConfig.enableStress}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    enableStress: e.target.checked
                  }))}
                  disabled={isTestRunning}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="ml-2 text-sm">Mode stress (producteurs hot)</span>
              </label>
            </div>

            {/* Boutons de contrôle */}
            <div className="space-y-2 pt-4">
              {!isTestRunning ? (
                <button
                  onClick={startPerformanceTest}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  🚀 Démarrer le Test
                </button>
              ) : (
                <button
                  onClick={stopTest}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  ⏹️ Arrêter le Test
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Métriques en temps réel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statut du test */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">📊 Statut du Test</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isTestRunning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {isTestRunning ? '🟢 En cours...' : '⚪ Arrêté'}
              </div>
            </div>

            {realTimeData.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">VCube Latence</p>
                  <p className="text-xl font-bold text-green-600">
                    {realTimeData[realTimeData.length - 1]?.vcubeLatency?.toFixed(1) || '0.0'}ms
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Raft Consensus</p>
                  <p className="text-xl font-bold text-red-600">
                    {realTimeData[realTimeData.length - 1]?.raftConsensusTime?.toFixed(1) || '0.0'}ms
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Throughput</p>
                  <p className="text-xl font-bold text-purple-600">
                    {realTimeData[realTimeData.length - 1]?.throughput?.toFixed(0) || '0'} ops/s
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Taux de Succès</p>
                  <p className="text-xl font-bold text-blue-600">
                    {((realTimeData[realTimeData.length - 1]?.successRate || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Graphique de latence en temps réel */}
          {realTimeData.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📈 Latence VCube-PS vs Raft (Temps Réel)
              </h3>
              <div className="h-64">
                <Line 
                  data={realTimeChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context: any) {
                            const value = context.parsed.y.toFixed(1);
                            const performance = context.parsed.y <= 10 ? '�� Excellent' :
                                              context.parsed.y <= 25 ? '🟡 Bon' :
                                              context.parsed.y <= 50 ? '🟠 Acceptable' : '🔴 Lent';
                            return `${context.dataset.label}: ${value}ms - ${performance}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Latence (ms)'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Temps'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Graphique de throughput */}
          {realTimeData.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                ⚡ Throughput du Système
              </h3>
              <div className="h-64">
                <Bar 
                  data={throughputChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Opérations par seconde'
                        }
                      },
                      x: {
                        title: {
                          display: true,
                          text: 'Temps'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historique des tests */}
      {testHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📚 Historique des Tests</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Configuration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    VCube Latence Moy.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Raft Consensus Moy.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Taux de Succès
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Durée
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testHistory.map((test, index) => (
                  <tr key={test.testId || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {test.configuration.numberOfProviders}P × {test.configuration.seatsPerProvider}S × {test.configuration.numberOfUsers}U
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {(test.metrics.vcubeLatency.reduce((a, b) => a + b, 0) / test.metrics.vcubeLatency.length).toFixed(1)}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                      {(test.metrics.raftConsensusTime.reduce((a, b) => a + b, 0) / test.metrics.raftConsensusTime.length).toFixed(1)}ms
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {(test.metrics.successRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Math.round(test.duration / 1000)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceTestingLab;
