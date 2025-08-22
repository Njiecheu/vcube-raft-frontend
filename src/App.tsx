import { envConfig } from './config/env';
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom'
import Login from './components/auth/Login'
import AdminDashboard from './components/dashboard/AdminDashboard'
import ProviderDashboard from './components/dashboard/ProviderDashboard'
import UserDashboard from './components/user/UserDashboard'
import ResearchDashboard from './components/research/ResearchDashboard'
import PerformanceTestingLab from './components/research/PerformanceTestingLab'
import VCubeRaftDemonstration from './components/research/VCubeRaftDemonstration'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication from localStorage on app start
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole')
    const storedUserId = localStorage.getItem('userId')
    
    if (storedRole && storedUserId) {
      setIsAuthenticated(true)
      setUserRole(storedRole)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (role: string) => {
    setIsAuthenticated(true)
    setUserRole(role)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserRole('')
    localStorage.clear()
  }

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🔬 Chargement VCube+Raft...</div>
      </div>
    )
  }

  return (
    <Router>
      <div className="app">
        {/* Navigation Header */}
        {isAuthenticated && (
          <header className="app-header">
            <div className="nav-container">
              <div className="nav-brand">
                <h1>🔬 VCube+Raft Research Platform</h1>
                <span className="user-info">
                  👤 {userRole} | {localStorage.getItem('userId')}
                </span>
              </div>
              <nav className="nav-links">
                <Link to="/dashboard" className="nav-link">
                  📊 Dashboard
                </Link>
                <Link to="/research" className="nav-link">
                  🔬 Recherche
                </Link>
                <Link to="/performance" className="nav-link">
                  ⚡ Performance
                </Link>
                <Link to="/demonstration" className="nav-link demo-link">
                  🎯 Démonstration Live
                </Link>
                <button onClick={handleLogout} className="logout-btn">
                  🚪 Déconnexion
                </button>
              </nav>
            </div>
          </header>
        )}

        {/* Main Content */}
        <main className="app-main">
          <Routes>
            {/* Login Route */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                  <Navigate to="/demonstration" replace /> : 
                  <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                  <Navigate to="/demonstration" replace /> : 
                  <Login onLogin={handleLogin} />
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  userRole === 'ADMIN' ? <AdminDashboard /> :
                  userRole === 'PROVIDER' ? <ProviderDashboard /> :
                  <UserDashboard />
                )
              } 
            />

            <Route 
              path="/research" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <ResearchDashboard />
                )
              } 
            />

            <Route 
              path="/performance" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <PerformanceTestingLab />
                )
              } 
            />

            {/* Route principale : Démonstration en temps réel */}
            <Route 
              path="/demonstration" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <VCubeRaftDemonstration />
                )
              } 
            />

            {/* Default redirect */}
            <Route 
              path="*" 
              element={
                <Navigate to={isAuthenticated ? "/demonstration" : "/"} replace />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
