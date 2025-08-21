# Configuration Multi-Nœuds pour VCube+Raft Frontend

## 🎯 Objectif
Cette configuration permet au frontend de se connecter à plusieurs nœuds backend pour assurer la haute disponibilité et la répartition de charge.

## ⚙️ Configuration

### Fichier .env
```bash
# Nœud principal (utilisé actuellement)
VITE_API_BASE_URL=http://localhost:8080

# Nœuds de secours (pour failover futur)
VITE_API_BACKUP_URLS=http://localhost:8081,http://localhost:8082

# WebSocket multi-nœuds
VITE_WS_URL=ws://localhost:8080/ws
VITE_WS_BACKUP_URLS=ws://localhost:8081/ws,ws://localhost:8082/ws
```

## 🔄 Architecture Actuelle
- **Nœud primaire**: localhost:8080 (utilisé par défaut)
- **Nœuds de secours**: localhost:8081, localhost:8082 (configurés mais pas encore utilisés)

## 🚀 Prochaines Étapes
1. **Failover automatique**: Basculement vers les nœuds de secours en cas d'échec
2. **Load balancing**: Répartition intelligente des requêtes
3. **Health check**: Monitoring de l'état des nœuds
4. **Circuit breaker**: Protection contre les cascades de pannes

## 🔧 Utilisation des 3 Nœuds

### Option 1: Load Balancer (Recommandé)
```
Frontend → Load Balancer (port 8080) → Nœuds Backend (8081, 8082, 8083)
```

### Option 2: Failover Client (Implémentation future)
```
Frontend → Nœud principal (8080)
    ↓ (si échec)
Frontend → Nœud secours 1 (8081)
    ↓ (si échec)
Frontend → Nœud secours 2 (8082)
```

### Option 3: Configuration actuelle
```
Frontend → Nœud unique (8080)
# Les autres nœuds sont disponibles pour extension future
```

## 📊 Avantages Multi-Nœuds
- ✅ **Haute disponibilité**: Pas de point de défaillance unique
- ✅ **Performance**: Répartition de la charge
- ✅ **Scalabilité**: Ajout facile de nouveaux nœuds
- ✅ **Tolérance aux pannes**: Continuité de service

## 🛠️ État Actuel
- Configuration multi-nœuds: ✅ Préparée
- Failover automatique: 🔄 En développement
- Load balancing: 🔄 À implémenter
- Monitoring: 🔄 À implémenter

Cette configuration prépare le terrain pour une architecture robuste et scalable tout en maintenant la compatibilité avec le nœud unique actuel.
