import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import RoutinePicker from '../components/RoutinePicker';
import '../css/routine-editor.css'; // reuses the same visual language as RoutineEditor

export default function ProgramEditor() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [programRoutines, setProgramRoutines] = useState([]); // [{ routine, dayLabel }]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hasDraft = Boolean(name.trim()) || programRoutines.length > 0;

  function goBack() {
    if (saving) return;
    if (hasDraft && !window.confirm('Discard this program draft?')) return;
    navigate(-1);
  }

  function togglePublic(nextValue) {
    // Public programs can only reference public routines, since RLS on
    // `routines` would otherwise hide private ones from other viewers.
    if (nextValue) {
      const hasPrivateRoutine = programRoutines.some((item) => !item.routine.is_public);
      if (hasPrivateRoutine) {
        setError('Remove or make public any private routines before sharing this program.');
        return;
      }
    }
    setIsPublic(nextValue);
    setError('');
  }

  function addRoutine(routine) {
    if (isPublic && !routine.is_public) {
      setError(`${routine.name} is private — make it public first, or keep this program private.`);
      setShowPicker(false);
      return;
    }

    // Routines can be added more than once (e.g. "Push" appearing twice in a
    // 6-day PPL split) — each addition is its own slot, distinguished by
    // `slotId` rather than routine.id, since the same routine can occupy
    // multiple days.
    setProgramRoutines((current) => [
      ...current,
      {
        slotId: crypto.randomUUID(),
        routine,
        dayLabel: `Day ${current.length + 1}`,
      },
    ]);
    setError('');
    setShowPicker(false);
  }

  function updateDayLabel(index, value) {
    setProgramRoutines((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, dayLabel: value } : item
      )
    );
  }

  function removeRoutine(index) {
    setProgramRoutines((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function moveRoutine(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= programRoutines.length) return;

    setProgramRoutines((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  async function saveProgram() {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Give your program a name.');
      return;
    }

    if (!programRoutines.length) {
      setError('Add at least one routine.');
      return;
    }

    const hasEmptyDayLabel = programRoutines.some((item) => !item.dayLabel.trim());
    if (hasEmptyDayLabel) {
      setError('Give every day a label.');
      return;
    }

    if (!user?.id) {
      setError('You must be logged in to save a program.');
      return;
    }

    setSaving(true);
    setError('');

    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert({
        user_id: user.id,
        name: trimmedName,
        description: description.trim() || null,
        is_public: isPublic,
      })
      .select()
      .single();

    if (programError) {
      console.error('Failed to create program:', programError);
      setError('Could not create the program. Please try again.');
      setSaving(false);
      return;
    }

    const rows = programRoutines.map((item, position) => ({
      program_id: program.id,
      routine_id: item.routine.id,
      day_label: item.dayLabel.trim(),
      position,
    }));

    const { error: routinesError } = await supabase
      .from('program_routines')
      .insert(rows);

    if (routinesError) {
      console.error('Failed to add program routines:', routinesError);
      await supabase.from('programs').delete().eq('id', program.id);
      setError('Could not save routines. Please try again.');
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
          <p>New program</p>
          <h1>Create program</h1>
        </div>

        <button
          type="button"
          className="routine-editor-save"
          onClick={saveProgram}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      <div className="routine-editor-content">
        <label className="routine-editor-label" htmlFor="program-name">
          Program name
        </label>

        <span style={{ display: 'flex', gap: '1rem' }}>
          <input
            id="program-name"
            className="routine-editor-name-input"
            placeholder="e.g. Push Pull Legs"
            value={name}
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            style={{ width: '50%' }}
          />

          <select
            className="routine-editor-name-input"
            value={isPublic ? 'public' : 'private'}
            onChange={(event) => togglePublic(event.target.value === 'public')}
            style={{ width: '50%' }}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </span>

        <label className="routine-editor-label" htmlFor="program-description">
          Description
        </label>
        <textarea
          id="program-description"
          className="routine-editor-name-input"
          placeholder="What's this split for? Who is it good for?"
          value={description}
          maxLength={280}
          rows={3}
          onChange={(event) => setDescription(event.target.value)}
          style={{ width: '100%', resize: 'vertical' }}
        />

        <div className="routine-editor-section-header">
          <span>Routines</span>
          <span>{programRoutines.length}</span>
        </div>

        {programRoutines.length === 0 ? (
          <div className="routine-editor-empty">
            <p>Add the routines that make up this split, in order.</p>
          </div>
        ) : (
          <section className="routine-editor-list" aria-label="Program routines">
            {programRoutines.map((item, index) => (
              <article className="routine-editor-row" key={item.slotId}>
                <span className="routine-editor-row__position">{index + 1}</span>

                <div className="routine-editor-row__main">
                  <strong>{item.routine.name}</strong>

                  <label>
                    Day label
                    <input
                      type="text"
                      value={item.dayLabel}
                      maxLength={30}
                      onChange={(event) => updateDayLabel(index, event.target.value)}
                      aria-label={`Day label for ${item.routine.name}`}
                    />
                  </label>
                </div>

                <div className="routine-editor-row__actions">
                  <button
                    type="button"
                    onClick={() => moveRoutine(index, -1)}
                    disabled={index === 0 || saving}
                    aria-label={`Move ${item.routine.name} up`}
                  >
                    <ChevronUp size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveRoutine(index, 1)}
                    disabled={index === programRoutines.length - 1 || saving}
                    aria-label={`Move ${item.routine.name} down`}
                  >
                    <ChevronDown size={18} />
                  </button>

                  <button
                    type="button"
                    className="routine-editor-row__delete"
                    onClick={() => removeRoutine(index)}
                    disabled={saving}
                    aria-label={`Remove ${item.routine.name}`}
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
          Add routine
        </button>

        {error && (
          <p className="routine-editor-error" role="alert">
            {error}
          </p>
        )}
      </div>

      {showPicker && (
        <RoutinePicker
          title="Add routine"
          closeLabel="Back"
          onSelect={addRoutine}
          onClose={() => setShowPicker(false)}
        />
      )}
    </main>
  );
}