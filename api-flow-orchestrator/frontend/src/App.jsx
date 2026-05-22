import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import { Network, Play, BarChart3, FileText, Zap, Moon, Sun, LogOut, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import Dashboard from './pages/Dashboard'
import ApiGroupEditor from './pages/ApiGroupEditor'
import ExecutionHistory from './pages/ExecutionHistory'
import PerformanceDashboard from './pages/PerformanceDashboard'
import ApiTesterRefactored from './components/ApiTesterRefactored'
import Login from './pages/Login'
import './App.css'
import './theme.css'

function App() {
  // Initialize theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    return savedTheme || 'light'
  })

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    const role = localStorage.getItem('role')

    if (token && username && role) {
      // Validate token with backend
      fetch('http://localhost:8085/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.username) {
            setUser({ username: data.username, role: data.role })
            setIsAuthenticated(true)
          } else {
            handleLogout()
          }
        })
        .catch(() => {
          handleLogout()
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  // Apply theme to document root and save to localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Toggle between light and dark theme
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  // Handle login
  const handleLogin = (userData) => {
    setUser({ username: userData.username, role: userData.role })
    setIsAuthenticated(true)
  }

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('role')
    setUser(null)
    setIsAuthenticated(false)
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <Network size={24} />
          <h1>API Flow Orchestrator</h1>
        </div>
        <div className="navbar-links">
          <Link to="/groups" className="nav-link">
            <Network size={18} />
            API Groups
          </Link>
          <Link to="/tester" className="nav-link">
            <Zap size={18} />
            API Tester
          </Link>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>
          <div className="user-info">
            <User size={18} />
            <span>{user?.username} ({user?.role})</span>
          </div>
          <button
            className="logout-button"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/groups" element={<Dashboard />} />
          <Route path="/groups/:id" element={<ApiGroupEditor />} />
          <Route path="/performance-dashboard/:groupId" element={<PerformanceDashboard />} />
          <Route path="/tester" element={<ApiTesterRefactored />} />
          <Route path="/history" element={<ExecutionHistory />} />
          <Route path="*" element={<Navigate to="/groups" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

// Made with Bob
