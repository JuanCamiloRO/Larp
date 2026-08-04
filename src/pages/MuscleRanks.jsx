import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useMuscleRanks } from '../hooks/useMuscleRanks';
import { TIERS } from '../lib/rankTiers';
import { muscles } from '../lib/muscles';
import { ChevronDown } from 'lucide-react';
import '../css/muscleRanks.css';

const TIER_BAR_COLORS = {
  'Scroller': '#6b7280',
  'Crossfitter': '#0077ff',
  'Calisthenic': '#00b894',
  'Gymbro': '#c26e07',
  'Peptide': '#740bf5',
  'Larper': '#e91e8c',
  'Fake Natty': '#ff2d2d',
};

function ExerciseList({ exercises }) {
  if (exercises.length === 0) {
    return <p className="subtle" style={{ padding: '8px 0' }}>No exercises logged yet.</p>;
  }

  return exercises.map((ex) => {
    const exTier = TIERS[ex.rank];
    const exNextTier = ex.nextRank ? TIERS[ex.nextRank] : null;

    return (
      <div key={ex.exerciseId} className="muscle-detail-row-expanded">
        <div className="muscle-detail-top">
          <span className="muscle-detail-name">{ex.name}</span>
          <span className="subtle">{Math.round(ex.best1RM)}kg e1RM</span>
        </div>

        <div className="rank-progress-wrapper">
          {exTier && <img src={exTier.icon} alt={exTier.label} className="rank-tier-icon-xs" />}

          <div className="rank-progress-container">
            <span className="rank-progress-label-top">{Math.round(ex.progress)}%</span>
            <div className="rank-progress-track">
              <div
                className="rank-progress-fill"
                style={{ width: `${ex.progress}%`, background: TIER_BAR_COLORS[ex.rank] }}
              />
            </div>
          </div>

          {exNextTier ? (
            <img src={exNextTier.icon} alt={exNextTier.label} className="rank-tier-icon-xs" />
          ) : (
            <span className="rank-tier-icon-maxed-sm">👑</span>
          )}
        </div>

        <div className="muscle-detail-footer">
          <span className="subtle">{exTier?.label}</span>
          {exNextTier ? (
            <span className="subtle">
              {exNextTier.label} ({ex.nextThresholdWeight}kg e1RM)
            </span>
          ) : (
            <span className="subtle">Max tier</span>
          )}
        </div>
      </div>
    );
  });
}

// A single clickable muscle row (used both top-level and nested inside a
// group). Clicking toggles its own exercise list open/closed.
function MuscleRow({ m, isExpanded, onToggle }) {
  const currentTier = TIERS[m.currentTierKey];
  if (!currentTier) return null;

  const muscleIconSrc = muscles(m.muscle).icon;
  const muscleName = muscles(m.muscle).label;

  return (
    <div className="muscle-rank-card">
      <button className="muscle-rank-row" onClick={onToggle}>
        <div className="muscle-rank-left">
          <img src={muscleIconSrc} alt={muscleName} className="muscle-icon" />
          <span className="follow-name">{muscleName}</span>
        </div>

        <div className="muscle-rank-right">
          <img src={currentTier.icon} alt={currentTier.label} className="rank-tier-icon-sm" />
          <span className="muscle-rank-badge-label">{currentTier.label}</span>
          <ChevronDown size={16} className={`muscle-chevron ${isExpanded ? 'rotated' : ''}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="muscle-rank-detail">
          <ExerciseList exercises={m.exercises} />
        </div>
      )}
    </div>
  );
}

export default function MuscleRanks() {
  const { user } = useAuth();
  const { muscleRanks, loading } = useMuscleRanks(user?.id);

  // Level 1: which group is expanded (shows its subMuscles list).
  const [expandedGroup, setExpandedGroup] = useState(null);
  // Level 2: which muscle is expanded (shows its exercises). Tracked
  // separately per group so switching groups doesn't leak state, and
  // separately for top-level (ungrouped) muscles.
  const [expandedMuscleInGroup, setExpandedMuscleInGroup] = useState(null);
  const [expandedTopMuscle, setExpandedTopMuscle] = useState(null);

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

  function handleGroupClick(groupKey) {
    const closing = expandedGroup === groupKey;
    setExpandedGroup(closing ? null : groupKey);
    setExpandedMuscleInGroup(null); // reset nested selection on group toggle
  }

  function handleTopMuscleClick(muscleKey) {
    setExpandedTopMuscle(expandedTopMuscle === muscleKey ? null : muscleKey);
  }

  function handleNestedMuscleClick(muscleKey) {
    setExpandedMuscleInGroup(expandedMuscleInGroup === muscleKey ? null : muscleKey);
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ color: 'white', marginBottom: '16px' }}>Muscle Ranks</h1>

      <div className="muscle-rank-list">
        {muscleRanks.map((m) => {
          const currentTier = TIERS[m.currentTierKey];
          if (!currentTier) return null;

          if (m.isGroup) {
            const isGroupExpanded = expandedGroup === m.muscle;

            return (
              <div key={m.muscle} className="muscle-rank-card">
                <button className="muscle-rank-row" onClick={() => handleGroupClick(m.muscle)}>
                  <div className="muscle-rank-left">
                    <img src={m.groupIcon} alt={m.groupLabel} className="muscle-icon" />
                    <span className="follow-name">{m.groupLabel}</span>
                  </div>

                  <div className="muscle-rank-right">
                    <img src={currentTier.icon} alt={currentTier.label} className="rank-tier-icon-sm" />
                    <span className="muscle-rank-badge-label">{currentTier.label}</span>
                    <ChevronDown size={16} className={`muscle-chevron ${isGroupExpanded ? 'rotated' : ''}`} />
                  </div>
                </button>

                {isGroupExpanded && (
                  <div className="muscle-rank-detail muscle-rank-sublist">
                    {(m.subMuscles || []).length === 0 ? (
                      <p className="subtle" style={{ padding: '8px 0' }}>No muscles logged yet.</p>
                    ) : (
                      m.subMuscles.map((sub) => (
                        <MuscleRow
                          key={sub.muscle}
                          m={sub}
                          isExpanded={expandedMuscleInGroup === sub.muscle}
                          onToggle={() => handleNestedMuscleClick(sub.muscle)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          }

          // Ungrouped top-level muscle: click goes straight to exercises,
          // same behavior as before.
          return (
            <MuscleRow
              key={m.muscle}
              m={m}
              isExpanded={expandedTopMuscle === m.muscle}
              onToggle={() => handleTopMuscleClick(m.muscle)}
            />
          );
        })}
      </div>
    </div>
  );
}