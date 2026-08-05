import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkoutContext } from '../context/WorkoutContext';
import ExercisePicker from '../components/ExercisePicker';
import ExerciseRankBadge from '../components/ExerciseRankBadge';
import PRToast from '../components/PRToast';
import WorkoutSummary from '../components/WorkoutSummary';
import SessionMuscleMap from '../components/SessionMuscleMap';
import '../css/workout.css';

const IMAGE_BASE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const EMPTY_SET = {
  dbId: null,
  reps: '',
  weight: '',
  done: false,
  isPR: false,
  saving: false,
};

export default function Workout() {
  const { user, loading: authLoading } = useAuth();

  const {
    workoutId,
    setWorkoutId,
    name,
    setName,
    startedAt,
    setStartedAt,
    endedAt,
    setEndedAt,
    exercises,
    setExercises,
    resetWorkout,
  } = useWorkoutContext();

  const [showPicker, setShowPicker] = useState(false);
  const [finished, setFinished] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [toast, setToast] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;

    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  function resolveImageUrl(img) {
    if (img.startsWith('http')) return img;
    return `${IMAGE_BASE_URL}${img}`;
  }

  async function ensureWorkout() {
    if (workoutId) return workoutId;

    const now = new Date();
    setStartedAt(now);

    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) {
      console.error('Failed to create workout:', error);
      return null;
    }

    setWorkoutId(data.id);
    return data.id;
  }

  async function getPreviousSetsForExercise(exerciseId) {
    const { data: previousWorkout, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        id,
        ended_at,
        workout_sets!inner(exercise_id)
      `)
      .eq('user_id', user.id)
      .eq('workout_sets.exercise_id', exerciseId)
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (workoutError) {
      console.error('Failed to fetch previous workout:', workoutError);
      return {};
    }

    if (!previousWorkout) return {};

    const { data: previousSets, error: setsError } = await supabase
      .from('workout_sets')
      .select('set_number, weight, reps')
      .eq('workout_id', previousWorkout.id)
      .eq('exercise_id', exerciseId)
      .order('set_number', { ascending: true });

    if (setsError) {
      console.error('Failed to fetch previous sets:', setsError);
      return {};
    }

    return (previousSets || []).reduce((setsByNumber, set) => {
      setsByNumber[set.set_number] = {
        weight: set.weight,
        reps: set.reps,
      };
      return setsByNumber;
    }, {});
  }

  async function addExercise(exercise) {
    const previousSets = await getPreviousSetsForExercise(exercise.id);

    setExercises((currentExercises) => [
      ...currentExercises,
      {
        ...exercise,
        previousSets,
        sets: [{ ...EMPTY_SET }],
      },
    ]);

    setShowPicker(false);
  }

  async function removeExercise(exerciseIndex) {
    const exercise = exercises[exerciseIndex];
    const dbIds = exercise.sets.filter((set) => set.dbId).map((set) => set.dbId);

    if (dbIds.length > 0) {
      const { error } = await supabase
        .from('workout_sets')
        .delete()
        .in('id', dbIds);

      if (error) {
        console.error('Failed to remove exercise sets:', error);
        return;
      }
    }

    setExercises((currentExercises) =>
      currentExercises.filter((_, index) => index !== exerciseIndex)
    );
  }

  function addSet(exerciseIndex) {
    setExercises((currentExercises) =>
      currentExercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: [...exercise.sets, { ...EMPTY_SET }],
            }
          : exercise
      )
    );
  }

  async function deleteSet(exerciseIndex, setIndex) {
    const set = exercises[exerciseIndex].sets[setIndex];

    if (set.dbId) {
      const { error } = await supabase
        .from('workout_sets')
        .delete()
        .eq('id', set.dbId);

      if (error) {
        console.error('Failed to delete set:', error);
        return;
      }
    }

    setExercises((currentExercises) =>
      currentExercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex),
            }
          : exercise
      )
    );
  }

  function updateSet(exerciseIndex, setIndex, field, value) {
    setExercises((currentExercises) =>
      currentExercises.map((exercise, index) =>
        index === exerciseIndex
          ? {
              ...exercise,
              sets: exercise.sets.map((set, currentSetIndex) =>
                currentSetIndex === setIndex ? { ...set, [field]: value } : set
              ),
            }
          : exercise
      )
    );
  }

 async function toggleSetDone(exerciseIndex, setIndex) {
  const exercise = exercises[exerciseIndex];
  const set = exercise.sets[setIndex];

  // Prevent double taps while this set is being saved.
  if (set.saving) return;

  if (!set.done) {
    if (set.weight === '' || set.reps === '') {
      return;
    }

    // 1. Update the UI immediately.
    setExercises((currentExercises) =>
      currentExercises.map((currentExercise, index) =>
        index === exerciseIndex
          ? {
              ...currentExercise,
              sets: currentExercise.sets.map((currentSet, currentSetIndex) =>
                currentSetIndex === setIndex
                  ? {
                      ...currentSet,
                      done: true,
                      saving: true,
                      isPR: false,
                    }
                  : currentSet
              ),
            }
          : currentExercise
      )
    );

    try {
      // 2. Save in the background.
      const currentWorkoutId = await ensureWorkout();

      if (!currentWorkoutId) {
        throw new Error('Could not create workout');
      }

      const { data, error } = await supabase
        .from('workout_sets')
        .insert({
          workout_id: currentWorkoutId,
          exercise_id: exercise.id,
          reps: Number(set.reps),
          weight: Number(set.weight),
          set_number: setIndex + 1,
        })
        .select()
        .single();

      if (error) throw error;

      // The set is safely saved. Remove the saving state immediately.
      setExercises((currentExercises) =>
        currentExercises.map((currentExercise, index) =>
          index === exerciseIndex
            ? {
                ...currentExercise,
                sets: currentExercise.sets.map((currentSet, currentSetIndex) =>
                  currentSetIndex === setIndex
                    ? {
                        ...currentSet,
                        dbId: data.id,
                        saving: false,
                      }
                    : currentSet
                ),
              }
            : currentExercise
        )
      );

      // 3. Check PR after the save, without delaying the completed UI.
      const { data: prCheck, error: prError } = await supabase
        .from('personal_records')
        .select('id')
        .eq('set_id', data.id)
        .maybeSingle();

      if (prError) {
        console.error('Failed to check PR:', prError);
        return;
      }

      if (prCheck) {
        setExercises((currentExercises) =>
          currentExercises.map((currentExercise, index) =>
            index === exerciseIndex
              ? {
                  ...currentExercise,
                  sets: currentExercise.sets.map((currentSet, currentSetIndex) =>
                    currentSetIndex === setIndex
                      ? { ...currentSet, isPR: true }
                      : currentSet
                  ),
                }
              : currentExercise
          )
        );

        setToast({
          exercise: exercise.name,
          weight: set.weight,
          reps: set.reps,
        });
      }
    } catch (error) {
      console.error('Failed to save set:', error);

      // 4. Revert the visual completion if Supabase fails.
      setExercises((currentExercises) =>
        currentExercises.map((currentExercise, index) =>
          index === exerciseIndex
            ? {
                ...currentExercise,
                sets: currentExercise.sets.map((currentSet, currentSetIndex) =>
                  currentSetIndex === setIndex
                    ? {
                        ...currentSet,
                        done: false,
                        saving: false,
                        dbId: null,
                        isPR: false,
                      }
                    : currentSet
                ),
              }
            : currentExercise
        )
      );

      // Later: show a visible "Couldn't save set. Try again." toast here.
    }

    return;
  }

  // Existing completed set: remove it.
  if (set.dbId) {
    const { error } = await supabase
      .from('workout_sets')
      .delete()
      .eq('id', set.dbId);

    if (error) {
      console.error('Failed to uncomplete set:', error);
      return;
    }
  }

  setExercises((currentExercises) =>
    currentExercises.map((currentExercise, index) =>
      index === exerciseIndex
        ? {
            ...currentExercise,
            sets: currentExercise.sets.map((currentSet, currentSetIndex) =>
              currentSetIndex === setIndex
                ? {
                    ...currentSet,
                    done: false,
                    dbId: null,
                    isPR: false,
                    saving: false,
                  }
                : currentSet
            ),
          }
        : currentExercise
    )
  );
}

  async function finishWorkout() {
    if (!workoutId) {
      resetWorkout();
      return;
    }

    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select('*, workout_sets(*, exercises(id, name))')
      .eq('id', workoutId)
      .single();

    if (workoutError) {
      console.error('Failed to load workout summary:', workoutError);
      return;
    }

    const totalSets = workout.workout_sets?.length || 0;
    const totalVolume = workout.workout_sets?.reduce(
      (sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0),
      0
    );

    const completedAt = endedAt || new Date();
    const minutes = startedAt
      ? Math.max(0, Math.round((new Date(completedAt) - new Date(startedAt)) / 60000))
      : 0;

    const { error: updateError } = await supabase
      .from('workouts')
      .update({
        name,
        ended_at: completedAt,
        sets: totalSets,
        volume: totalVolume,
        duration: minutes,
      })
      .eq('id', workoutId);

    if (updateError) {
      console.error('Failed to finish workout:', updateError);
      return;
    }

    const exerciseIds = [
      ...new Set(
        (workout.workout_sets || [])
          .map((set) => set.exercises?.id)
          .filter(Boolean)
      ),
    ];

    let ranks = [];

    if (exerciseIds.length > 0) {
      const { data, error } = await supabase
        .from('exercise_ranks')
        .select('exercise_id, rank, best_1rm, exercises(name)')
        .eq('user_id', user.id)
        .in('exercise_id', exerciseIds);

      if (error) {
        console.error('Failed to load ranks:', error);
      } else {
        ranks = data || [];
      }
    }

    setSummary({ totalSets, totalVolume, minutes, ranks });
    resetWorkout();
  }

  async function deleteWorkout() {
    if (workoutId) {
      const { error: setsError } = await supabase
        .from('workout_sets')
        .delete()
        .eq('workout_id', workoutId);

      if (setsError) {
        console.error('Failed to delete workout sets:', setsError);
        return;
      }

      const { error: workoutError } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);

      if (workoutError) {
        console.error('Failed to delete workout:', workoutError);
        return;
      }
    }

    resetWorkout();
    setConfirmingDelete(false);
  }

  function openFinishConfirmation() {
    setEndedAt(new Date());
    setFinished(true);
  }

  if (authLoading || !user) {
    return <div className="workout-loading">Loading...</div>;
  }

  return (
    <main className="workout-page">
      <div className="workout-page__content">
        <h1 className="workout-page__title">Workout</h1>

        <PRToast toast={toast} />

        <SessionMuscleMap exercises={exercises} />

        <section className="workout-exercises" aria-label="Workout exercises">
          {exercises.map((exercise, exerciseIndex) => (
            <article className="workout-card" key={exercise.id}>
              <header className="workout-card__header">
                <div className="workout-card__exercise-info">
                  {exercise.images?.[0] && (
                    <img
                      className="workout-card__thumbnail"
                      src={resolveImageUrl(exercise.images[0])}
                      alt={exercise.name}
                    />
                  )}

                  <span className="workout-card__exercise-name">{exercise.name}</span>

                  <ExerciseRankBadge exerciseId={exercise.id} userId={user.id} />
                </div>

                <button
                  className="icon-button icon-button--delete"
                  onClick={() => removeExercise(exerciseIndex)}
                  aria-label={`Remove ${exercise.name}`}
                >
                  🗑
                </button>
              </header>

              <div className="set-table">
                <div className="set-table__header">
                  <span>Set</span>
                  <span>Previous</span>
                  <span>Weight</span>
                  <span>Reps</span>
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                </div>

                {exercise.sets.map((set, setIndex) => {
                  const previous = exercise.previousSets?.[setIndex + 1];

                  return (
                    <div
                      className={`set-row ${set.done ? 'set-row--completed' : ''}`}
                      key={set.dbId ?? `local-${setIndex}`}
                    >
                      <span className="set-row__number">{setIndex + 1}</span>

                      <span
                        className={`set-row__previous ${previous ? '' : 'set-row__previous--empty'}`}
                        title={
                          previous
                            ? `Previous: ${previous.weight} kg × ${previous.reps} reps`
                            : 'No previous value'
                        }
                      >
                        {previous ? `${previous.weight} × ${previous.reps}` : '—'}
                      </span>

                      <input
                        className="set-row__input"
                        type="number"
                        min="0"
                        step="0.5"
                        inputMode="decimal"
                        placeholder={previous ? previous.weight : 'weight'}
                        value={set.weight}
                        disabled={set.done}
                        onChange={(event) =>
                          updateSet(exerciseIndex, setIndex, 'weight', event.target.value)
                        }
                        aria-label={`Weight for set ${setIndex + 1}`}
                      />

                      <input
                        className="set-row__input"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        placeholder={previous ? previous.reps : 'reps'}
                        value={set.reps}
                        disabled={set.done}
                        onChange={(event) =>
                          updateSet(exerciseIndex, setIndex, 'reps', event.target.value)
                        }
                        aria-label={`Reps for set ${setIndex + 1}`}
                      />

                      <span className="set-row__pr-icon">{set.isPR ? '🥇' : ''}</span>

                      <button
  className={`set-row__check-button ${
    set.done ? 'set-row__check-button--active' : ''
  }`}
  onClick={() => toggleSetDone(exerciseIndex, setIndex)}
  disabled={set.saving}
  aria-label={
    set.saving
      ? `Saving set ${setIndex + 1}`
      : set.done
        ? `Mark set ${setIndex + 1} as incomplete`
        : `Complete set ${setIndex + 1}`
  }
>
  {set.saving ? '…' : '✓'}
</button>

                      <button
                        className="set-row__delete-button"
                        onClick={() => deleteSet(exerciseIndex, setIndex)}
                        aria-label={`Delete set ${setIndex + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <button className="add-set-button" onClick={() => addSet(exerciseIndex)}>
                + Add Set
              </button>
            </article>
          ))}
        </section>

        <button className="add-exercise-button" onClick={() => setShowPicker(true)}>
          + Add Exercise
        </button>

        {exercises.length > 0 && (
          <div className="workout-actions">
            <button className="finish-workout-button" onClick={openFinishConfirmation}>
              Finish Workout
            </button>

            <button className="delete-workout-button" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          </div>
        )}

        <div className="workout-bottom-spacer" aria-hidden="true" />

        {showPicker && (
          <ExercisePicker
            onSelect={addExercise}
            onClose={() => setShowPicker(false)}
          />
        )}

        {finished && (
          <div className="confirmation-overlay" role="presentation">
            <div className="confirmation-dialog" role="dialog" aria-modal="true">
              <p className="confirmation-dialog__text">Are you sure you want to finish the workout?</p>

              <input
                className="confirmation-dialog__input"
                type="text"
                placeholder="Enter workout name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <div className="confirmation-dialog__actions">
                <button
                  className="confirmation-dialog__button confirmation-dialog__button--primary"
                  onClick={() => {
                    finishWorkout();
                    setFinished(false);
                  }}
                >
                  Finish workout
                </button>

                <button
                  className="confirmation-dialog__button"
                  onClick={() => setFinished(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmingDelete && (
          <div className="confirmation-overlay" role="presentation">
            <div className="confirmation-dialog" role="dialog" aria-modal="true">
              <p className="confirmation-dialog__text">Delete this entire workout? This cannot be undone.</p>

              <div className="confirmation-dialog__actions">
                <button
                  className="confirmation-dialog__button confirmation-dialog__button--danger"
                  onClick={deleteWorkout}
                >
                  Yes, delete
                </button>

                <button
                  className="confirmation-dialog__button"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <WorkoutSummary summary={summary} onClose={() => setSummary(null)} />

      </div>
    </main>
  );
}