import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkoutContext } from '../context/WorkoutContext';
import ExercisePicker from '../components/ExercisePicker';
import ExerciseRankBadge from '../components/ExerciseRankBadge';
import PRToast from '../components/PRToast';
import WorkoutSummary from '../components/WorkoutSummary';
import SessionMuscleMap from '../components/SessionMuscleMap';

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export default function Workout() {
  const { user, loading: authLoading } = useAuth();
  const {
    workoutId, setWorkoutId,
    name, setName,
    startedAt, setStartedAt,
    endedAt, setEndedAt,
    exercises, setExercises,
    resetWorkout,
  } = useWorkoutContext();

  const [showPicker, setShowPicker] = useState(false);
  const [finished, setFinished] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [toast, setToast] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  function resolveImageUrl(img) {
    if (img.startsWith('http')) return img;
    return `${IMAGE_BASE_URL}${img}`;
  }

  async function ensureWorkout() {
    if (workoutId) return workoutId;
    setStartedAt(new Date());
    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: user?.id })
      .select()
      .single();
    if (error) return null;
    setWorkoutId(data.id);
    return data.id;
  }

  function addExercise(ex) {
    setExercises((prev) => [
      ...prev,
      { ...ex, sets: [{ dbId: null, reps: '', weight: '', done: false, isPR: false }] },
    ]);
    setShowPicker(false);
  }

  async function removeExercise(exIndex) {
    const ex = exercises[exIndex];
    const dbIds = ex.sets.filter((s) => s.dbId).map((s) => s.dbId);

    if (dbIds.length > 0) {
      await supabase.from('workout_sets').delete().in('id', dbIds);
    }

    setExercises((prev) => prev.filter((_, i) => i !== exIndex));
  }

  function addSet(exIndex) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: [...ex.sets, { dbId: null, reps: '', weight: '', done: false, isPR: false }] }
          : ex
      )
    );
  }

  async function deleteSet(exIndex, setIndex) {
    const ex = exercises[exIndex];
    const set = ex.sets[setIndex];

    if (set.dbId) {
      await supabase.from('workout_sets').delete().eq('id', set.dbId);
    }

    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIndex
          ? { ...e, sets: e.sets.filter((_, j) => j !== setIndex) }
          : e
      )
    );
  }

  function updateSet(exIndex, setIndex, field, value) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? {
              ...ex,
              sets: ex.sets.map((s, j) =>
                j === setIndex ? { ...s, [field]: value } : s
              ),
            }
          : ex
      )
    );
  }

  async function toggleSetDone(exIndex, setIndex) {
    const ex = exercises[exIndex];
    const set = ex.sets[setIndex];

    if (!set.done) {
      const id = await ensureWorkout();
      if (!id) return;

      const { data, error } = await supabase
        .from('workout_sets')
        .insert({
          workout_id: id,
          exercise_id: ex.id,
          reps: Number(set.reps),
          weight: Number(set.weight),
          set_number: setIndex + 1,
        })
        .select()
        .single();

      if (error) return;

      const { data: prCheck } = await supabase
        .from('personal_records')
        .select('id, weight, reps, estimated_1rm')
        .eq('set_id', data.id)
        .maybeSingle();

      setExercises((prev) =>
        prev.map((e, i) =>
          i === exIndex
            ? {
                ...e,
                sets: e.sets.map((s, j) =>
                  j === setIndex
                    ? { ...s, done: true, dbId: data.id, isPR: !!prCheck }
                    : s
                ),
              }
            : e
        )
      );

      if (prCheck) {
        setToast({ exercise: ex.name, weight: set.weight, reps: set.reps });
      }
    } else {
      if (set.dbId) {
        await supabase.from('workout_sets').delete().eq('id', set.dbId);
      }

      setExercises((prev) =>
        prev.map((e, i) =>
          i === exIndex
            ? {
                ...e,
                sets: e.sets.map((s, j) =>
                  j === setIndex
                    ? { ...s, done: false, dbId: null, isPR: false }
                    : s
                ),
              }
            : e
        )
      );
    }
  }

  async function finishWorkout() {
    if (workoutId) {
      const { data: workout } = await supabase
        .from('workouts')
        .select('*, workout_sets(*, exercises(id, name))')
        .eq('id', workoutId)
        .single();

      const totalSets = workout.workout_sets?.length || 0;
      const totalVolume = workout.workout_sets?.reduce(
        (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0),
        0
      );
      const minutes = Math.round((new Date(endedAt) - new Date(startedAt)) / 60000);

      await supabase
        .from('workouts')
        .update({ name, ended_at: endedAt, sets: totalSets, volume: totalVolume, duration: minutes })
        .eq('id', workoutId);

      const exerciseIds = [...new Set(workout.workout_sets.map((s) => s.exercises.id))];
      const { data: ranks } = await supabase
        .from('exercise_ranks')
        .select('exercise_id, rank, best_1rm, exercises(name)')
        .eq('user_id', user.id)
        .in('exercise_id', exerciseIds);

      setSummary({ totalSets, totalVolume, minutes, ranks: ranks || [] });
    }
    resetWorkout();
  }

  async function deleteWorkout() {
    if (workoutId) {
      await supabase.from('workout_sets').delete().eq('workout_id', workoutId);
      await supabase.from('workouts').delete().eq('id', workoutId);
    }
    resetWorkout();
    setConfirmingDelete(false);
  }

  if (authLoading || !user) {
    return <div style={{ color: 'white', padding: '16px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '16px', background: '#000', minHeight: '100vh' }}>
      <h1 style={{ color: 'white' }}>Workout</h1>

      <PRToast toast={toast} />

      <SessionMuscleMap exercises={exercises} />

      {exercises.map((ex, exIndex) => (
        <div className="workout-card" key={ex.id}>
          <div className="exercise-header" style={{ justifyContent: 'space-between', display: 'flex' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {ex.images?.[0] && (
                <img
                  className="exercise-thumb"
                  src={resolveImageUrl(ex.images[0])}
                  alt={ex.name}
                />
              )}
              <span className="exercise-name">{ex.name}</span>
              <ExerciseRankBadge exerciseId={ex.id} userId={user?.id} />
            </div>
            <button
              onClick={() => removeExercise(exIndex)}
              style={{ background: 'none', border: 'none', color: '#ff453a', fontSize: '18px', cursor: 'pointer' }}
              aria-label="Remove exercise"
            >
              🗑
            </button>
          </div>

          {ex.sets.map((set, setIndex) => (
            <div
              className={`set-row ${set.done ? 'completed' : ''}`}
              key={set.dbId ?? `local-${setIndex}`}
              style={{ gridTemplateColumns: '32px 1fr 1fr 1fr 24px 36px 28px' }}
            >
              <span className="set-number">{setIndex + 1}</span>
              <input
                className="set-input"
                type="number"
                placeholder="kg"
                value={set.weight}
                onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
              />
              <input
                className="set-input"
                type="number"
                placeholder="reps"
                value={set.reps}
                onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
              />
              <span className="set-pr-icon">{set.isPR ? '🥇' : ''}</span>
              <button
                className={`check-btn ${set.done ? 'active' : ''}`}
                onClick={() => toggleSetDone(exIndex, setIndex)}
              >
                ✓
              </button>
              <button
                onClick={() => deleteSet(exIndex, setIndex)}
                style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer' }}
                aria-label="Delete set"
              >
                ✕
              </button>
            </div>
          ))}

          <button className="add-set-btn" onClick={() => addSet(exIndex)}>
            + Add Set
          </button>
        </div>
      ))}

      {showPicker ? (
        <ExercisePicker onSelect={addExercise} />
      ) : (
        <button className="add-set-btn" onClick={() => setShowPicker(true)}>
          + Add Exercise
        </button>
      )}

      {exercises.length > 0 && (
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="finish-btn" onClick={() => { setFinished(true); setEndedAt(new Date()); }}>
            Finish Workout
          </button>
          <button className="danger-btn" onClick={() => setConfirmingDelete(true)}>
            Delete
          </button>
        </div>
      )}

      {finished && (
        <div className="finish-confirmation">
          <p>Are you sure you want to finish the workout?</p>
          <input
            className="input-field"
            type="text"
            placeholder="Enter workout name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button onClick={() => { finishWorkout(); setFinished(false); }}>Finish workout</button>
          <button onClick={() => setFinished(false)}>No</button>
        </div>
      )}

      {confirmingDelete && (
        <div className="finish-confirmation">
          <p>Delete this entire workout? This can't be undone.</p>
          <button onClick={deleteWorkout}>Yes, delete</button>
          <button onClick={() => setConfirmingDelete(false)}>Cancel</button>
        </div>
      )}

      <WorkoutSummary summary={summary} onClose={() => setSummary(null)} />

      <Link to="/settings" style={{ color: '#0a84ff', display: 'block', marginTop: '20px' }}>
        Go to Settings
      </Link>
    </div>
  );
}