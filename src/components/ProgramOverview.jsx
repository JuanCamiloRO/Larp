import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Globe, Lock, Play } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchProgramById } from '../hooks/usePrograms';
import '../css/routine-editor.css';
import '../css/program-overview.css';

export default function ProgramOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      const { program: loaded, error: loadError } = await fetchProgramById(id);
      if (cancelled) return;

      if (loadError) {
        setError(loadError);
        setLoading(false);
        return;
      }

      setProgram(loaded);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  // ⚠️ PLACEHOLDER: this guesses at your app's "start a routine" route based
  // on the `startRoutine(routine)` reference in your workout picker, but I
  // don't have that implementation. Swap this for whatever actually kicks
  // off a workout session elsewhere in your app.
  function startDay(routine) {
    navigate(`/routines/${routine.id}/start`);
  }

  if (loading) {
    return <main className="routine-editor-page"><p className="program-overview__status">Loading program…</p></main>;
  }

  if (error || !program) {
    return (
      <main className="routine-editor-page">
        <header className="routine-editor-header">
          <button type="button" className="routine-editor-back" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={21} />
          </button>
          <div className="routine-editor-header__title"><p>Program</p><h1>Not found</h1></div>
          <span aria-hidden="true" />
        </header>
        <div className="routine-editor-content">
          <p className="routine-editor-error" role="alert">{error || 'This program could not be found.'}</p>
        </div>
      </main>
    );
  }

  const isOwner = program.user_id === user?.id;

  return (
    <main className="routine-editor-page">
      <header className="routine-editor-header">
        <button type="button" className="routine-editor-back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={21} />
        </button>
        <div className="routine-editor-header__title">
          <p>Program</p>
          <h1>{program.name}</h1>
        </div>
        <span aria-hidden="true" />
      </header>

      <div className="routine-editor-content">
        <div className="program-overview__meta">
          <span className={program.is_public ? 'program-overview__badge program-overview__badge--public' : 'program-overview__badge'}>
            {program.is_public ? <Globe size={13} /> : <Lock size={13} />}
            {program.is_public ? 'Public' : 'Private'}
          </span>
          <span className="program-overview__badge">
            {program.program_routines.length} day{program.program_routines.length === 1 ? '' : 's'}
          </span>
        </div>

        {program.description && (
          <p className="program-overview__description">{program.description}</p>
        )}

        <div className="routine-editor-section-header">
          <span>Days</span>
          <span>{program.program_routines.length}</span>
        </div>

        {program.program_routines.length === 0 ? (
          <div className="routine-editor-empty">
            <p>This program doesn't have any days yet.</p>
          </div>
        ) : (
          <section className="routine-editor-list" aria-label="Program days">
            {program.program_routines.map((slot) => {
              const routine = slot.routines;
              const exerciseCount = routine?.routine_exercises?.length || 0;
              const setCount = routine?.routine_exercises?.reduce(
                (sum, item) => sum + (item.default_sets || 0), 0
              ) || 0;

              return (
                <article className="routine-editor-row program-overview__day" key={slot.id}>
                  <div className="routine-editor-row__main">
                    <small className="program-overview__day-label">{slot.day_label}</small>
                    <strong>{routine?.name || 'Routine unavailable'}</strong>
                    {routine && (
                      <small>{exerciseCount} exercises · {setCount} sets</small>
                    )}
                  </div>

                  {routine && (
                    <button
                      type="button"
                      className="program-overview__start-button"
                      onClick={() => startDay(routine)}
                      aria-label={`Start ${routine.name}`}
                    >
                      <Play size={16} /> Start
                    </button>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {isOwner && (
          <button
            type="button"
            className="routine-editor-add"
            onClick={() => navigate(`/programs/${program.id}/edit`)}
          >
            Edit program
          </button>
        )}
      </div>
    </main>
  );
}