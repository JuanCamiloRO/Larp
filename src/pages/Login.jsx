import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../supabase'

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
    } else {
      navigate('/')  // redirect to home after login
    }
    setLoading(false)
  }

  return (
    <div className="screen">
      <div className="panel">
        <div className="panel-header">
          <span className="brand">Larp</span>
          <Link to="/" className="icon-btn">←</Link>
        </div>

        <h1 className="page-title">Welcome</h1>
        <p className="subtle">Sign in to continue with your account and keep your profile updated.</p>

        <form className="form-grid" onSubmit={handleLogin}>
          <input
            className="input-field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <div className="password-row">
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>

          {error && <p className="message error">{error}</p>}
          {!error && message && <p className="message success">{message}</p>}
        </form>

        <p className="small-text">
          Need an account? <Link to="/signup" className="text-link">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
