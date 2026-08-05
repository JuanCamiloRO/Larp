import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useMuscleRanks } from '../hooks/useMuscleRanks';
import { TIERS } from '../lib/rankTiers';
import { muscles } from '../lib/muscles';
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
      <header className="muscle-ranks-page-header">
        <div className="muscle-ranks-skeleton muscle-ranks-skeleton--title" />
        <div className="muscle-ranks-skeleton muscle-ranks-skeleton--subtitle" />
      </header>

      <div className="muscle-rank-list">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            className="muscle-rank-card muscle-rank-card--skeleton"
            key={index}
          >
            <div className="muscle-rank-row">
              <div className="muscle-rank-left">
                <div className="muscle-ranks-skeleton muscle-ranks-skeleton--muscle-icon" />
                <div className="muscle-ranks-skeleton muscle-ranks-skeleton--muscle-name" />
              </div>

              <div className="muscle-rank-right">
                <div className="muscle-ranks-skeleton muscle-ranks-skeleton--tier-icon" />
                <div className="muscle-ranks-skeleton muscle-ranks-skeleton--tier-label" />
                <div className="muscle-ranks-skeleton muscle-ranks-skeleton--chevron" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function ExerciseList({ exercises = [] }) {
  if (exercises.length === 0) {
    return (
      <p className="subtle muscle-rank-empty-message">
        No exercises logged yet.
      </p>
    );
  }

  return exercises.map((exercise) => {
    const exerciseTier = TIERS[exercise.rank];
    const nextExerciseTier = exercise.nextRank
      ? TIERS[exercise.nextRank]
      : null;

    const progress = Math.min(
      100,
      Math.max(0, Math.round(exercise.progress))
    );

    return (
      <div key={exercise.exerciseId} className="muscle-detail-row-expanded">
        <div className="muscle-detail-top">
          <span className="muscle-detail-name">{exercise.name}</span>
          <span className="subtle">
            {Math.round(exercise.best1RM)}kg e1RM
          </span>
        </div>

        <div className="rank-progress-wrapper">
          {exerciseTier && (
            <img
              src={exerciseTier.icon}
              alt={exerciseTier.label}
              className="rank-tier-icon-xs"
            />
          )}

          <div className="rank-progress-container">
            <span className="rank-progress-label-top">{progress}%</span>

            <div className="rank-progress-track">
              <div
                className="rank-progress-fill"
                style={{
                  width: `${progress}%`,
                  background: TIER_BAR_COLORS[exercise.rank],
                }}
              />
            </div>
          </div>

          {nextExerciseTier ? (
            <img
              src={nextExerciseTier.icon}
              alt={nextExerciseTier.label}
              className="rank-tier-icon-xs"
            />
          ) : (
            <span className="rank-tier-icon-maxed-sm" aria-label="Maximum tier">
              👑
            </span>
          )}
        </div>

        <div className="muscle-detail-footer">
          <span className="subtle">{exerciseTier?.label}</span>

          {nextExerciseTier ? (
            <span className="subtle">
              {nextExerciseTier.label} ({exercise.nextThresholdWeight}kg e1RM)
            </span>
          ) : (
            <span className="subtle">Max tier</span>
          )}
        </div>
      </div>
    );
  });
}

function MuscleRow({ muscleRank, isExpanded, onToggle }) {
  const currentTier = TIERS[muscleRank.currentTierKey];

  if (!currentTier) return null;

  const muscle = muscles(muscleRank.muscle);
  const muscleIconSrc = muscle.icon;
  const muscleName = muscle.label;

  return (
    <div className="muscle-rank-card">
      <button
        type="button"
        className="muscle-rank-row"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-label={`${muscleName}, ${currentTier.label}. ${
          isExpanded ? 'Hide exercises' : 'Show exercises'
        }`}
      >
        <div className="muscle-rank-left">
          <img
            src={muscleIconSrc}
            alt=""
            className="muscle-icon"
          />

          <span className="follow-name">{muscleName}</span>
        </div>

        <div className="muscle-rank-right">
          <img
            src={currentTier.icon}
            alt=""
            className="rank-tier-icon-sm"
          />

          <span className="muscle-rank-badge-label">
            {currentTier.label}
          </span>

          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`muscle-chevron ${isExpanded ? 'rotated' : ''}`}
          />
        </div>
      </button>

      <div
        className={`muscle-rank-detail ${
          isExpanded ? 'is-expanded' : ''
        }`}
      >
        <div className="muscle-rank-detail-inner">
          <ExerciseList exercises={muscleRank.exercises} />
        </div>
      </div>
    </div>
  );
}

