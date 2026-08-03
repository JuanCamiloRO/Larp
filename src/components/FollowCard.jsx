import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useRandomProfiles } from '../hooks/useRandomProfiles';
import { UserPlus, UserCheck } from 'lucide-react';
import FollowButton from './FollowButton';
import '../css/style.css';

export default function FollowCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { suggestions, loading } = useRandomProfiles(5);
  const [following, setFollowing] = useState({});
  const [hidden, setHidden] = useState({});

  useEffect(() => {
    if (!user || suggestions.length === 0) return;
    checkExistingFollows();
  }, [suggestions, user]);

  async function checkExistingFollows() {
    const ids = suggestions.map((u) => u.id);
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id)
      .in('following_id', ids);

    if (!error && data) {
      const map = {};
      data.forEach((row) => {
        map[row.following_id] = true;
      });
      setFollowing((prev) => ({ ...prev, ...map }));
    }
  }

  async function toggleFollow(targetId) {
    const wasFollowing = following[targetId];

    setFollowing((prev) => ({ ...prev, [targetId]: !wasFollowing }));

    const { error } = wasFollowing
      ? await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetId)
      : await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: targetId });

    if (error) {
      setFollowing((prev) => ({ ...prev, [targetId]: wasFollowing }));
    }
  }

  function dismiss(targetId) {
    setHidden((prev) => ({ ...prev, [targetId]: true }));
  }

  const visible = suggestions.filter((u) => !hidden[u.id]);

  if (loading) {
    return (
      <div className="follow-card">
        <h3 className="follow-card-title">Who to follow</h3>
        <p className="follow-card-empty">Loading suggestions…</p>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className="follow-card">
        <h3 className="follow-card-title">Who to follow</h3>
        <p className="follow-card-empty">No new suggestions right now.</p>
      </div>
    );
  }

  return (
    <div className="follow-card">
      <h3 className="follow-card-title">Who to follow</h3>

      {visible.map((u) => (
        <div className="follow-row" key={u.id}>
          <img
            className="follow-avatar"
            src={u.avatar_url || '/default-avatar.png'}
            alt={u.name}
            onClick={() => navigate(`/profile/${u.id}`)}
            style={{ cursor: 'pointer' }}
          />

          <div
            className="follow-info"
            onClick={() => navigate(`/profile/${u.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <span className="follow-name">{u.name}</span>
            <span className="follow-handle">@{u.username}</span>
          </div>

          <FollowButton
            targetUserId={u.id}
            className={`follow-btn ${following[u.id] ? 'following' : ''}`}
            onClick={() => toggleFollow(u.id)}
            style={{ width: '100px', marginRight: '8px' }}
          >
            <span>
              {following[u.id] ? 'Following' : 'Follow'}
            </span>

            {following[u.id] ? <UserCheck /> : <UserPlus />}
          </FollowButton>

          <button
            className="follow-dismiss"
            onClick={() => dismiss(u.id)}
            aria-label="Dismiss suggestion"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}