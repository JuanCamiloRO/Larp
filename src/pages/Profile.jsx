import { useEffect, useState } from 'react';
import { ArrowLeft, Check, LoaderCircle, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import '../css/profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    username: '',
    name: '',
    bio: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('username, name, bio, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (!isCurrent) return;

      if (profileError) {
        console.error('Failed to load profile:', profileError);
        setError('Could not load your profile.');
      } else {
        setForm({
          username: data?.username || user.user_metadata?.username || '',
          name: data?.name || user.user_metadata?.name || '',
          bio: data?.bio || '',
          avatar_url: data?.avatar_url || user.user_metadata?.avatar_url || '',
        });
      }

      setLoading(false);
    }

    loadProfile();
    return () => {
      isCurrent = false;
    };
  }, [user]);

  function updateField(field, value) {
    setSaved(false);
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!user?.id || saving) return;

    const username = form.username.trim();
    const name = form.name.trim();
    const bio = form.bio.trim();
    const avatarUrl = form.avatar_url.trim();

    if (!username) {
      setError('Choose a username before saving.');
      return;
    }

    setSaving(true);
    setSaved(false);
    setError('');

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          username,
          name: name || null,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      console.error('Failed to save profile:', profileError);
      setError(
        profileError.code === '23505'
          ? 'That username is already taken.'
          : 'Could not save your profile. Please try again.'
      );
      setSaving(false);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        username,
        name: name || null,
        avatar_url: avatarUrl || null,
      },
    });

    if (authError) {
      console.warn('Profile saved, but auth metadata was not updated:', authError);
    }

    setSaved(true);
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="profile-page profile-page--loading">
        <LoaderCircle className="profile-loading-spinner" size={25} />
        Loading profile…
      </main>
    );
  }

  return (
    <main className="profile-page">
      <header className="profile-header">
        <button
          type="button"
          className="profile-header__back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={21} />
        </button>
        <div>
          <p>Account</p>
          <h1>Edit profile</h1>
        </div>
        <span aria-hidden="true" />
      </header>

      <form className="profile-content" onSubmit={saveProfile}>
        <div className="profile-avatar-preview">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="Profile" />
          ) : (
            <UserRound size={32} />
          )}
        </div>


        <section className="profile-fields">
          <label>
            Username
            <input
              value={form.username}
              maxLength={30}
              placeholder="your_username"
              onChange={(event) => updateField('username', event.target.value)}
              autoComplete="username"
            />
          </label>

          <label>
            Full name
            <input
              value={form.full_name}
              maxLength={80}
              placeholder="Your name"
              onChange={(event) => updateField('full_name', event.target.value)}
              autoComplete="name"
            />
          </label>

          <label>
            Bio
            <textarea
              value={form.bio}
              maxLength={160}
              placeholder="What are you working towards?"
              onChange={(event) => updateField('bio', event.target.value)}
              rows={4}
            />
            <small>{form.bio.length}/160</small>
          </label>

          <label>
            Avatar URL
            <input
              value={form.avatar_url}
              placeholder="https://…"
              onChange={(event) => updateField('avatar_url', event.target.value)}
              inputMode="url"
              type="url"
            />
            <small>Use an image URL for now. Upload support can be added with Supabase Storage.</small>
          </label>
        </section>

        {error && <p className="profile-message profile-message--error" role="alert">{error}</p>}
        {saved && (
          <p className="profile-message profile-message--success" role="status">
            <Check size={16} /> Profile updated.
          </p>
        )}

        <button className="profile-save" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </main>
  );
}