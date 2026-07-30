import { useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useRandomProfiles } from '../hooks/useRandomProfiles';

export default function FollowCard() {
  const { user } = useAuth();
  const { suggestions, loading } = useRandomProfiles(5);
  const [following, setFollowing] = useState({});
  const [hidden, setHidden] = useState({});
  console.log(suggestions);

  async function toggleFollow(targetId) {
  const isFollowing = following[targetId];

  if (!isFollowing) {
    await supabase.from('follows').insert({
      follower_id: user.id,
      following_id: targetId,
    });
  } else {
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetId);
  }

  setFollowing((prev) => ({ ...prev, [targetId]: !isFollowing }));
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
          />

          <div className="follow-info">
            <span className="follow-name">{u.name}</span>
            <span className="follow-handle">@{u.username}</span>
          </div>

          <button
            className={`follow-btn ${following[u.id] ? 'following' : ''}`}
            onClick={() => toggleFollow(u.id)}
          >
            <span>{following[u.id] ? 'Following' : 'Follow'}</span>
          </button>

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