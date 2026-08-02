import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useExerciseLeaderboard } from '../hooks/useExerciseLeaderboard';
import ExercisePicker from '../components/ExercisePicker';

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const { leaderboard, loading, error } = useExerciseLeaderboard(selectedExercise?.id);

  function resolveImageUrl(img) {
    if (!img) return null;
    return img.startsWith('http') ? img : `${IMAGE_BASE_URL}${img}`;
  }

  if (!selectedExercise) {
    return (
      <div style={{ padding: '16px' }}>
        <h1 style={{ color: 'white', marginBottom: '16px' }}>Leaderboards</h1>
        <p className="subtle" style={{ marginBottom: '16px' }}>
          Search an exercise to see the global top lifts.
        </p>
        <ExercisePicker onSelect={setSelectedExercise} />
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

      <p className="subtle" style={{ fontSize: '13px', marginBottom: '20px' }}>
        Ranked by estimated 1-rep max (e1RM)
      </p>

      {loading && <p className="subtle">Loading leaderboard...</p>}
      {error && <p className="message error">Error: {error}</p>}

      {!loading && !error && leaderboard.length === 0 && (
        <p className="subtle" style={{ textAlign: 'center', padding: '30px 0' }}>
          No one has logged this exercise yet. Be the first!
        </p>
      )}

      {!loading && leaderboard.length > 0 && (
        <div className="leaderboard-list">
          {leaderboard.map((entry, index) => {
            const isYou = entry.user_id === user?.id;
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