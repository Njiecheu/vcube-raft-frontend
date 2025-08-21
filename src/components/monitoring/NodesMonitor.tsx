import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import './NodesMonitor.css';

interface NodeHealth {
  index: number;
  url: string;
  status: 'healthy' | 'failed' | 'unknown';
  lastChecked: Date | null;
  responseTime?: number;
}

interface NodesHealthStatus {
  currentNode: number;
  nodes: NodeHealth[];
}

const NodesMonitor: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<NodesHealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const checkNodesHealth = async () => {
    try {
      const status = await apiService.getNodesHealthStatus();
      setHealthStatus(status);
    } catch (error) {
      console.error('Erreur lors de la vérification de santé des nœuds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchNode = async (nodeIndex: number) => {
    const success = apiService.switchToNode(nodeIndex);
    if (success) {
      await checkNodesHealth();
    }
  };

  const handleResetFailedNodes = async () => {
    apiService.resetFailedNodes();
    await checkNodesHealth();
  };

  useEffect(() => {
    checkNodesHealth();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(checkNodesHealth, 10000); // Toutes les 10 secondes
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4caf50';
      case 'failed': return '#f44336';
      default: return '#ff9800';
    }
  };

  if (isLoading) {
    return (
      <div className="nodes-monitor">
        <div className="monitor-header">
          <h3>🔄 Monitoring des Nœuds Backend</h3>
        </div>
        <div className="loading">Chargement de l'état des nœuds...</div>
      </div>
    );
  }

  return (
    <div className="nodes-monitor">
      <div className="monitor-header">
        <h3>🔄 Monitoring des Nœuds Backend</h3>
        <div className="monitor-controls">
          <label className="auto-refresh">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Actualisation automatique
          </label>
          <button onClick={checkNodesHealth} className="refresh-btn">
            🔄 Actualiser
          </button>
          <button onClick={handleResetFailedNodes} className="reset-btn">
            🔄 Réinitialiser les échecs
          </button>
        </div>
      </div>

      {healthStatus && (
        <div className="nodes-status">
          <div className="current-node-info">
            <strong>Nœud actuel: </strong>
            <span className="current-node">
              {healthStatus.currentNode} ({healthStatus.nodes[healthStatus.currentNode]?.url})
            </span>
          </div>

          <div className="nodes-grid">
            {healthStatus.nodes.map((node) => (
              <div
                key={node.index}
                className={`node-card ${node.index === healthStatus.currentNode ? 'current' : ''}`}
                style={{ borderColor: getStatusColor(node.status) }}
              >
                <div className="node-header">
                  <span className="node-icon">{getStatusIcon(node.status)}</span>
                  <strong>Nœud {node.index}</strong>
                  {node.index === healthStatus.currentNode && (
                    <span className="current-badge">ACTUEL</span>
                  )}
                </div>
                
                <div className="node-details">
                  <div className="node-url">{node.url}</div>
                  <div className="node-status" style={{ color: getStatusColor(node.status) }}>
                    Statut: {node.status}
                  </div>
                  
                  {node.responseTime && (
                    <div className="response-time">
                      Temps de réponse: {node.responseTime}ms
                    </div>
                  )}
                  
                  {node.lastChecked && (
                    <div className="last-checked">
                      Dernière vérification: {node.lastChecked.toLocaleTimeString()}
                    </div>
                  )}
                </div>

                <div className="node-actions">
                  <button
                    onClick={() => handleSwitchNode(node.index)}
                    disabled={node.index === healthStatus.currentNode}
                    className={`switch-btn ${node.status === 'failed' ? 'disabled' : ''}`}
                  >
                    {node.index === healthStatus.currentNode ? 'Actuel' : 'Basculer'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="monitoring-info">
            <h4>📊 Informations de Monitoring</h4>
            <ul>
              <li>✅ <strong>Healthy</strong>: Nœud opérationnel et accessible</li>
              <li>❌ <strong>Failed</strong>: Nœud indisponible ou en erreur</li>
              <li>❓ <strong>Unknown</strong>: État non déterminé</li>
              <li>🔄 Les nœuds défaillants sont retestés automatiquement toutes les 30 secondes</li>
              <li>⚡ Le failover automatique s'active en cas d'erreur de requête</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodesMonitor;
