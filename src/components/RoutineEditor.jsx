import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import ExercisePicker from '../components/ExercisePicker';
import '../css/routine-editor.css';

export default function RoutineEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [name, setName] = useState('');
  const [routineExercises, setRoutineExercises] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hasDraft = Boolean(name.trim()) || routineExercises.length > 0;

  function goBack() {
    if (saving) return;
    if (hasDraft && !window.confirm('Discard this routine draft?')) return;
    navigate(-1);
  }

  function addExercise(exercise) {
    if (routineExercises.some((item) => item.exercise.id === exercise.id)) {
      setError(`${exercise.name} is already in this routine.`);
      setShowPicker(false);
      return;
    }

    setRoutineExercises((current) => [
      ...current,
      { exercise, defaultSets: 3 },
    ]);
    setError('');
    setShowPicker(false);
  }

  function updateSets(index, value) {
    const defaultSets = Math.min(20, Math.max(1, Number(value) || 1));

    setRoutineExercises((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, defaultSets } : item
      )
    );
  }

  function removeExercise(index) {
    setRoutineExercises((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  function moveExercise(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= routineExercises.length) return;

    setRoutineExercises((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  async function saveRoutine() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Give your routine a name.');
      return;
    }

    if (!routineExercises.length) {
      setError('Add at least one exercise.');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to save a routine.');
      return;
    }

    setSaving(true);
    setError('');

    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .insert({
        user_id: user.id,
        name: trimmedName,
      })
      .select()
      .single();

    if (routineError) {
      console.error('Failed to create routine:', routineError);
      setError('Could not create the routine. Please try again.');
      setSaving(false);
      return;
    }

    const rows = routineExercises.map((item, position) => ({
      routine_id: routine.id,
      exercise_id: item.exercise.id,
      position,
      default_sets: item.defaultSets,
    }));

    const { error: exercisesError } = await supabase
      .from('routine_exercises')
      .insert(rows);

    if (exercisesError) {
      console.error('Failed to add routine exercises:', exercisesError);
      await supabase.from('routines').delete().eq('id', routine.id);
      setError('Could not save the exercises. Please try again.');
      setSaving(false);
      return;
    }

    navigate(-1);
  }

  return (
    <main className="routine-editor-page">
      <header className="routine-editor-header">
        <button
          type="button"
          className="routine-editor-back"
          onClick={goBack}
          disabled={saving}
          aria-label="Go back"
        >
          <ArrowLeft size={21} />
        </button>

        <div className="routine-editor-header__title">
          <p>New routine</p>
          <h1>Create routine</h1>
        </div>

        <button
          type="button"
          className="routine-editor-save"
          onClick={saveRoutine}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      <div className="routine-editor-content">
        <label className="routine-editor-label" htmlFor="routine-name">
          Routine name
        </label>

        <input
          id="routine-name"
          className="routine-editor-name-input"
          placeholder="e.g. Upper"
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
          autoFocus
        />

        <div className="routine-editor-section-header">
          <span>Exercises</span>
          <span>{routineExercises.length}</span>
        </div>

        {routineExercises.length === 0 ? (
          <div className="routine-editor-empty">
            <p>Add the exercises you want to repeat each session.</p>
          </div>
        ) : (
          <section className="routine-editor-list" aria-label="Routine exercises">
            {routineExercises.map((item, index) => (
              <article className="routine-editor-row" key={item.exercise.id}>
                <span className="routine-editor-row__position">
                  {index + 1}
                </span>

                <div className="routine-editor-row__main">
                  <strong>{item.exercise.name}</strong>

                  <label>
                    Sets
                    <input
                      type="number"
                      min="1"
                      max="20"
                      inputMode="numeric"
                      value={item.defaultSets}
                      onChange={(event) => updateSets(index, event.target.value)}
                      aria-label={`Default sets for ${item.exercise.name}`}
                    />
                  </label>
                </div>

                <div className="routine-editor-row__actions">
                  <button
                    type="button"
                    onClick={() => moveExercise(index, -1)}
                    disabled={index === 0 || saving}
                    aria-label={`Move ${item.exercise.name} up`}
                  >
                    <ChevronUp size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveExercise(index, 1)}
                    disabled={index === routineExercises.length - 1 || saving}
                    aria-label={`Move ${item.exercise.name} down`}
                  >
                    <ChevronDown size={18} />
                  </button>

                  <button
                    type="button"
                    className="routine-editor-row__delete"
                    onClick={() => removeExercise(index)}
                    disabled={saving}
                    aria-label={`Remove ${item.exercise.name}`}
                  >
                    <Trash size={17} />
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}

        <button
          type="button"
          className="routine-editor-add"
          onClick={() => setShowPicker(true)}
          disabled={saving}
        >
          <Plus size={19} />
          Add exercise
        </button>

        {error && (
          <p className="routine-editor-error" role="alert">
            {error}
          </p>
        )}
      </div>

      {showPicker && (
        <ExercisePicker
          title="Add exercise"
          closeLabel="Back"
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
        />
      )}
    </main>
  );
}