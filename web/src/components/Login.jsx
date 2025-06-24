import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { login, isLoading } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields')
      return
    }

    if (formData.username.trim().length < 2) {
      setError('Username must be at least 2 characters long')
      return
    }

    if (formData.password.length < 3) {
      setError('Password must be at least 3 characters long')
      return
    }

    setSuccess('Signing in...')

    const result = await login(formData)
    
    if (!result.success) {
      setSuccess('')
      // Provide more specific error messages
      const errorMessage = result.error.toLowerCase()
      
      if (errorMessage.includes('invalid credentials') || errorMessage.includes('unauthorized')) {
        setError('Invalid username or password. Please check your credentials and try again.')
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        setError('Unable to connect to the server. Please check your internet connection and try again.')
      } else if (errorMessage.includes('timeout')) {
        setError('Request timed out. Please try again.')
      } else {
        setError(result.error || 'An unexpected error occurred. Please try again.')
      }
    } else {
      setError('')
      setSuccess('Login successful! Redirecting...')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h1 style={styles.title}>Social Network</h1>
        <p style={styles.subtitle}>Sign in to see your feed</p>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username (e.g., Alice)"
              style={styles.input}
              disabled={isLoading}
              onFocus={(e) => {
                e.target.style.borderColor = '#007bff'
                e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ddd'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              style={styles.input}
              disabled={isLoading}
              onFocus={(e) => {
                e.target.style.borderColor = '#007bff'
                e.target.style.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#ddd'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {error && (
            <div style={styles.errorMessage}>
              <span style={styles.messageIcon}>⚠️</span>
              {error}
            </div>
          )}

          {success && (
            <div style={styles.successMessage}>
              <span style={styles.messageIcon}>✅</span>
              {success}
            </div>
          )}

          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(isLoading ? styles.buttonDisabled : {})
            }}
            disabled={isLoading}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#0056b3'
                e.target.style.transform = 'translateY(-1px)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.target.style.backgroundColor = '#007bff'
                e.target.style.transform = 'translateY(0)'
              }
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.demoCredentials}>
          <h3>Demo Credentials:</h3>
          <p><strong>User:</strong> username="Alice", password="user"</p>
          <p><strong>Admin:</strong> username="Bob", password="admin"</p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  loginBox: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '8px',
    color: '#333',
    fontSize: '24px',
    fontWeight: 'bold'
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: '32px',
    color: '#666',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    outline: 'none'
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    boxShadow: '0 2px 4px rgba(0, 123, 255, 0.2)'
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    boxShadow: 'none',
    transform: 'none'
  },
  errorMessage: {
    backgroundColor: '#fee',
    color: '#d63384',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #f1aeb5',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    lineHeight: '1.4',
    boxShadow: '0 2px 4px rgba(214, 51, 132, 0.1)'
  },
  successMessage: {
    backgroundColor: '#d1f2eb',
    color: '#0f5132',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '20px',
    border: '1px solid #a3cfbb',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    lineHeight: '1.4',
    boxShadow: '0 2px 4px rgba(15, 81, 50, 0.1)'
  },
  messageIcon: {
    marginRight: '8px',
    fontSize: '16px'
  },
  demoCredentials: {
    marginTop: '32px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '12px',
    textAlign: 'center'
  }
}

export default Login 