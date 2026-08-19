import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronRight, Layers, Search, UserRound, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchPublicPrograms, cloneProgramForUser } from '../hooks/usePrograms';
import '../css/explore-routines.css'; // reuses the same visual language as ExploreRoutines

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ProgramCard({ program, onClick }) {
  const days = program.program_routines || [];

  const totalExercises = days.reduce(
    (total, slot) => total + (slot.routines?.routine_exercises?.length || 0),
    0
  );

  const author = program.profiles;
  const authorName = author?.username || author?.name || 'Unknown athlete';
  const authorAvatar = author?.avatar_url || '/default-avatar.png';

  return (
    <button
      type="button"
      className="explore-routine-card"
      onClick={() => onClick(program)}
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
          {formatDate(program.created_at)}
        </span>
      </header>

      <div className="explore-routine-card__body">
        <div className="explore-routine-card__title-row">
          <span className="explore-routine-card__icon" aria-hidden="true">
            <Layers size={20} />
          </span>
          <div>
            <h2>{program.name}</h2>
            {program.description && <p>{program.description}</p>}
          </div>
          <ChevronRight className="explore-routine-card__chevron" size={20} />
        </div>

        <div className="explore-routine-card__stats">
          <span>{days.length} day{days.length === 1 ? '' : 's'}</span>
          <span>{totalExercises} exercises</span>
        </div>

        <div className="explore-routine-card__exercise-list">
          {days.slice(0, 5).map((slot) => (
            <span key={slot.id}>
              {slot.day_label}
              <small>{slot.routines?.name || 'Unavailable'}</small>
            </span>
          ))}
          {days.length > 5 && (
            <span className="explore-routine-card__more">
              +{days.length - 5} more
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ExplorePrograms() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      setLoading(true);
      setError('');

      const { programs: loaded, error: loadError } = await fetchPublicPrograms();
      if (!isCurrent) return;

      if (loadError) {
        setError(loadError);
        setPrograms([]);
      } else {
        setPrograms(loaded);
      }

      setLoading(false);
    }

    load();
    return () => { isCurrent = false; };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredPrograms = programs.filter((program) => {
    if (!normalizedQuery) return true;

    const author = program.profiles;
    const authorName = `${author?.username || ''} ${author?.name || ''}`;
    const dayNames = (program.program_routines || [])
      .map((slot) => `${slot.day_label} ${slot.routines?.name || ''}`)
      .join(' ');

    return `${program.name} ${program.description || ''} ${authorName} ${dayNames}`
      .toLowerCase()
      .includes(normalizedQuery);
  });

  async function addSelectedProgram() {
    if (!selectedProgram || cloning) return;

    setCloning(true);
    setError('');

    const { program: cloned, error: cloneError } = await cloneProgramForUser(
      selectedProgram.id,
      user.id
    );

    setCloning(false);

    if (cloneError) {
      setError(cloneError);
      return;
    }

    setSelectedProgram(null);
    navigate(`/programs/${cloned.id}`);
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
          <h1>Explore programs</h1>
        </div>
        <span aria-hidden="true" />
      </header>

      <section className="explore-routines-content">
        <div className="explore-routines-intro">
          <span className="explore-routines-intro__icon" aria-hidden="true">
            <UserRound size={20} />
          </span>
          <div>
            <h2>Follow a community split</h2>
            <p>Browse multi-day programs shared by other athletes.</p>
          </div>
        </div>

        <label className="explore-routines-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search programs or days"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="explore-routines-section-header">
          <h2>Public programs</h2>
          <span>{filteredPrograms.length}</span>
        </div>

        {loading && <div className="explore-routines-status">Loading programs…</div>}
        {!loading && error && (
          <div className="explore-routines-status explore-routines-status--error">
            {error}
          </div>
        )}
        {!loading && !error && filteredPrograms.length === 0 && (
          <div className="explore-routines-status">
            {programs.length === 0 ? 'No public programs yet.' : 'No programs match your search.'}
          </div>
        )}
        {!loading && !error && filteredPrograms.length > 0 && (
          <section className="explore-routines-list" aria-label="Public programs">
            {filteredPrograms.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onClick={setSelectedProgram}
              />
            ))}
          </section>
        )}
      </section>

      {selectedProgram && (
        <div
          className="explore-routine-confirm-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !cloning) {
              setSelectedProgram(null);
            }
          }}
        >
          <section
            className="explore-routine-confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="explore-program-confirm-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="explore-routine-confirm__close"
              onClick={() => setSelectedProgram(null)}
              disabled={cloning}
              aria-label="Close confirmation"
            >
              <X size={19} />
            </button>

            <span className="explore-routine-confirm__icon" aria-hidden="true">
              <CalendarDays size={23} />
            </span>
            <h2 id="explore-program-confirm-title">
              Add {selectedProgram.name}?
            </h2>
            <p>
              This copies all {selectedProgram.program_routines?.length || 0} day
              {(selectedProgram.program_routines?.length || 0) === 1 ? '' : 's'} and their
              routines into your account. You can edit your copy freely — changes
              won't affect the original.
            </p>

            <div className="explore-routine-confirm__actions">
              <button
                className="explore-routine-confirm__cancel"
                onClick={() => setSelectedProgram(null)}
                disabled={cloning}
              >
                Not now
              </button>
              <button
                className="explore-routine-confirm__start"
                onClick={addSelectedProgram}
                disabled={cloning}
              >
                {cloning ? 'Adding…' : 'Add to my programs'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}