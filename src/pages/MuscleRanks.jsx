import { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMuscleRanks } from '../hooks/useMuscleRanks';
import { TIERS } from '../lib/rankTiers';
import { muscles } from '../lib/muscles';
import { useProfile } from '../hooks/useProfile';
import { publicAsset } from '../lib/publicAsset';
import '../css/muscleRanks.css';

const TIER_BAR_COLORS = {
  Bronze: '#9b5e02',
  Silver: '#707881',
  Gold: '#ad8004',
  Platinum: '#0aceff',
  Diamond: '#0753c6',
  Larper: '#650606',
  'Fake Natty': '#7409a1',
};


function MuscleRanksSkeleton() {
  return (
    <main
      className="muscle-ranks-page"
      aria-busy="true"
      aria-label="Loading muscle ranks"
    >


      <section className="muscle-ranks-content">
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
      </section>
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
      Math.max(0, Math.round(Number(exercise.progress) || 0))
    );

    return (
      <div key={exercise.exerciseId} className="muscle-detail-row-expanded">
        <div className="muscle-detail-top">
          <span className="muscle-detail-name">{exercise.name}</span>
          <span className="subtle">
            {Math.round(Number(exercise.best1RM) || 0)}kg e1RM
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
                  background: TIER_BAR_COLORS[exercise.rank] || '#ff3b30',
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
              <img style={{width: '20px', height: '20px'}} src="https://i0.wp.com/static.wikia.nocookie.net/fortnite/images/7/77/Champion_League_-_Icon_-_Fortnite.png/revision/latest?cb=20210307175926" alt="max tier"></img>
            </span>
          )}
        </div>

        <div className="muscle-detail-footer">
          <span className="subtle">{exerciseTier?.label || exercise.rank}</span>

          {nextExerciseTier ? (
            <span className="subtle">
              {nextExerciseTier.label}
              {exercise.nextThresholdWeight !== null &&
              exercise.nextThresholdWeight !== undefined
                ? ` · Target ${Math.round(exercise.nextThresholdWeight)}kg e1RM`
                : ' · Keep training'}
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
  const currentTier =
    TIERS[muscleRank.currentTierKey] || {
      label: 'Unranked',
      icon: publicAsset('resources/unranked.png'),
    };

  const muscle = muscles(muscleRank.muscle);
  const muscleIconSrc = muscle?.icon || publicAsset('resources/default.png');
  const muscleName = muscle?.label || muscleRank.muscle;

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
        className={`muscle-rank-detail ${isExpanded ? 'is-expanded' : ''}`}
      >
        <div className="muscle-rank-detail-inner">
          <ExerciseList exercises={muscleRank.exercises} />
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();

  return (
    <main className="muscle-ranks-page page-transition">

      <section className="muscle-ranks-content">
        <div className="muscle-ranks-empty">
          <div className="muscle-ranks-empty-icon" aria-hidden="true">
            🏋️
          </div>

          <h2>No muscle ranks yet</h2>

          <p>
            Log lifts across a few exercises to start building muscle ranks.
          </p>

          <button
            type="button"
            className="muscle-ranks-empty-action"
            onClick={() => navigate('/workout')}
          >
            Start a workout
          </button>
        </div>
      </section>
    </main>
  );
}

export default function MuscleRanks() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { muscleRanks, loading } = useMuscleRanks(
    user?.id,
    profile?.weight
  );
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
    return <EmptyState />;
  }

  return (
    <main className="muscle-ranks-page">

      <section className="muscle-ranks-content">
        <div className="muscle-ranks-hero">
          <span className="muscle-ranks-eyebrow">Ranks (Beta)</span>

          <h2>Your strength, muscle by muscle.</h2>

          <p>
            See how each muscle contributes to your progress and which lifts
            are pulling you toward the next tier.
          </p>
        </div>

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
                    aria-label={`${muscleRank.groupLabel}, ${currentTier.label}. ${
                      isGroupExpanded
                        ? 'Hide muscle groups'
                        : 'Show muscle groups'
                    }`}
                  >
                    <div className="muscle-rank-left">
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
      </section>
    </main>
  );
}