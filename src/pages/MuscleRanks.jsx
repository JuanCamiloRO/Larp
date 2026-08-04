import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMuscleRanks } from '../hooks/useMuscleRanks';
import { TIERS } from '../lib/rankTiers';
import { muscles } from '../lib/muscles';
import { ChevronDown } from 'lucide-react';
import '../css/muscleRanks.css';

export default function MuscleRanks() {
  const { user } = useAuth();
  const { muscleRanks, loading } = useMuscleRanks(user?.id);
  const [expandedMuscle, setExpandedMuscle] = useState(null);

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

      <div className="muscle-rank-list">
        {muscleRanks.map((m) => {
          const currentTier = TIERS[m.currentTierKey];
          if (!currentTier) return null;

          const { icon: muscleIconSrc, label: muscleName } = muscles(m.muscle);
          const isExpanded = expandedMuscle === m.muscle;

          return (
            <div key={m.muscle} className="muscle-rank-card">
              <button
                className="muscle-rank-row"
                onClick={() => setExpandedMuscle(isExpanded ? null : m.muscle)}
              >
                <div className="muscle-rank-left">
                  <img src={muscleIconSrc} alt={muscleName} className="muscle-icon" />
                  <span className="follow-name">{muscleName}</span>
                </div>

                <div className="muscle-rank-right">
                  <img src={currentTier.icon} alt={currentTier.label} className="rank-tier-icon-sm" />
                  <span className="muscle-rank-badge-label">{currentTier.label}</span>
                  <ChevronDown
                    size={16}
                    className={`muscle-chevron ${isExpanded ? 'rotated' : ''}`}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="muscle-rank-detail">
                  {m.exercises.length === 0 ? (
                    <p className="subtle" style={{ padding: '8px 0' }}>No exercises logged yet.</p>
                  ) : (
                    m.exercises.map((ex) => {
                      const exTier = TIERS[ex.rank];
                      return (
                        <div key={ex.exerciseId} className="muscle-detail-row">
                          <span className="muscle-detail-name">{ex.name}</span>
                          <div className="muscle-detail-right">
                            <span className="subtle">{Math.round(ex.best1RM)}kg e1RM</span>
                            {exTier && (
                              <>
                                <img src={exTier.icon} alt={exTier.label} className="rank-tier-icon-xs" />
                                <span className="subtle">{exTier.label}</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}