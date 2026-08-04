// pages/MuscleRanks.jsx
import { useAuth } from '../hooks/useAuth';
import { useMuscleRanks } from '../hooks/useMuscleRanks';
import { TIERS } from '../lib/rankTiers';
import { muscleLabel } from '../lib/muscleLabels';

const TIER_BAR_COLORS = {
  'Scroller': '#6b7280',
  'Crossfitter': '#0077ff',
  'Calisthenic': '#00b894',
  'Gymbro': '#c26e07',
  'Peptide': '#740bf5',
  'Larper': '#e91e8c',
  'Fake Natty': '#ff2d2d',
};

export default function MuscleRanks() {
  const { user } = useAuth();
  const { muscleRanks, loading } = useMuscleRanks(user?.id);

  if (loading) {
    return <p className="subtle" style={{ padding: '16px' }}>Loading muscle ranks...</p>;
  }

  if (muscleRanks.length === 0) {
    return (
      <div style={{ padding: '16px' }}>
        <h1 style={{ color: 'white' }}>Muscle Ranks</h1>
        <p className="subtle" style={{ marginTop: '12px' }}>
          Log lifts across a few exercises to see your muscle ranks here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ color: 'white', marginBottom: '16px' }}>Muscle Ranks</h1>

      <div className="leaderboard-list">
        {muscleRanks.map((m) => {
          const currentTier = TIERS[m.currentTierKey];
          const nextTier = m.nextTierKey ? TIERS[m.nextTierKey] : null;

          if (!currentTier) return null;

          return (
            <div key={m.muscle} className="rank-card">
              <div className="rank-card-header">
                <span className="follow-name">{muscleLabel(m.muscle)}</span>
              </div>

              <div className="rank-progress-wrapper">
                <img src={currentTier.icon} alt={currentTier.label} className="rank-tier-icon" />

                <div className="rank-progress-container">
                  <span className="rank-progress-label-top">{Math.round(m.progress)}%</span>
                  <div className="rank-progress-track">
                    <div
                      className="rank-progress-fill"
                      style={{ width: `${m.progress}%`, background: TIER_BAR_COLORS[m.currentTierKey] }}
                    />
                  </div>
                </div>

                {nextTier ? (
                  <img src={nextTier.icon} alt={nextTier.label} className="rank-tier-icon" />
                ) : (
                  <span className="rank-tier-icon-maxed">👑</span>
                )}
              </div>

              <div className="rank-card-footer">
                <span className="subtle">{currentTier.label}</span>
                <span className="subtle">{nextTier ? nextTier.label : 'Max tier'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}