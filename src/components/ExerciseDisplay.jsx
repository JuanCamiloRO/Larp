import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import WorkoutPostActions from './WorkoutPostActions';
import WorkoutPostComments from './WorkoutPostComments';
import '../css/home.css';

const IMAGE_BASE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

function ExerciseDisplaySkeleton() {
  return (
    <div
      className="workout-feed-skeleton"
      aria-busy="true"
      aria-label="Loading workouts"
    >
      {[0, 1, 2].map((item) => (
        <div className="workout-card workout-card--skeleton" key={item}>
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--subtitle" />

          {[0, 1, 2].map((exercise) => (
            <div
              className="workout-card--skeleton__exercise"
              key={exercise}
            >
              <div className="skeleton skeleton--image" />

              <div>
                <div className="skeleton skeleton--exercise-name" />
                <div className="skeleton skeleton--set-info" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function resolveImageUrl(image) {
  if (!image) return null;

  return image.startsWith('http')
    ? image
    : `${IMAGE_BASE_URL}${image}`;
}

function groupSetsByExercise(sets = []) {
  const groups = {};

  for (const set of sets) {
    const key = set.exercise_id;

    if (!groups[key]) {
      groups[key] = {
        exerciseId: key,
        name: set.exercises?.name || 'Exercise',
        image: set.exercises?.images?.[0],
        sets: [],
      };
    }

    groups[key].sets.push(set);
  }

  return Object.values(groups);
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown date';

  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(start, end) {
  if (!end) return 'In progress';

  const minutes = Math.round(
    (new Date(end) - new Date(start)) / 60000
  );

  return `${minutes} min`;
}

function formatSet(set) {
  const weight = Number(set.weight) || 0;
  const reps = Number(set.reps) || 0;

  return `${weight}kg × ${reps}`;
}

export default function ExerciseDisplay({
  workouts,
  loading,
  error,
  authorProfile= null,
  showAuthor = true,
  exercisePreviewCount = 3,
}) {
  const [expandedWorkouts, setExpandedWorkouts] = useState({});
  const [commentPost, setCommentPost] = useState(null);

  const hasWorkouts = workouts?.length > 0;
  const isInitialLoading = loading && !hasWorkouts;

  function toggleWorkoutExercises(workoutId) {
    setExpandedWorkouts((current) => ({
      ...current,
      [workoutId]: !current[workoutId],
    }));
  }

  if (isInitialLoading) {
    return <ExerciseDisplaySkeleton />;
  }

  if (error && !hasWorkouts) {
    return (
      <div className="workout-feed-message workout-feed-message--error">
        Could not load workouts. Try again.
      </div>
    );
  }

  if (!loading && !hasWorkouts) {
    return (
      <div className="workout-feed-message">
        No workouts yet.
      </div>
    );
  }

  return (
    <div className="workout-feed">
      {workouts.map((workout) => {
        const author = workout.profiles || authorProfile;
        const username = author?.username || 'Unknown lifter';
        const avatarUrl = author?.avatar_url || '/default-avatar.png';
        const authorId = workout.user_id || author?.id;
        const exerciseGroups = groupSetsByExercise(
          workout.workout_sets || []
        );

        const totalSets = workout.workout_sets?.length || 0;

        const totalVolume = workout.workout_sets?.reduce(
          (sum, set) =>
            sum +
            (Number(set.weight) || 0) * (Number(set.reps) || 0),
          0
        );

        const isExpanded = Boolean(expandedWorkouts[workout.id]);
        const hiddenExerciseCount = Math.max(
          0,
          exerciseGroups.length - exercisePreviewCount
        );

        const visibleExercises = isExpanded
          ? exerciseGroups
          : exerciseGroups.slice(0, exercisePreviewCount);

        return (
          <article className="workout-card" key={workout.id}>
            <header
  className={`workout-card__header ${
    showAuthor ? '' : 'workout-card__header--compact'
  }`}
>
  {showAuthor && (
    <div className="workout-card__author-row">
      {authorId ? (
        <Link
          to={`/profile/${authorId}`}
          className="workout-card__avatar-link"
          aria-label={`View ${username}'s profile`}
        >
          <img
            src={avatarUrl}
            alt=""
            className="workout-card__avatar"
            onError={(event) => {
              event.currentTarget.src = '/default-avatar.png';
            }}
          />
        </Link>
      ) : (
        <img
          src={avatarUrl}
          alt=""
          className="workout-card__avatar"
          onError={(event) => {
            event.currentTarget.src = '/default-avatar.png';
          }}
        />
      )}

      <div className="workout-card__author-info">
        {authorId ? (
          <Link
            to={`/profile/${authorId}`}
            className="workout-card__username"
          >
            @{username}
          </Link>
        ) : (
          <span className="workout-card__username">
            @{username}
          </span>
        )}

        <time
          className="workout-card__date"
          dateTime={workout.started_at}
        >
          {formatDate(workout.started_at)}
        </time>
      </div>
    </div>
  )}

  <h3 className="workout-card__title">
    {workout.name?.toUpperCase() || 'WORKOUT'}

    {!showAuthor && (
      <span className="workout-card__title-date">
        {' · '}
        {formatDate(workout.started_at)}
      </span>
    )}
  </h3>

  <div className="workout-card__metrics">
    <span>{formatDuration(workout.started_at, workout.ended_at)}</span>
    <span>{totalSets} sets</span>
    <span>{totalVolume.toLocaleString()}kg volume</span>
  </div>
</header>

            <div className="workout-card__exercises">
              {visibleExercises.map((group) => (
                <div
                  className="workout-exercise-row"
                  key={group.exerciseId}
                >
                  {group.image ? (
                    <img
                      src={resolveImageUrl(group.image)}
                      alt=""
                      className="workout-exercise-row__image"
                    />
                  ) : (
                    <div
                      className="workout-exercise-row__image workout-exercise-row__image--placeholder"
                      aria-hidden="true"
                    />
                  )}

                  <div className="workout-exercise-row__content">
                    <p className="workout-exercise-row__name">
                      {group.name}
                    </p>

                    <p className="workout-exercise-row__sets">
                      {group.sets.length} sets ·{' '}
                      {group.sets.map(formatSet).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {hiddenExerciseCount > 0 && (
              <button
                type="button"
                className="workout-card__view-more"
                onClick={() => toggleWorkoutExercises(workout.id)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <>
                    Show fewer exercises
                    <ChevronUp size={16} strokeWidth={2.5} />
                  </>
                ) : (
                  <>
                    View {hiddenExerciseCount} more{' '}
                    {hiddenExerciseCount === 1 ? 'exercise' : 'exercises'}
                    <ChevronDown size={16} strokeWidth={2.5} />
                  </>
                )}
              </button>
            )}
            <WorkoutPostActions
  postId={workout.post_id}
  initialLikeCount={workout.like_count}
  initiallyLiked={workout.liked_by_user}
  commentCount={workout.comment_count}
  onComment={() => setCommentPost(workout)}
/>

{commentPost && (
  <WorkoutPostComments
    postId={commentPost.post_id}
    onClose={() => setCommentPost(null)}
    onCountChange={(nextCount) => {
      commentPost.comment_count = nextCount;
    }}
  />
)}
          </article>
        );
      })}
      <div style={{ height: '100px' }}></div>
    </div>
  );
}