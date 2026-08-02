// pages/PublicProfile.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTopLifts } from '../hooks/useTopLifts';
import { supabase } from '../supabase';
import FollowButton from '../components/FollowButton';

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lifts, isCustom } = useTopLifts(userId);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
    fetchFollowCounts();
  }, [userId]);

  async function fetchProfile() {
    const { data, error: fetchError } = await supabase
      .from('profiles').select('*').eq('id', userId).single();
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setProfile(data);
  }

  async function fetchFollowCounts() {
    const { count: followers } = await supabase
      .from('follows').select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    const { count: following } = await supabase
      .from('follows').select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);
    setFollowCounts({ followers: followers || 0, following: following || 0 });
  }

  if (error) return <p className="message error">Couldn't load profile: {error}</p>;
  if (!profile) return <p className="subtle">Loading...</p>;

  return (
    <div style={{ padding: '16px' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, marginBottom: '16px', cursor: 'pointer', padding: 0 }}
      >
        ‹ Back
      </button>

      <div className="exercise-header">
        <img className="follow-avatar" src={profile.avatar_url || '/default-avatar.png'} alt="" style={{ width: 64, height: 64 }} />
        <div>
          <h1 style={{ color: 'white', margin: 0 }}>{profile.username}</h1>
          <p className="subtle">{followCounts.followers} followers · {followCounts.following} following</p>
        </div>
      </div>

      {user?.id !== userId && <FollowButton targetUserId={userId} />}

      <h2 style={{ color: 'white', marginTop: '20px' }}>
        Top Lifts {isCustom && <span className="subtle" style={{ fontSize: '12px', fontWeight: 400 }}>· curated</span>}
      </h2>
      <div className="leaderboard-list">
        {lifts.map((r) => (
          <div key={r.exercise_id} className="leaderboard-row">
            <span className="follow-name">{r.exercise_name}</span>
            <span className="leaderboard-1rm">{Math.round(r.best_1rm)}kg e1RM</span>
          </div>
        ))}
      </div>
    </div>
  );
}