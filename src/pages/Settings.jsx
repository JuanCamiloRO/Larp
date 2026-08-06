import { useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Info,
  LogOut,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import '../css/settings.css';

const APP_VERSION = '0.1.0 beta';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    if (loggingOut) return;

    const confirmed = window.confirm('Are you sure you want to log out?');
    if (!confirmed) return;

    setLoggingOut(true);
    setError('');

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error('Failed to log out:', signOutError);
      setError('Could not log out. Please try again.');
      setLoggingOut(false);
      return;
    }

    navigate('/login', { replace: true });
  }

  return (
    <main className="settings-page">
      <header className="settings-header">
        <button
          type="button"
          className="settings-header__back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={21} />
        </button>
        <div>
          <p>Account</p>
          <h1>Settings</h1>
        </div>
        <span aria-hidden="true" />
      </header>

      <section className="settings-content">
        <section className="settings-profile-card">
          <span className="settings-profile-card__icon" aria-hidden="true">
            <UserRound size={22} />
          </span>
          <div>
            <strong>{user?.user_metadata?.username || 'Your account'}</strong>
            <p>{user?.email || 'Account information'}</p>
          </div>
        </section>

        <section className="settings-section">
          <h2>Account</h2>
          <div className="settings-list">
            <button
              type="button"
              className="settings-row"
              onClick={() => navigate('/profile')}
            >
              <span className="settings-row__icon"><UserRound size={18} /></span>
              <span className="settings-row__text">
                <strong>Edit profile</strong>
                <small>Update your name, username, and photo</small>
              </span>
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2>App</h2>
          <div className="settings-list">
            <div className="settings-row settings-row--static">
              <span className="settings-row__icon"><Info size={18} /></span>
              <span className="settings-row__text">
                <strong>Version</strong>
                <small>Current beta release</small>
              </span>
              <span className="settings-row__value">{APP_VERSION}</span>
            </div>

            <button
              type="button"
              className="settings-row"
              onClick={() => navigate('/privacy')}
            >
              <span className="settings-row__icon"><ShieldCheck size={18} /></span>
              <span className="settings-row__text">
                <strong>Privacy and data</strong>
                <small>Manage how your data is used</small>
              </span>
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        <button
          type="button"
          className="settings-logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={18} />
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>

        {error && (
          <p className="settings-error" role="alert">
            {error}
          </p>
        )}

        <p className="settings-footer">Built for consistent progress.</p>
      </section>
    </main>
  );
}