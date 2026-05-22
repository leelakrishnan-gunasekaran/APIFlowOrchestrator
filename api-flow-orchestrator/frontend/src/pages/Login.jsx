import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Network } from 'lucide-react'
import './Login.css'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:8085/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token and user info
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.username)
        localStorage.setItem('role', data.role)
        
        // Call parent callback
        onLogin(data)
        
        // Navigate to dashboard
        navigate('/groups')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Network size={48} className="login-icon" />
          <h1>API Flow Orchestrator</h1>
          <p>Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
            style={{ color: '#ffffff' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Default credentials for testing:</p>
          <p><strong>Username:</strong> admin | <strong>Password:</strong> admin123</p>
        </div>
      </div>
    </div>
  )
}

export default Login

// Made with Bob
