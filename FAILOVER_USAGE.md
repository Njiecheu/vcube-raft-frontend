# 🔄 Guide d'Utilisation du Système de Failover Multi-Nœuds

## Vue d'ensemble

Le système de failover automatique a été implémenté dans `apiService.ts` pour assurer une haute disponibilité en basculant automatiquement entre les 3 nœuds backend (ports 8080, 8081, 8082) en cas de défaillance.

## 🏗️ Architecture

### Configuration Multi-Nœuds
```typescript
// Nœud primaire
const PRIMARY_API_URL = 'http://localhost:8080';

// Nœuds de sauvegarde
const BACKUP_URLS = [
  'http://localhost:8081',
  'http://localhost:8082'
];

// Tous les nœuds disponibles
const ALL_API_NODES = [PRIMARY_API_URL, ...BACKUP_URLS];
```

### Fonctionnalités Clés
- ✅ **Failover automatique** : Basculement transparent entre nœuds
- ✅ **Health checks** : Vérification périodique de la santé des nœuds  
- ✅ **Timeout configurables** : 5s pour les requêtes, 30s pour les health checks
- ✅ **Monitoring en temps réel** : Statut de chaque nœud
- ✅ **Récupération automatique** : Les nœuds défaillants sont retestés
- ✅ **Logging détaillé** : Suivi complet des basculements

## 🚀 Utilisation

### 1. Utilisation Transparente

Le failover est **complètement transparent** pour les composants React. Aucune modification n'est nécessaire :

```typescript
// Fonctionne automatiquement avec failover
const stats = await apiService.getAdminStats();
const providers = await apiService.getProviders();
```

### 2. Monitoring des Nœuds

```typescript
// Obtenir l'état de santé de tous les nœuds
const healthStatus = await apiService.getNodesHealthStatus();

console.log('Nœud actuel:', healthStatus.currentNode);
healthStatus.nodes.forEach(node => {
  console.log(`Nœud ${node.index}: ${node.status} (${node.responseTime}ms)`);
});
```

### 3. Basculement Manuel

```typescript
// Forcer le basculement vers un nœud spécifique
const success = apiService.switchToNode(1); // Basculer vers localhost:8081

// Réinitialiser l'état des nœuds défaillants
apiService.resetFailedNodes();
```

## 🔧 Fonctionnement Interne

### Algorithme de Failover

1. **Requête initiale** : Tentative sur le nœud actuel
2. **Détection d'erreur** : Erreurs réseau ou serveur (5xx)
3. **Marquage défaillant** : Le nœud est marqué comme défaillant
4. **Basculement** : Passage au nœud suivant sain
5. **Réessai** : Tentative sur le nouveau nœud
6. **Échec global** : Si tous les nœuds échouent, erreur finale

### Types d'Erreurs

```typescript
// ✅ Failover activé pour :
- Erreurs réseau (connexion fermée, timeout)
- Erreurs serveur (500, 502, 503, 504)
- Timeouts de requête (> 5 secondes)

// ❌ Pas de failover pour :
- Erreurs client (400, 401, 403, 404)
- Erreurs de validation
- Erreurs métier
```

### Health Checks Automatiques

```typescript
// Exécutés toutes les 30 secondes
// Testent les nœuds marqués comme défaillants
// Réactivent automatiquement les nœuds revenus
```

## 📊 Logging et Debug

### Console Logs
```
🔧 ApiService initialisé avec failover multi-nœuds
📍 Nœuds disponibles: [http://localhost:8080, http://localhost:8081, http://localhost:8082]
🔄 Tentative 1/3: http://localhost:8080/api/stats
✅ Succès avec le nœud 0: http://localhost:8080
❌ Échec nœud 0 (http://localhost:8080): NetworkError
🔄 Basculement vers le nœud 1 (http://localhost:8081)
🏥 Vérification de santé des nœuds...
✅ Nœud 0 (http://localhost:8080) est de nouveau disponible
```

## 🌐 Server-Sent Events

### Gestion Spéciale pour EventSource

Les EventSource ne supportent pas nativement le failover, mais le système en tient compte :

```typescript
// EventSource avec détection d'erreur
const eventSource = apiService.createRaftEventStream();

// Pour un failover complet des EventSource, il faut gérer 
// manuellement la reconnexion au niveau du composant
eventSource.onerror = () => {
  // Fermer l'ancienne connexion
  eventSource.close();
  
  // Créer une nouvelle connexion (utilisera le nœud actuel)
  const newEventSource = apiService.createRaftEventStream();
};
```

## ⚙️ Configuration

### Variables d'Environnement

Utilisez le fichier `.env` pour personnaliser :

```env
# Nœud principal
VITE_API_BASE_URL=http://localhost:8080

# Nœuds de sauvegarde
VITE_BACKUP_URL_1=http://localhost:8081
VITE_BACKUP_URL_2=http://localhost:8082

# Configuration failover
VITE_REQUEST_TIMEOUT=5000
VITE_HEALTH_CHECK_INTERVAL=30000
```

### Timeouts

```typescript
private readonly REQUEST_TIMEOUT = 5000; // 5 secondes
private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 secondes
```

## 🧪 Tests et Validation

### Tester le Failover

1. **Démarrer les 3 nœuds backend** (8080, 8081, 8082)
2. **Utiliser l'application** normalement
3. **Arrêter le nœud principal** (8080)
4. **Observer les logs** : Le basculement vers 8081 doit être automatique
5. **Redémarrer le nœud** 8080 : Il doit être réactivé automatiquement

### Monitoring en Temps Réel

```typescript
// Créer un composant de monitoring
const [nodesHealth, setNodesHealth] = useState(null);

useEffect(() => {
  const checkHealth = async () => {
    const health = await apiService.getNodesHealthStatus();
    setNodesHealth(health);
  };
  
  checkHealth();
  const interval = setInterval(checkHealth, 10000); // Toutes les 10s
  
  return () => clearInterval(interval);
}, []);
```

## 🎯 Avantages

- ✅ **Haute disponibilité** : Résistance aux pannes de nœuds
- ✅ **Transparence** : Aucun impact sur le code métier
- ✅ **Performance** : Basculement rapide (< 5s)
- ✅ **Monitoring** : Visibilité complète sur l'état des nœuds
- ✅ **Récupération** : Réactivation automatique des nœuds
- ✅ **Logging** : Traçabilité complète des opérations

## 🔮 Évolutions Futures

- **Load balancing** : Répartition de charge entre nœuds sains
- **Métriques avancées** : Latence, débit par nœud
- **Failover pour EventSource** : Reconnexion automatique
- **Interface de monitoring** : Dashboard temps réel
- **Configuration dynamique** : Ajout/suppression de nœuds à chaud