export default function MuscleRanks() {
  const { user } = useAuth();
  const { muscleRanks, loading } = useMuscleRanks(user?.id);

  const ranks = muscleRanks ?? [];

  const [expandedGroup, setExpandedGroup] = useState(null);
  const [expandedMuscleInGroup, setExpandedMuscleInGroup] = useState(null);
  const [expandedTopMuscle, setExpandedTopMuscle] = useState(null);

  function handleGroupClick(groupKey) {
    const isClosing = expandedGroup === groupKey;

    setExpandedGroup(isClosing ? null : groupKey);
    setExpandedMuscleInGroup(null);
  }

  function handleTopMuscleClick(muscleKey) {
    setExpandedTopMuscle((current) =>
      current === muscleKey ? null : muscleKey
    );
  }

  function handleNestedMuscleClick(muscleKey) {
    setExpandedMuscleInGroup((current) =>
      current === muscleKey ? null : muscleKey
    );
  }

  if (loading) {
    return <MuscleRanksSkeleton />;
  }

  if (ranks.length === 0) {
    return (
      <main className="muscle-ranks-page page-transition">
        <header className="muscle-ranks-page-header">
          <h1 className="muscle-ranks-page-title">Muscle Ranks</h1>
        </header>

        <div className="muscle-ranks-empty">
          <div className="muscle-ranks-empty-icon" aria-hidden="true">
            🏋️
          </div>

          <h2>No muscle ranks yet</h2>

          <p>
            Log lifts across a few exercises to start building muscle ranks.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="muscle-ranks-page">
      <header className="muscle-ranks-page-header">
        <h1 className="muscle-ranks-page-title">Muscle Ranks</h1>

        <p className="muscle-ranks-page-subtitle">
          Your strength progress across every muscle group.
        </p>
      </header>

      <div className="muscle-rank-list">
        {ranks.map((muscleRank) => {
          const currentTier = TIERS[muscleRank.currentTierKey];

          if (!currentTier) return null;

          if (muscleRank.isGroup) {
            const isGroupExpanded = expandedGroup === muscleRank.muscle;
            const subMuscles = muscleRank.subMuscles || [];

            return (
              <div key={muscleRank.muscle} className="muscle-rank-card">
                <button
                  type="button"
                  className="muscle-rank-row"
                  onClick={() => handleGroupClick(muscleRank.muscle)}
                  aria-expanded={isGroupExpanded}
                  aria-label={`${muscleRank.groupLabel}, ${
                    currentTier.label
                  }. ${
                    isGroupExpanded ? 'Hide muscle groups' : 'Show muscle groups'
                  }`}
                >
                  <div className="muscle-rank-left">
                    <img
                      src={muscleRank.groupIcon}
                      alt=""
                      className="muscle-icon"
                    />

                    <span className="follow-name">
                      {muscleRank.groupLabel}
                    </span>
                  </div>

                  <div className="muscle-rank-right">
                    <img
                      src={currentTier.icon}
                      alt=""
                      className="rank-tier-icon-sm"
                    />

                    <span className="muscle-rank-badge-label">
                      {currentTier.label}
                    </span>

                    <ChevronDown
                      size={16}
                      aria-hidden="true"
                      className={`muscle-chevron ${
                        isGroupExpanded ? 'rotated' : ''
                      }`}
                    />
                  </div>
                </button>

                <div
                  className={`muscle-rank-detail muscle-rank-sublist ${
                    isGroupExpanded ? 'is-expanded' : ''
                  }`}
                >
                  <div className="muscle-rank-detail-inner">
                    {subMuscles.length === 0 ? (
                      <p className="subtle muscle-rank-empty-message">
                        No muscles logged yet.
                      </p>
                    ) : (
                      subMuscles.map((subMuscle) => (
                        <MuscleRow
                          key={subMuscle.muscle}
                          muscleRank={subMuscle}
                          isExpanded={
                            expandedMuscleInGroup === subMuscle.muscle
                          }
                          onToggle={() =>
                            handleNestedMuscleClick(subMuscle.muscle)
                          }
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <MuscleRow
              key={muscleRank.muscle}
              muscleRank={muscleRank}
              isExpanded={expandedTopMuscle === muscleRank.muscle}
              onToggle={() => handleTopMuscleClick(muscleRank.muscle)}
            />
          );
        })}
      </div>
    </main>
  );
}