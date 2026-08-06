import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, Dumbbell, Search, UserRound, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkoutContext } from '../context/WorkoutContext';
import '../css/explore-routines.css';

const EMPTY_SET = {
  dbId: null,
  reps: '',
  weight: '',
  done: false,
  isPR: false,
  saving: false,
};

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function RoutineCard({ routine, onClick }) {
  const exercises = [...(routine.routine_exercises || [])]
    .filter((item) => item.exercises)
    .sort((a, b) => a.position - b.position);

  const totalSets = exercises.reduce(
    (total, item) => total + (Number(item.default_sets) || 0),
    0
  );

  const author = routine.profiles;
  const authorName = author?.username || author?.name || 'Unknown athlete';
  const authorAvatar = author?.avatar_url || '/default-avatar.png';

  return (
    <button
      type="button"
      className="explore-routine-card"
      onClick={() => onClick(routine)}
    >
      <header className="explore-routine-card__header">
        <div className="explore-routine-card__author">
          <img
            className="explore-routine-card__avatar"
            src={authorAvatar}
            alt={`${authorName}'s avatar`}
            onError={(event) => {
              event.currentTarget.src = '/default-avatar.png';
            }}
          />
          <div>
            <p>Created by</p>
            <strong>{authorName}</strong>
          </div>
        </div>
        <span className="explore-routine-card__date">
          {formatDate(routine.created_at)}
        </span>
      </header>

      <div className="explore-routine-card__body">
        <div className="explore-routine-card__title-row">
          <span className="explore-routine-card__icon" aria-hidden="true">
            <Dumbbell size={20} />
          </span>
          <div>
            <h2>{routine.name}</h2>
            {routine.description && <p>{routine.description}</p>}
          </div>
          <ChevronRight className="explore-routine-card__chevron" size={20} />
        </div>

        <div className="explore-routine-card__stats">
          <span>{exercises.length} exercises</span>
          <span>{totalSets} sets</span>
        </div>

        <div className="explore-routine-card__exercise-list">
          {exercises.slice(0, 5).map((item) => (
            <span key={item.id}>
              {item.exercises.name}
              <small>{item.default_sets} sets</small>
            </span>
          ))}
          {exercises.length > 5 && (
            <span className="explore-routine-card__more">
              +{exercises.length - 5} more
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ExploreRoutines() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    exercises: activeExercises,
    resetWorkout,
    setName,
    setStartedAt,
    setExercises,
  } = useWorkoutContext();

  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedRoutine, setSelectedRoutine] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function loadPublicRoutines() {
      setLoading(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('routines')
        .select(`
          id,
          name,
          description,
          created_at,
          updated_at,
          profiles (
            id,
            username,
            name,
            avatar_url
          ),
          routine_exercises (
            id,
            position,
            default_sets,
            exercises (
              id,
              name,
              images,
              primary_muscles
            )
          )
        `)
        .eq('is_public', true)
        .order('updated_at', { ascending: false });

      if (!isCurrent) return;

      if (queryError) {
        console.error('Failed to load public routines:', queryError);
        setError('Could not load public routines.');
        setRoutines([]);
      } else {
        setRoutines(data || []);
      }

      setLoading(false);
    }

    loadPublicRoutines();
    return () => {
      isCurrent = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredRoutines = routines.filter((routine) => {
    if (!normalizedQuery) return true;

    const author = routine.profiles;
    const authorName = `${author?.username || ''} ${author?.name || ''}`;
    const exerciseNames = (routine.routine_exercises || [])
      .map((item) => item.exercises?.name || '')
      .join(' ');

    return `${routine.name} ${routine.description || ''} ${authorName} ${exerciseNames}`
      .toLowerCase()
      .includes(normalizedQuery);
  });

  async function getPreviousSetsForExercise(exerciseId) {
    const { data: previousWorkout, error: workoutError } = await supabase
      .from('workouts')
      .select('id, workout_sets!inner(exercise_id)')
      .eq('user_id', user.id)
      .eq('workout_sets.exercise_id', exerciseId)
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (workoutError || !previousWorkout) return {};

    const { data: previousSets, error: setsError } = await supabase
      .from('workout_sets')
      .select('set_number, weight, reps')
      .eq('workout_id', previousWorkout.id)
      .eq('exercise_id', exerciseId)
      .order('set_number');

    if (setsError) return {};

    return (previousSets || []).reduce((result, set) => {
      result[set.set_number] = {
        weight: set.weight,
        reps: set.reps,
      };
      return result;
    }, {});
  }

  async function startSelectedRoutine() {
    if (!selectedRoutine || starting) return;

    const items = [...(selectedRoutine.routine_exercises || [])]
      .filter((item) => item.exercises)
      .sort((a, b) => a.position - b.position);

    if (!items.length) {
      setError('This routine has no exercises yet.');
      setSelectedRoutine(null);
      return;
    }

    setStarting(true);
    setError('');

    try {
      const nextExercises = await Promise.all(
        items.map(async (item) => ({
          ...item.exercises,
          previousSets: await getPreviousSetsForExercise(item.exercises.id),
          sets: Array.from(
            { length: Number(item.default_sets) || 1 },
            () => ({ ...EMPTY_SET })
          ),
        }))
      );

      resetWorkout();
      setName(selectedRoutine.name);
      setStartedAt(new Date());
      setExercises(nextExercises);
      setSelectedRoutine(null);
      navigate('/workout');
    } catch (startError) {
      console.error('Failed to start public routine:', startError);
      setError('Could not start this routine. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  return (
    <main className="explore-routines-page">
      <header className="explore-routines-header">
        <button
          className="explore-routines-header__back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={21} />
        </button>
        <div>
          <p>Discover</p>
          <h1>Explore routines</h1>
        </div>
        <span aria-hidden="true" />
      </header>

      <section className="explore-routines-content">
        <div className="explore-routines-intro">
          <span className="explore-routines-intro__icon" aria-hidden="true">
            <UserRound size={20} />
          </span>
          <div>
            <h2>Train like the community</h2>
            <p>Browse routines shared by other athletes.</p>
          </div>
        </div>

        <label className="explore-routines-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search routines or exercises"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="explore-routines-section-header">
          <h2>Public routines</h2>
          <span>{filteredRoutines.length}</span>
        </div>

        {loading && <div className="explore-routines-status">Loading routines…</div>}
        {!loading && error && (
          <div className="explore-routines-status explore-routines-status--error">
            {error}
          </div>
        )}
        {!loading && !error && filteredRoutines.length === 0 && (
          <div className="explore-routines-status">
            {routines.length === 0 ? 'No public routines yet.' : 'No routines match your search.'}
          </div>
        )}
        {!loading && !error && filteredRoutines.length > 0 && (
          <section className="explore-routines-list" aria-label="Public routines">
            {filteredRoutines.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onClick={setSelectedRoutine}
              />
            ))}
          </section>
        )}
      </section>

      {selectedRoutine && (
        <div
          className="explore-routine-confirm-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !starting) {
              setSelectedRoutine(null);
            }
          }}
        >
          <section
            className="explore-routine-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="explore-routine-confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="explore-routine-confirm__close"
              onClick={() => setSelectedRoutine(null)}
              disabled={starting}
              aria-label="Close confirmation"
            >
              <X size={19} />
            </button>

            <span className="explore-routine-confirm__icon" aria-hidden="true">
              <Dumbbell size={23} />
            </span>
            <h2 id="explore-routine-confirm-title">
              Start {selectedRoutine.name}?
            </h2>
            <p>
              This will open a new workout with the exercises from this routine.
              Previous performance will still be shown as your placeholders.
            </p>

            {activeExercises.length > 0 && (
              <p className="explore-routine-confirm__warning">
                Your current workout will be replaced.
              </p>
            )}

            <div className="explore-routine-confirm__actions">
              <button
                className="explore-routine-confirm__cancel"
                onClick={() => setSelectedRoutine(null)}
                disabled={starting}
              >
                Not now
              </button>
              <button
                className="explore-routine-confirm__start"
                onClick={startSelectedRoutine}
                disabled={starting}
              >
                {starting ? 'Starting…' : 'Start workout'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}