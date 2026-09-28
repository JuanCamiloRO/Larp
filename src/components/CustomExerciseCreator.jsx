import { useState } from 'react';
import useCustomExercises from '../hooks/useCustomExercises';

export default function CustomExerciseCreator({ initialName = '', onCreated, onCancel }) {
  const { createExercise, saving, error } = useCustomExercises();
  const [name, setName] = useState(initialName);
  const [measurementType, setMeasurementType] = useState('reps');

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const exercise = await createExercise({ name, measurementType });
      onCreated?.(exercise);
    } catch {
      // The hook exposes the error for display below.
    }
  }

  return (
    <form className="custom-exercise-form" onSubmit={handleSubmit} aria-label="Create custom exercise">
      <div className="custom-exercise-form__field">
        <label className="custom-exercise-form__label" htmlFor="custom-exercise-name">Exercise name</label>
        <input
          className="custom-exercise-form__input"
          id="custom-exercise-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          autoComplete="off"
          required
          disabled={saving}
          autoFocus
        />
      </div>

      <fieldset className="custom-exercise-form__choices" disabled={saving}>
        <legend className="custom-exercise-form__legend">Track each set by</legend>
        <label className="custom-exercise-form__choice">
          <input type="radio" name="custom-exercise-measurement" value="reps"
            checked={measurementType === 'reps'} onChange={() => setMeasurementType('reps')} />
          Repetitions
        </label>
        <label className="custom-exercise-form__choice">
          <input type="radio" name="custom-exercise-measurement" value="time"
            checked={measurementType === 'time'} onChange={() => setMeasurementType('time')} />
          Time (seconds)
        </label>
      </fieldset>

      {error && <p className="custom-exercise-form__error" role="alert">{error}</p>}

      <div className="custom-exercise-form__actions">
        <button className="custom-exercise-form__button" type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : 'Create exercise'}
        </button>
        {onCancel && (
          <button className="custom-exercise-form__button custom-exercise-form__button--secondary"
            type="button" onClick={onCancel} disabled={saving}>
            Back to search
          </button>
        )}
      </div>
    </form>
  );
}