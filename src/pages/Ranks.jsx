import { useAuth } from '../hooks/useAuth';
import { useMuscleRanks } from '../hooks/useMuscleRanks';
import { TIERS } from '../lib/rankTiers';
import { muscleLabel } from '../lib/muscleLabels';
import '../css/muscleRanks.css';

const TIER_BAR_COLORS = {
  Scroller: '#6b7280',
  Crossfitter: '#0077ff',
  Calisthenic: '#00b894',
  Gymbro: '#c26e07',
  Peptide: '#740bf5',
  Larper: '#e91e8c',
  'Fake Natty': '#ff2d2d',
};

function MuscleRanksSkeleton() {
  return (
    <main
      className="muscle-ranks-page"
      aria-busy="true"
      aria-label="Loading muscle ranks"
    >
      <div className="muscle-ranks-page__header">
        <div className="muscle-ranks-skeleton muscle-ranks-skeleton--title" />
        <div className="muscle-ranks-skeleton muscle-ranks-skeleton--subtitle" />
      </div>

      <div className="leaderboard-list muscle-ranks-skeleton-list">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="rank-card rank-card--skeleton" key={index}>
            <div className="rank-card-header">
              <div className="muscle-ranks-skeleton muscle-ranks-skeleton--muscle-name" />
            </div>

            <div className="rank-progress-wrapper">
              <div className="muscle-ranks-skeleton muscle-ranks-skeleton--tier-icon" />

              <div className="rank-progress-container">
                <div className="muscle-ranks-skeleton muscle-ranks-skeleton--percentage" />
                <div className="rank-progress-track">
                  <div className="muscle-ranks-skeleton muscle-ranks-skeleton--progress" />
                </div>
              </div>

              <div className="muscle-ranks-skeleton muscle-ranks-skeleton--tier-icon" />
            </div>

            <div className="rank-card-footer">
              <div className="muscle-ranks-skeleton muscle-ranks-skeleton--tier-label" />
              <div className="muscle-ranks-skeleton muscle-ranks-skeleton--tier-label" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function MuscleRanks() {
  const { user } = useAuth();
  const { muscleRanks, loading } = useMuscleRanks(user?.id);

  if (loading) {
    return <MuscleRanksSkeleton />;
  }

  if (muscleRanks.length === 0) {
    return (
      <main className="muscle-ranks-page">
        <div className="muscle-ranks-page__header">
          <h1 className="muscle-ranks-page__title">Muscle Ranks</h1>
        </div>

        <div className="muscle-ranks-empty">
          <div className="muscle-ranks-empty__icon" aria-hidden="true">
            🏋️
          </div>

          <h2>No muscle ranks yet</h2>

          <p>
            Log lifts across a few exercises to start building ranks for each
            muscle group.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="muscle-ranks-page">
      <div className="muscle-ranks-page__header">
        <h1 className="muscle-ranks-page__title">Muscle Ranks</h1>
        <p className="muscle-ranks-page__subtitle">
          Your progress across every muscle group.
        </p>
      </div>

      <div className="leaderboard-list">
        {muscleRanks.map((muscleRank) => {
          const currentTier = TIERS[muscleRank.currentTierKey];
          const nextTier = muscleRank.nextTierKey
            ? TIERS[muscleRank.nextTierKey]
            : null;

          if (!currentTier) return null;

          const progress = Math.min(
            100,
            Math.max(0, Math.round(muscleRank.progress))
          );

          return (
            <div key={muscleRank.muscle} className="rank-card">
              <div className="rank-card-header">
                <span className="follow-name">
                  {muscleLabel(muscleRank.muscle)}
                </span>
              </div>

              <div className="rank-progress-wrapper">
                <img
                  src={currentTier.icon}
                  alt={currentTier.label}
                  className="rank-tier-icon"
                />

                <div className="rank-progress-container">
                  <span className="rank-progress-label-top">
                    {progress}%
                  </span>

                  <div className="rank-progress-track">
                    <div
                      className="rank-progress-fill"
                      style={{
                        width: `${progress}%`,
                        background: TIER_BAR_COLORS[muscleRank.currentTierKey],
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
                  <span
                    className="rank-tier-icon-maxed"
                    aria-label="Maximum tier"
                  >
                    👑
                  </span>
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
    </main>
  );
}