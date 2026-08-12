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
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!email || !password || !username) {
            setError('Please, fill all the fields');
            setLoading(false);
            return;
        }
        if (!email.includes('@')) {
            setError('Email in wrong format');
            setLoading(false);
            return;
        }
        if (password.length < 8) {
            setError('Password must have at least 8 digits');
            setLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }
        if (!privacyAgreement) {
            setError('You must accept the privacy and legal agreement');
            setLoading(false);
            return;
        }

        // 1. Crear usuario
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            setError(signUpError.message || 'Sign up failed');
            setLoading(false);
            return;
        }

        // 2. Crear fila vacía en profiles (así el onboarding puede cargarla)
        if (authData?.user) {
            await supabase.from('profiles').upsert({
                id: authData.user.id,
                username: username,
                email: email,
                onboarding_completed: false,
            }, { onConflict: 'id' });
        }

        // 3. Ir al onboarding
        navigate('/onboarding', { replace: true });
        setLoading(false);
    };

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
                    <input onChange={(e) => setUsername(e.target.value)} value={username} className="input-field" type="text" placeholder="Username" />
                    <input onChange={(e) => setEmail(e.target.value)} value={email} className="input-field" type="email" placeholder="Email" />
                    <input onChange={(e) => setPassword(e.target.value)} value={password} className="input-field" type="password" placeholder="Password" />
                    <input onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} className="input-field" type="password" placeholder="Confirm password" />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: '20px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={privacyAgreement} onChange={(e) => setPrivacyAgreement(e.target.checked)} />
                    <span>I accept the <Link to="/privacy-legal" onClick={(e) => e.stopPropagation()} style={{ color: '#ff3b30' }}>Privacy Policy and Terms of Service</Link></span>
                </label>

                <button type="button" onClick={handleSignUp} disabled={loading} className="primary-btn">
                    {loading ? 'Creating...' : 'Sign Up'}
                </button>

                {error && <p style={{ color: '#ef4444', marginTop: 12, fontSize: 14 }}>{error}</p>}

                <p className="small-text" style={{ marginTop: 16 }}>
                    Already have an account? <Link to="/login" style={{ color: '#ff3b30' }}>Log in</Link>
                </p>
            </div>
        </div>
    );
}