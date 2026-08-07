import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Camera, Check, LoaderCircle, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import '../css/profile.css';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const AVATAR_PATH_PREFIX = 'avatars';
const R2_PUBLIC_AVATAR_URL = import.meta.env.VITE_R2_PUBLIC_AVATAR_URL;

function publicAvatarUrl(key) {
  if (!key) return '';
  return `${R2_PUBLIC_AVATAR_URL}/${key}`;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(''); // local object URL while uploading
  const originalAvatarUrlRef = useRef('');

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
        const loadedAvatarUrl = data?.avatar_url || user.user_metadata?.avatar_url || '';
        setForm({
          username: data?.username || user.user_metadata?.username || '',
          name: data?.name || user.user_metadata?.name || '',
          bio: data?.bio || '',
          avatar_url: loadedAvatarUrl,
        });
        originalAvatarUrlRef.current = loadedAvatarUrl;
      }

      setLoading(false);
    }

    loadProfile();
    return () => {
      isCurrent = false;
    };
  }, [user]);

  // Clean up any local object URL we created for an optimistic preview
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function updateField(field, value) {
    setSaved(false);
    setError('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openAvatarPicker() {
    if (avatarUploading) return;
    fileInputRef.current?.click();
  }

  async function handleAvatarSelected(event) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow picking the same file again later
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Image is too large (max 5MB).');
      return;
    }

    setError('');
    setSaved(false);

    // Show an instant local preview while the real upload happens
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setAvatarUploading(true);

    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `${Date.now()}.${extension}`;

      // 1. Ask our edge function for a presigned upload URL
      const { data: uploadData, error: uploadUrlError } = await supabase.functions.invoke(
        'r2-upload-url',
        {
          body: {
            userId: user.id,
            filename,
            contentType: file.type,
            pathPrefix: AVATAR_PATH_PREFIX,
          },
        }
      );

      if (uploadUrlError || !uploadData?.uploadUrl || !uploadData?.key) {
        throw uploadUrlError || new Error('No upload URL returned');
      }

      // 2. Upload the file straight to R2 via the presigned URL
      const putResponse = await fetch(uploadData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!putResponse.ok) {
        throw new Error(`Upload failed with status ${putResponse.status}`);
      }

      // 3. Bucket is public — build the permanent URL directly, no signing needed
      updateField('avatar_url', publicAvatarUrl(uploadData.key));
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setError('Could not upload image. Please try again.');
    } finally {
      URL.revokeObjectURL(localUrl);
      setAvatarPreview('');
      setAvatarUploading(false);
    }
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

    // Avatar changed and save succeeded — safe to clean up the old file now
    const oldAvatarUrl = originalAvatarUrlRef.current;
    if (
      oldAvatarUrl &&
      oldAvatarUrl !== avatarUrl &&
      R2_PUBLIC_AVATAR_URL &&
      oldAvatarUrl.startsWith(R2_PUBLIC_AVATAR_URL)
    ) {
      const oldKey = oldAvatarUrl.slice(R2_PUBLIC_AVATAR_URL.length + 1);
      supabase.functions
        .invoke('r2-delete', { body: { key: oldKey } })
        .catch((err) => console.warn('Failed to delete old avatar:', err));
    }
    originalAvatarUrlRef.current = avatarUrl; // this save is now the new baseline

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

  const displayedAvatar = avatarPreview || form.avatar_url;

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
        <button
          type="button"
          className="profile-avatar-preview profile-avatar-preview--clickable"
          onClick={openAvatarPicker}
          disabled={avatarUploading}
          aria-label="Change profile picture"
        >
          {displayedAvatar ? (
            <img src={displayedAvatar} alt="Profile" />
          ) : (
            <UserRound size={32} />
          )}

          <span className="profile-avatar-preview__overlay">
            {avatarUploading ? (
              <LoaderCircle className="profile-loading-spinner" size={20} />
            ) : (
              <Camera size={20} />
            )}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarSelected}
          hidden
        />

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
              value={form.name}
              maxLength={80}
              placeholder="Your name"
              onChange={(event) => updateField('name', event.target.value)}
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