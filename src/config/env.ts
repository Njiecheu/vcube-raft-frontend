// Script de test pour vérifier les variables d'environnement
console.log('🔧 Variables d\'environnement Vite:');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('VITE_WS_URL:', import.meta.env.VITE_WS_URL);
console.log('VITE_ENVIRONMENT:', import.meta.env.VITE_ENVIRONMENT);
console.log('Mode:', import.meta.env.MODE);
console.log('DEV:', import.meta.env.DEV);
console.log('PROD:', import.meta.env.PROD);

export const envConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  MODE: import.meta.env.MODE,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD
};

console.log('📋 Configuration finale:', envConfig);
