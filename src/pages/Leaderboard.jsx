// pages/Leaderboard.jsx
// Exercise leaderboard ranked by e1RM, with a Friends-only toggle. When
// enabled, the leaderboard query is scoped to users the current user
// follows (plus themselves); when disabled, it's the global top list.

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExerciseLeaderboard } from '../hooks/useExerciseLeaderboard';
import { useFollowedUserIds } from '../hooks/useFollowedUserIds';
import ExercisePicker from '../components/ExercisePicker';
import ExerciseRankBadge from '../components/ExerciseRankBadge';
import { TIERS } from '../lib/rankTiers';
import '../css/leaderboard.css';

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const { followedIds, loading: followedLoading } = useFollowedUserIds(user?.id);

  // Scope passed to the leaderboard query: null = global, array = friends only.
  // Always include the current user so they see their own rank in friends mode.
  const scopeUserIds = useMemo(() => {
    if (!friendsOnly) return null;
    return user?.id ? [...new Set([...followedIds, user.id])] : followedIds;
  }, [friendsOnly, followedIds, user?.id]);

  const { leaderboard, loading, error } = useExerciseLeaderboard(
    selectedExercise?.id,
    scopeUserIds
  );

  function resolveImageUrl(img) {
    if (!img) return null;
    return img.startsWith('http') ? img : `${IMAGE_BASE_URL}${img}`;
  }

      if (!selectedExercise) {
  return (
    <div className="leaderboard-welcome">
      <div className="leaderboard-welcome__content">
        <span className="leaderboard-welcome__icon">🏆</span>

        <h1 className="leaderboard-welcome__title">
          Leaderboards
        </h1>

        <p className="leaderboard-welcome__description">
          See how lifters rank around the world and compare your estimated
          one-rep max with friends.
        </p>

        <button
          className="leaderboard-welcome__button"
          onClick={() => setIsPickerOpen(true)}
        >
          Search leaderboards
        </button>
      </div>

      {isPickerOpen && (
        <ExercisePicker
          onClose={() => setIsPickerOpen(false)}
          onSelect={(exercise) => {
            setSelectedExercise(exercise);
            setIsPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

  return (
    <div style={{ padding: '16px' }}>
      <button
        onClick={() => setSelectedExercise(null)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          fontWeight: 700,
          marginBottom: '16px',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ‹ Back to search
      </button>

      <div className="exercise-header" style={{ marginBottom: '4px' }}>
        {selectedExercise.images?.[0] && (
          <img
            className="exercise-thumb"
            src={resolveImageUrl(selectedExercise.images[0])}
            alt={selectedExercise.name}
          />
        )}
        <h1 style={{ color: 'white', fontSize: '20px', margin: 0 }}>{selectedExercise.name}</h1>
      </div>

      <p className="subtle" style={{ fontSize: '13px', marginBottom: '16px' }}>
        Ranked by estimated 1-rep max (e1RM)
      </p>

      <div className="leaderboard-scope-toggle">
        <button
          className={`leaderboard-scope-btn ${!friendsOnly ? 'active' : ''}`}
          onClick={() => setFriendsOnly(false)}
        >
          Everyone
        </button>
        <button
          className={`leaderboard-scope-btn ${friendsOnly ? 'active' : ''}`}
          onClick={() => setFriendsOnly(true)}
        >
          Friends
        </button>
      </div>

      {(loading || (friendsOnly && followedLoading)) && (
        <p className="subtle">Loading leaderboard...</p>
      )}
      {error && <p className="message error">Error: {error}</p>}

      {!loading && !followedLoading && !error && friendsOnly && followedIds.length === 0 && (
        <p className="subtle" style={{ textAlign: 'center', padding: '30px 0' }}>
          You're not following anyone yet. Follow other lifters to compare with them here.
        </p>
      )}

      {!loading && !error && leaderboard.length === 0 && !(friendsOnly && followedIds.length === 0) && (
        <p className="subtle" style={{ textAlign: 'center', padding: '30px 0' }}>
          {friendsOnly
            ? 'None of your friends have logged this exercise yet.'
            : 'No one has logged this exercise yet. Be the first!'}
        </p>
      )}

      {!loading && leaderboard.length > 0 && (
        <div className="leaderboard-list">
          {leaderboard.map((entry, index) => {
            const isYou = entry.user_id === user?.id;
            const exerciseRank = TIERS[selectedExercise.rank]
            return (
              <div
                key={entry.user_id}
                className={`leaderboard-row ${isYou ? 'you' : ''}`}
                onClick={() => !isYou && navigate(`/profile/${entry.user_id}`)}
                style={{ cursor: isYou ? 'default' : 'pointer' }}
              >
                <span className="leaderboard-rank">
                  {MEDALS[index] || `#${index + 1}`}
                </span>

                <img
                  className="follow-avatar"
                  src={entry.profiles?.avatar_url || '/default-avatar.png'}
                  alt={entry.profiles?.username || 'User'}
                />

                <div className="follow-info">
                  <span className="follow-name">
                    {entry.profiles?.username}
                    {isYou && <span className="leaderboard-you-tag"> (you)</span>}
                  </span>
                </div>
                <ExerciseRankBadge exerciseId={selectedExercise.id} userId={entry.user_id} compact={true} />
                <span className="leaderboard-1rm">
                  {Math.round(entry.best_1rm)}kg
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}