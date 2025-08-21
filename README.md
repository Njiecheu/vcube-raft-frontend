# Frontend React + Vite - VCube-PS + Raft

## 🎯 Objectifs de Recherche Démontrés

Ce frontend React démontre les **4 objectifs de recherche** de votre mémoire avec des métriques en temps réel :

### (i) Compromis Latence Causale vs Cohérence Forte
- **VCube-PS** : Latence optimisée pour la diffusion causale
- **Raft** : Garantie de cohérence forte pour les écritures critiques
- **Démonstration** : Graphiques comparatifs en temps réel

### (ii) Tolérance aux Pannes et Durabilité
- **Réplication Raft** : Redondance des données critiques
- **Snapshots VCube-PS** : Sauvegarde périodique de l'état
- **Démonstration** : Métriques de récupération après pannes simulées

### (iii) Gestion des Producteurs "Hot"
- **Sharding dynamique** : Répartition intelligente de la charge
- **Batching** : Optimisation des opérations groupées
- **Démonstration** : Graphiques d'efficacité vs charge

### (iv) Sécurisation JWT + Contrôle par Rôles
- **JWT** : Authentification sécurisée
- **RBAC** : Autorisation basée sur les rôles
- **Démonstration** : Métriques de validation en temps réel

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- Backend VCube-PS + Raft en cours d'exécution

### Installation
```bash
npm install
```

### Configuration
```bash
# Copier et adapter le fichier d'environnement
cp .env.example .env

# Modifier l'URL de l'API backend
echo "VITE_API_BASE_URL=http://localhost:8080" > .env
echo "VITE_WS_BASE_URL=ws://localhost:8080" >> .env
```

### Développement
```bash
npm run dev
```
Accès : http://localhost:5173

### Production
```bash
# Construction
npm run build

# Prévisualisation
npm run preview
```

## 📁 Structure du Projet

```
src/
├── components/
│   ├── auth/                 # Authentification
│   │   └── Login.tsx
│   ├── common/              # Composants communs
│   │   └── NavigationBar.tsx
│   ├── dashboard/           # Tableaux de bord
│   │   ├── AdminDashboard.tsx
│   │   └── ProviderDashboard.tsx
│   ├── research/            # Composants de recherche
│   │   ├── EnhancedResearchDashboard.tsx  # 🔬 PRINCIPAL
│   │   ├── ResearchDashboard.tsx
│   │   └── PerformanceTestingLab.tsx
│   └── user/
│       └── UserDashboard.tsx
├── services/
│   └── apiService.ts        # API calls vers le backend
├── App.tsx                  # Application principale
├── App.css                  # Styles personnalisés
└── main.tsx                 # Point d'entrée
```

## 🔬 Composants de Recherche

### `EnhancedResearchDashboard.tsx`
**Composant principal** pour la démonstration des objectifs de recherche :
- Métriques en temps réel via WebSocket
- 4 graphiques spécialisés (un par objectif)
- Validation automatique des seuils
- Interface responsive et interactive

### `PerformanceTestingLab.tsx`
Laboratoire de tests configurables :
- Tests personnalisés et prédéfinis
- Monitoring en temps réel
- Historique des tests
- Métriques détaillées

## 🌐 Déploiement en Ligne

### Option 1: Vercel (Recommandé)
```bash
# Installation CLI Vercel
npm i -g vercel

# Déploiement
vercel

# Configuration automatique pour React + Vite
```

### Option 2: Netlify
```bash
# Construction
npm run build

# Upload du dossier dist/ sur Netlify
# Configuration : Build command: `npm run build`, Publish directory: `dist`
```

### Option 3: GitHub Pages
```bash
# Installation gh-pages
npm install --save-dev gh-pages

# Ajout dans package.json
"homepage": "https://username.github.io/repository-name",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}

# Déploiement
npm run deploy
```

### Configuration pour Production
Assurez-vous de configurer les variables d'environnement pour la production :

```env
# Production
VITE_API_BASE_URL=https://votre-api-backend.com
VITE_WS_BASE_URL=wss://votre-api-backend.com
```

## 📊 Fonctionnalités Temps Réel

### WebSocket Endpoints
- `/ws/research-metrics` : Métriques de recherche
- `/ws/performance-metrics` : Métriques de performance
- `/ws/admin-metrics` : Métriques administrateur

### APIs REST Intégrées
- Authentification JWT
- Tests de performance
- Métriques VCube-PS
- Métriques Raft
- Gestion des réservations

## 🎨 Interface Utilisateur

### Design System
- **Couleurs** : Gradient bleu pour VCube, rouge pour Raft
- **Typography** : Inter font, hiérarchie claire
- **Animations** : Transitions fluides, feedback visuel
- **Responsive** : Mobile-first, adaptation tablette/desktop

### Accessibilité
- Support clavier complet
- Contrastes conformes WCAG 2.1
- Lecteurs d'écran compatibles
- Focus indicators visibles

## 🔧 Développement

### Structure des Types
```typescript
interface RealTimeMetrics {
  timestamp: number;
  vcubeLatency: number;
  raftConsensusTime: number;
  // ... autres métriques
}

interface ResearchObjective {
  id: string;
  title: string;
  metrics: ObjectiveMetrics;
  status: 'achieved' | 'in_progress' | 'pending';
}
```

### Gestion d'État
- React Hooks (useState, useEffect)
- LocalStorage pour l'authentification
- WebSocket pour les données temps réel

### Performance
- Lazy loading des composants
- Optimisation des re-renders
- Limitation des données WebSocket (100 points max)

## 📚 Documentation API

### Service API Principal
```typescript
// Exemple d'utilisation
import apiService from './services/apiService';

// Tests de performance
const result = await apiService.runPerformanceTest(config);

// Métriques temps réel
const metrics = await apiService.getResearchMetrics();
```

## 🎯 Démonstration de Recherche

L'interface démontre concrètement :

1. **Compromis Latence/Cohérence** : Graphiques comparatifs montrant VCube-PS < 50% latence Raft
2. **Résilience** : Temps de récupération < 1000ms après pannes
3. **Scalabilité** : Efficacité > 85% avec producteurs hot
4. **Sécurité** : Débit > 1000 validations JWT/s

## 🐛 Dépannage

### Erreurs Communes
- **CORS** : Vérifier la configuration backend
- **WebSocket** : S'assurer que le backend supporte WSS en production
- **Build** : Vérifier les variables d'environnement

### Logs de Debug
```typescript
// Activer les logs détaillés
localStorage.setItem('debug', 'true');
```

## 📈 Métriques de Performance

Le frontend lui-même est optimisé pour :
- **Bundle size** : < 500KB gzipped
- **First Paint** : < 1.5s
- **Time to Interactive** : < 3s
- **Lighthouse Score** : > 90

## 🤝 Contribution

1. Fork du repository
2. Création d'une branche feature
3. Commits avec messages conventionnels
4. Tests des fonctionnalités
5. Pull request avec description détaillée

---

**Note**: Ce frontend est spécifiquement conçu pour démontrer les résultats de recherche de votre mémoire sur VCube-PS + Raft. Chaque composant et métrique a été optimisé pour valider les 4 objectifs de recherche énoncés.
