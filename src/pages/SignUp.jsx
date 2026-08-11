import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../supabase';

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [privacyAgreement, setPrivacyAgreement] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    
    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        
        if (!email || !password || !username) {
            setError('Please, fill all the fields')
            setLoading(false)
            return
        }
        if (!email.includes('@')) {
            setError('Email in wrong format')
            setLoading(false)
            return
        }
        if (password.length < 8) {
            setError('Password must have at least 8 digits')
            setLoading(false)
            return
        }
        if (password !== confirmPassword) {
            setError("Passwords don't match")
            setLoading(false)
            return
        }

        if (!privacyAgreement) {
            setError('You must accept the privacy and legal agreement')
            setLoading(false)
            return
        }

      

        const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
        data: { username },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
    }
})

        if (error) {
            setError(error.message)
        } else {
            // Limpiar formulario
            setError('')
            setSuccess('Check your email to verify your account.')
            setUsername('')
            setEmail('')
            setPassword('')
            setConfirmPassword('')
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

        <div className="form-grid">
          <input onChange={(e) => setUsername(e.target.value)} className="input-field" type="text" placeholder="Username" />
          <input onChange={(e) => setEmail(e.target.value)} className="input-field" type="email" placeholder="Email" />
          <input onChange={(e) => setPassword(e.target.value)} className="input-field" type="password" placeholder="Password" />
          <input onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" type="password" placeholder="Confirm password" />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: '20px' }}>
  <input type="checkbox" checked={privacyAgreement} onChange={(e) => setPrivacyAgreement(e.target.checked)} />
  <span>I accept the <Link to="/privacy-legal" onClick={(e) => e.stopPropagation()} style={{ color: '#ff3b30' }}>Privacy Policy and Terms of Service</Link></span>
</label>
        <button onClick={handleSignUp} className="primary-btn">Sign Up</button>

        <div className="form-row" style={{ marginBottom: '22px' }}>
          {error && <span style={{ color: 'red', marginTop: '10px' }} className="small-text">{error}</span>}
          {success && <span style={{ color: 'green', marginTop: '10px' }} className="small-text">{success}</span>}
        </div>

        <p className="small-text">
          Already have an account? <Link to="/login" style={{ color: '#ff3b30' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
