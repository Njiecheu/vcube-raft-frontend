import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavigationBarProps {
  userRole: string;
  onLogout: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ 
  userRole, 
  onLogout, 
  sidebarOpen, 
  setSidebarOpen 
}) => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Tableau de Bord',
      icon: '📊',
      roles: ['ADMIN', 'PROVIDER', 'USER'],
      description: 'Vue d\'ensemble du système'
    },
    {
      path: '/research',
      label: 'Démonstration Recherche',
      icon: '🔬',
      roles: ['ADMIN'],
      description: 'Validation des 4 objectifs de recherche'
    },
    {
      path: '/performance-lab',
      label: 'Laboratoire Performance',
      icon: '🧪',
      roles: ['ADMIN'],
      description: 'Tests de performance configurables'
    },
    {
      path: '/research-classic',
      label: 'Métriques Classiques',
      icon: '📈',
      roles: ['ADMIN'],
      description: 'Tableau de bord recherche classique'
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-50 bg-white shadow-lg">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 text-gray-600 hover:text-gray-900 focus:outline-none"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-blue-900 to-blue-800 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
        
        {/* Logo et titre */}
        <div className="flex items-center justify-center h-20 bg-blue-950">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">VCube-PS + Raft</h1>
            <p className="text-blue-200 text-sm">Système de Réservation</p>
          </div>
        </div>

        {/* Navigation principale */}
        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-700 text-white shadow-lg transform scale-105'
                    : 'text-blue-200 hover:bg-blue-700 hover:text-white hover:scale-105'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-xl mr-3">{item.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  {item.description && (
                    <div className="text-xs opacity-75 mt-1">{item.description}</div>
                  )}
                </div>
                {isActive(item.path) && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            ))}
          </div>

          {/* Section de démonstration pour les admins */}
          {userRole === 'ADMIN' && (
            <div className="mt-8 px-4">
              <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3">
                Objectifs de Recherche
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center text-blue-200">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  (i) Compromis Latence/Cohérence
                </div>
                <div className="flex items-center text-blue-200">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  (ii) Tolérance aux Pannes
                </div>
                <div className="flex items-center text-blue-200">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  (iii) Producteurs Hot
                </div>
                <div className="flex items-center text-blue-200">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  (iv) Sécurisation JWT/RBAC
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Informations utilisateur */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-blue-950">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <p className="text-sm font-medium">
                {userRole === 'ADMIN' ? '👑 Administrateur' :
                 userRole === 'PROVIDER' ? '🏢 Fournisseur' : '👤 Utilisateur'}
              </p>
              <p className="text-xs text-blue-200">
                {localStorage.getItem('username') || 'Utilisateur'}
              </p>
              {userRole === 'ADMIN' && (
                <p className="text-xs text-green-300 mt-1">
                  🔬 Mode Recherche Activé
                </p>
              )}
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-lg transition-colors"
              title="Déconnexion"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
};

export default NavigationBar;
