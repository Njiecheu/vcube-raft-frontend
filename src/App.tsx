import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/auth/Login'
import AdminDashboard from './components/dashboard/NewAdminDashboard'
import VCubePSProviderDashboard from './components/dashboard/VCubePSProviderDashboard'
import VCubePSUserDashboard from './components/user/VCubePSUserDashboard'
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
        {/* Main Content */}
        <main className="app-main">
          <Routes>
            {/* Login Route */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? 
                  (userRole === 'ADMIN' ? <Navigate to="/admin-dashboard" replace /> :
                   userRole === 'PROVIDER' ? <Navigate to="/provider-dashboard" replace /> :
                   userRole === 'USER' ? <Navigate to="/user-dashboard" replace /> :
                   userRole === 'RESEARCHER' ? <Navigate to="/research-dashboard" replace /> :
                   <Navigate to="/dashboard" replace />) : 
                  <Login onLogin={handleLogin} />
              } 
            />
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                  (userRole === 'ADMIN' ? <Navigate to="/admin-dashboard" replace /> :
                   userRole === 'PROVIDER' ? <Navigate to="/provider-dashboard" replace /> :
                   userRole === 'USER' ? <Navigate to="/user-dashboard" replace /> :
                   userRole === 'RESEARCHER' ? <Navigate to="/research-dashboard" replace /> :
                   <Navigate to="/dashboard" replace />) : 
                  <Login onLogin={handleLogin} />
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/admin-dashboard" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : userRole === 'ADMIN' ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />

            <Route 
              path="/provider-dashboard" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : userRole === 'PROVIDER' ? (
                  <VCubePSProviderDashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />

            <Route 
              path="/user-dashboard" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : userRole === 'USER' ? (
                  <VCubePSUserDashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />

            <Route 
              path="/research-dashboard" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : userRole === 'RESEARCHER' ? (
                  <ResearchDashboard />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />

            {/* Legacy dashboard route for backward compatibility */}
            <Route 
              path="/dashboard" 
              element={
                !isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  userRole === 'admin' ? <Navigate to="/admin-dashboard" replace /> :
                  userRole === 'provider' ? <Navigate to="/provider-dashboard" replace /> :
                  userRole === 'user' ? <Navigate to="/user-dashboard" replace /> :
                  userRole === 'researcher' ? <Navigate to="/research-dashboard" replace /> :
                  <VCubePSUserDashboard />
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
