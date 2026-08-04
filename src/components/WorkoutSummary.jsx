import { useNavigate } from 'react-router-dom';
import { TIERS } from '../lib/rankTiers';

export default function WorkoutSummary({ summary, onClose }) {
  const navigate = useNavigate();

  if (!summary) return null;

  function handleDone() {
    onClose();
    navigate('/');
  }

  return (
    <div className="summary-overlay" onClick={handleDone}>
      <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
        <div className="summary-header">
          <span className="summary-emoji">🎉</span>
          <h2>Workout Complete</h2>
        </div>

        <div className="summary-stats">
          <div className="summary-stat">
            <strong>{summary.totalVolume.toLocaleString()}</strong>
            <span>kg volume</span>
          </div>
          <div className="summary-stat">
            <strong>{summary.totalSets}</strong>
            <span>sets</span>
          </div>
          <div className="summary-stat">
            <strong>{summary.minutes}</strong>
            <span>min</span>
          </div>
        </div>

        {summary.ranks.length > 0 && (
          <>
            <h3 className="summary-subtitle">Current Ranks</h3>
            <div className="summary-ranks">
              {summary.ranks.map((r) => (
                <div className="summary-rank-row" key={r.exercise_id}>
                  <span className="summary-rank-name">{r.exercises.name}</span>
                  <div className="summary-rank-info">
                    <img src={TIERS[r.rank].icon} alt={TIERS[r.rank].label} className="summary-rank-icon" />
                    <span>{TIERS[r.rank].label}</span>
                  </div>
                  <span className="summary-1rm">{Math.round(r.best_1rm)} kg 1RM</span>
                </div>
              ))}
            </div>
          </>
        )}

        <button className="summary-close-btn" onClick={handleDone}>
          Done
        </button>
      </div>
    </div>
  );
}