// pages/PublicProfile.jsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import FollowButton from '../components/FollowButton';

export default function PublicProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [followCounts, setFollowCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    fetchProfile();
    fetchRecords();
    fetchFollowCounts();
  }, [userId]);

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data);
  }

  async function fetchRecords() {
    const { data } = await supabase
      .from('exercise_ranks')
      .select('best_1rm, rank, exercises(name)')
      .eq('user_id', userId)
      .order('best_1rm', { ascending: false })
      .limit(10);
    setRecords(data || []);
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

  if (!profile) return <p className="subtle">Loading...</p>;

  return (
    <div style={{ padding: '16px' }}>
      <div className="exercise-header">
        <img className="follow-avatar" src={profile.avatar_url || '/default-avatar.png'} alt="" style={{ width: 64, height: 64 }} />
        <div>
          <h1 style={{ color: 'white', margin: 0 }}>{profile.username}</h1>
          <p className="subtle">{followCounts.followers} followers · {followCounts.following} following</p>
        </div>
      </div>

      {user?.id !== userId && <FollowButton targetUserId={userId} />}

      <h2 style={{ color: 'white', marginTop: '20px' }}>Top Lifts</h2>
      <div className="leaderboard-list">
        {records.map((r, i) => (
          <div key={i} className="leaderboard-row">
            <span className="follow-name">{r.exercises?.name}</span>
            <span className="leaderboard-1rm">{Math.round(r.best_1rm)}kg e1RM</span>
          </div>
        ))}
      </div>
    </div>
  );
}