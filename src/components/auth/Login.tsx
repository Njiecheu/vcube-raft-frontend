import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { TEST_ACCOUNTS } from '../../data/testAccounts';
import './Login.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

interface LoginProps {
  onLogin?: (role: string) => void;
}

type AlertType = 'error' | 'success';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const storedRole = localStorage.getItem('userRole');
    const storedUserId = localStorage.getItem('userId');
    
    if (storedRole && storedUserId) {
      // User is already logged in, redirect based on role
      switch (storedRole) {
        case 'admin':
          navigate('/admin-dashboard');
          break;
        case 'provider':
          navigate('/provider-dashboard');
          break;
        case 'user':
          navigate('/user-dashboard');
          break;
        case 'researcher':
          navigate('/research-dashboard');
          break;
        default:
          navigate('/dashboard');
      }
    }
  }, [navigate]);

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register form state
  const [registerData, setRegisterData] = useState({
    userType: 'user',
    email: '',
    password: '',
    fullName: '',
    phone: '',
    companyName: '',
    description: '',
  });

  // Alert helper
  const showAlert = (message: string, type: AlertType = 'error') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Login submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        // Stocker les données utilisateur sous forme d'objet
        const userData = {
          id: result.userId,
          email: loginData.email,
          role: result.role,
          name: result.userName || loginData.email
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userRole', result.role);
        localStorage.setItem('userId', result.userId);
        localStorage.setItem('userName', result.userName || loginData.email);
        
        if (onLogin) {
          onLogin(result.role);
        }
        
        // Rediriger en fonction du rôle
        switch (result.role) {
          case 'ADMIN':
            navigate('/admin-dashboard');
            break;
          case 'PROVIDER':
            navigate('/provider-dashboard');
            break;
          case 'USER':
            navigate('/user-dashboard');
            break;
          case 'RESEARCHER':
            navigate('/research-dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      } else {
        showAlert(result.message || 'Erreur de connexion');
      }
    } catch {
      showAlert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Register submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    const {
      userType, email, password, fullName, phone, companyName, description,
    } = registerData;
    let registrationData: any;
    let endpoint = '';
    if (userType === 'user') {
      registrationData = { email, password, fullName, phone };
      endpoint = `${API_BASE_URL}/api/auth/register/user`;
    } else {
      registrationData = { email, password, contactName: fullName, phone, companyName, description };
      endpoint = `${API_BASE_URL}/api/auth/register/provider`;
    }
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        showAlert('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
        setTimeout(() => setTab('login'), 2000);
      } else {
        showAlert(result.message || "Erreur lors de l'inscription");
      }
    } catch {
      showAlert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Style objects matching the HTML CSS
  const styles = {
    container: {
      maxWidth: '1200px',
      width: '100%',
      padding: '2rem',
    },
    loginCard: {
      background: 'white',
      borderRadius: '20px',
      padding: '3rem',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      maxWidth: '400px',
      width: '100%',
      margin: '0 auto',
    },
    logo: {
      textAlign: 'center' as const,
      marginBottom: '2rem',
    },
    logoH1: {
      color: '#667eea',
      fontSize: '2.5rem',
      fontWeight: 700,
      marginBottom: '0.5rem',
    },
    logoP: {
      color: '#666',
      fontSize: '1.1rem',
    },
    authTabs: {
      display: 'flex',
      marginBottom: '2rem',
      background: '#f8f9fa',
      borderRadius: '10px',
      padding: '0.5rem',
    },
    authTab: {
      flex: 1,
      padding: '1rem',
      textAlign: 'center' as const,
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      fontWeight: 600,
    },
    authTabActive: {
      background: 'white',
      color: '#667eea',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    formGroup: {
      marginBottom: '1.5rem',
    },
    label: {
      display: 'block',
      marginBottom: '0.5rem',
      color: '#333',
      fontWeight: 600,
    },
    input: {
      width: '100%',
      padding: '1rem',
      border: '2px solid #e1e5e9',
      borderRadius: '10px',
      fontSize: '1rem',
      transition: 'border-color 0.3s ease',
    },
    btn: {
      width: '100%',
      padding: '1rem',
      border: 'none',
      borderRadius: '10px',
      fontSize: '1.1rem',
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      marginBottom: '1rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    },
    alert: {
      padding: '1rem',
      borderRadius: '10px',
      marginBottom: '1rem',
      fontWeight: 600,
    },
    alertError: {
      background: '#fee',
      color: '#c33',
      border: '1px solid #fcc',
    },
    alertSuccess: {
      background: '#efe',
      color: '#3c3',
      border: '1px solid #cfc',
    },
    hidden: {
      display: 'none',
    },
    textarea: {
      width: '100%',
      padding: '1rem',
      border: '2px solid #e1e5e9',
      borderRadius: '10px',
      fontSize: '1rem',
      resize: 'vertical' as const,
      fontFamily: 'inherit',
    },
  };

  return (
    <div style={{ 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: 0,
      position: 'fixed',
      top: 0,
      left: 0,
      boxSizing: 'border-box',
    }}>
      <div style={styles.container}>
        <div style={styles.loginCard}>
          <div style={styles.logo}>
            <h1 style={styles.logoH1}>VCube-PS</h1>
            <p style={styles.logoP}>Système de Réservation Distribué</p>
          </div>
          
          <div style={styles.authTabs}>
            <div
              style={{
                ...styles.authTab,
                ...(tab === 'login' ? styles.authTabActive : {}),
              }}
              onClick={() => setTab('login')}
            >
              Connexion
            </div>
            <div
              style={{
                ...styles.authTab,
                ...(tab === 'register' ? styles.authTabActive : {}),
              }}
              onClick={() => setTab('register')}
            >
              Inscription
            </div>
          </div>

          {alert && (
            <div style={{
              ...styles.alert,
              ...(alert.type === 'error' ? styles.alertError : styles.alertSuccess),
            }}>
              {alert.message}
            </div>
          )}

          {/* Informations des comptes de test */}
          {/* {tab === 'login' && (
            <div style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '1rem', 
              borderRadius: '10px', 
              marginBottom: '1.5rem',
              border: '1px solid rgba(255,255,255,0.2)'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff', fontSize: '1rem' }}>🧪 Comptes de test disponibles :</h4>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)' }}>
                <p style={{ margin: '0.25rem 0' }}><strong>👤 Utilisateur :</strong> raph@vcube.com / airline</p>
                <p style={{ margin: '0.25rem 0' }}><strong>🏢 Fournisseur :</strong> prov2@vcube.com / airline</p>
                <p style={{ margin: '0.25rem 0' }}><strong>🔧 Admin :</strong> admin@vcube.com / admin123</p>
              </div>
            </div>
          )} */}

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            style={tab === 'login' ? {} : styles.hidden}
          >
            <div style={styles.formGroup}>
              <label htmlFor="login-email" style={styles.label}>Email</label>
              <input
                type="email"
                id="login-email"
                name="email"
                value={loginData.email}
                onChange={e => setLoginData({ ...loginData, email: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="login-password" style={styles.label}>Mot de passe</label>
              <input
                type="password"
                id="login-password"
                name="password"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          {/* Register Form */}
          <form
            onSubmit={handleRegister}
            style={tab === 'register' ? {} : styles.hidden}
          >
            <div style={styles.formGroup}>
              <label htmlFor="user-type" style={styles.label}>Type de compte</label>
              <select
                id="user-type"
                name="userType"
                value={registerData.userType}
                onChange={e => setRegisterData({ ...registerData, userType: e.target.value })}
                style={styles.input}
              >
                <option value="user">Utilisateur</option>
                <option value="provider">Fournisseur</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="register-email" style={styles.label}>Email</label>
              <input
                type="email"
                id="register-email"
                name="email"
                value={registerData.email}
                onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="register-password" style={styles.label}>Mot de passe</label>
              <input
                type="password"
                id="register-password"
                name="password"
                value={registerData.password}
                onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                style={styles.input}
                required
                minLength={6}
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="full-name" style={styles.label}>Nom complet</label>
              <input
                type="text"
                id="full-name"
                name="fullName"
                value={registerData.fullName}
                onChange={e => setRegisterData({ ...registerData, fullName: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="phone" style={styles.label}>Téléphone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={registerData.phone}
                onChange={e => setRegisterData({ ...registerData, phone: e.target.value })}
                style={styles.input}
                required
              />
            </div>
            
            {/* Provider-specific fields */}
            {registerData.userType === 'provider' && (
              <div id="provider-fields">
                <div style={styles.formGroup}>
                  <label htmlFor="company-name" style={styles.label}>Nom de l'entreprise</label>
                  <input
                    type="text"
                    id="company-name"
                    name="companyName"
                    value={registerData.companyName}
                    onChange={e => setRegisterData({ ...registerData, companyName: e.target.value })}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label htmlFor="company-description" style={styles.label}>Description de l'entreprise</label>
                  <textarea
                    id="company-description"
                    name="description"
                    rows={3}
                    value={registerData.description}
                    onChange={e => setRegisterData({ ...registerData, description: e.target.value })}
                    style={styles.textarea}
                    placeholder="Décrivez votre entreprise de transport..."
                    required
                  />
                </div>
              </div>
            )}
            
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Inscription...' : "S'inscrire"}
            </button>
          </form>

          {/* Lien vers le dashboard des métriques */}
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #e1e5e9', textAlign: 'center' }}>
            <p style={{ color: '#666', marginBottom: '1rem' }}>Supervision du système</p>
            <a
              href="metrics-dashboard.html"
              style={{
                display: 'inline-block',
                padding: '0.8rem 1.5rem',
                background: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                transition: 'background 0.3s ease',
              }}
              onMouseOver={e => (e.currentTarget.style.background = '#218838')}
              onMouseOut={e => (e.currentTarget.style.background = '#28a745')}
            >
              📊 Dashboard des Métriques
            </a>
            <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Visualisez les performances du consensus Raft et des réservations en temps réel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
