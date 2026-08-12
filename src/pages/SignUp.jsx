import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../supabase';

const toDisplayMessage = (value) => {
    if (!value) return 'Something went wrong.';
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.message;
    if (typeof value === 'object') {
        if (typeof value.message === 'string') return value.message;
        if (typeof value.error_description === 'string') return value.error_description;
        // Si es un objeto vacío, damos un mensaje útil
        if (Object.keys(value).length === 0) return 'Registration failed. The email may already be in use, or there is a network issue.';
        try {
            return JSON.stringify(value);
        } catch {
            return 'Something went wrong.';
        }
    }
    return String(value);
};

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
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

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

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (signUpError) {
            setError(toDisplayMessage(signUpError));
            setLoading(false);
            return;
        }

        // Si llegamos aquí, el usuario está creado. Creamos/actualizamos su fila en profiles.
        if (authData?.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    username: username,
                    email: email,
                    onboarding_completed: false,
                }, { onConflict: 'id' });

            if (profileError) {
                console.error('Error creating profile:', profileError);
                // No bloqueamos al usuario, solo logueamos. El onboarding puede recuperarse.
            }
        }

        setSuccess('Account created! Redirecting...');
        setTimeout(() => {
            navigate('/onboarding', { replace: true });
        }, 800);

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

                <div className="form-row" style={{ marginBottom: '22px', marginTop: '12px', flexDirection: 'column', alignItems: 'center' }}>
                    {error && <span style={{ color: '#ef4444', fontSize: 14 }} className="small-text">{error}</span>}
                    {success && <span style={{ color: '#22c55e', fontSize: 14 }} className="small-text">{success}</span>}
                </div>

                <p className="small-text">
                    Already have an account? <Link to="/login" style={{ color: '#ff3b30' }}>Log in</Link>
                </p>
            </div>
        </div>
    );
}