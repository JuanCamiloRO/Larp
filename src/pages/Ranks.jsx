// pages/Ranks.jsx
import { useAuth } from '../hooks/useAuth';
import { useRanks } from '../hooks/useRanks';
import { TIERS } from '../lib/rankTiers';

const TIER_BAR_COLORS = {
  larp_baby: '#c26e07',
  larpy: '#0077ff',
  master_larp: '#740bf5',
};

export default function Ranks() {
  const { user } = useAuth();
  const { ranks, loading } = useRanks(user?.id);

  if (loading) {
    return <p className="subtle" style={{ padding: '16px' }}>Loading ranks...</p>;
  }

  if (ranks.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <h1 style={{ color: 'white' }}>Ranks</h1>
        <p className="subtle" style={{ marginTop: '12px' }}>
          Log a lift with thresholds set up to see your rank here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ color: 'white', marginBottom: '16px' }}>Ranks</h1>

      <div className="leaderboard-list">
        {ranks.map((r) => {
          const currentTier = TIERS[r.currentTierKey];
          const nextTier = r.nextTierKey ? TIERS[r.nextTierKey] : null;

          return (
            <div key={r.exercise_id} className="rank-card">
              <div className="rank-card-header">
                <span className="follow-name">{r.exercise_name}</span>
                <span className="subtle">{Math.round(r.best_1rm)}kg e1RM</span>
              </div>

              <div className="rank-progress-wrapper">
                <img
                  src={currentTier.icon}
                  alt={currentTier.label}
                  className="rank-tier-icon"
                />

                <div className="rank-progress-container">
                  <span className="rank-progress-label-top">
                    {Math.round(r.progress)}%
                  </span>
                  <div className="rank-progress-track">
                    <div
                      className="rank-progress-fill"
                      style={{
                        width: `${r.progress}%`,
                        background: TIER_BAR_COLORS[r.currentTierKey],
                      }}
                    />
                  </div>
                </div>

                {nextTier ? (
                  <img
                    src={nextTier.icon}
                    alt={nextTier.label}
                    className="rank-tier-icon"
                  />
                ) : (
                  <span className="rank-tier-icon-maxed">👑</span>
                )}
              </div>

              <div className="rank-card-footer">
                <span className="subtle">{currentTier.label}</span>
                <span className="subtle">
                  {nextTier ? nextTier.label : 'Max tier'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}