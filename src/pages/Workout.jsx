import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import ExercisePicker from '../components/ExercisePicker';

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export default function Workout() {
  const { user } = useAuth();
  const [workoutId, setWorkoutId] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [showPicker, setShowPicker] = useState(false);

  function resolveImageUrl(img) {
  if (img.startsWith('http')) return img;
  return `${IMAGE_BASE_URL}${img}`;
}
  async function ensureWorkout() {
    if (workoutId) return workoutId;
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
      { ...ex, sets: [{ reps: '', weight: '', done: false }] },
    ]);
    setShowPicker(false);
  }

  function addSet(exIndex) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: [...ex.sets, { reps: '', weight: '', done: false }] }
          : ex
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

      await supabase.from('workout_sets').insert({
        workout_id: id,
        exercise_id: ex.id,
        reps: Number(set.reps),
        weight: Number(set.weight),
        set_number: setIndex + 1,
      });
    }

    setExercises((prev) =>
      prev.map((e, i) =>
        i === exIndex
          ? {
              ...e,
              sets: e.sets.map((s, j) =>
                j === setIndex ? { ...s, done: !s.done } : s
              ),
            }
          : e
      )
    );
  }

  async function finishWorkout() {
    if (workoutId) {
      await supabase.from('workouts').update({ ended_at: new Date() }).eq('id', workoutId);
    }
    setWorkoutId(null);
    setExercises([]);
  }

  return (
    <div style={{ padding: '16px', background: '#000', minHeight: '100vh' }}>
      <h1 style={{ color: 'white' }}>Workout</h1>

      {exercises.map((ex, exIndex) => (
        <div className="workout-card" key={ex.id}>
          <div className="exercise-header">
            {ex.images?.[0] && (
              <img
                className="exercise-thumb"
                src={resolveImageUrl(ex.images[0])}
                alt={ex.name}
              />
            )}
            <span className="exercise-name">{ex.name}</span>
          </div>

          {ex.sets.map((set, setIndex) => (
            <div className={`set-row ${set.done ? 'completed' : ''}`} key={setIndex}>
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
              <span />
              <button
                className={`check-btn ${set.done ? 'active' : ''}`}
                onClick={() => toggleSetDone(exIndex, setIndex)}
              >
                ✓
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
        <button className="finish-btn" onClick={finishWorkout}>
          Finish Workout
        </button>
      )}

      <Link to="/settings" style={{ color: '#0a84ff', display: 'block', marginTop: '20px' }}>
        Go to Settings
      </Link>
    </div>
  );
}