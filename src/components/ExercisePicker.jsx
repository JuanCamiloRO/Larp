import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { supabase } from '../supabase';
import CustomExerciseCreator from './CustomExerciseCreator';
import '../css/picker.css';

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export default function ExercisePicker({
  onSelect,
  onClose,
  title = 'Select exercise',
  closeLabel = 'Cancel',
}) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState({ query: '', results: [], loading: false, error: null });
  const [showCreator, setShowCreator] = useState(false);
  const [selectingId, setSelectingId] = useState(null);
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (showCreator) return;
    let isCurrent = true;
    if (!trimmedQuery) {
      setSearch({ query: '', results: [], loading: false, error: null });
      return;
    }

    setSearch((current) => ({ ...current, loading: true, error: null }));
    const timeout = setTimeout(async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error('Sign in to search and create exercises.');

        const [catalogue, personal] = await Promise.all([
          supabase.from('exercises')
            .select('id, name, images')
            .ilike('name', `%${trimmedQuery}%`)
            .order('name')
            .limit(20),
          supabase.from('custom_exercises')
            .select('id, name, measurement_type')
            .eq('user_id', user.id)
            .ilike('name', `%${trimmedQuery}%`)
            .order('name')
            .limit(20),
        ]);
        if (catalogue.error) throw catalogue.error;
        if (personal.error) throw personal.error;
        if (!isCurrent) return;

        const results = [
          ...(catalogue.data ?? []).map((exercise) => ({ ...exercise, source: 'catalogue' })),
          ...(personal.data ?? []).map((exercise) => ({ ...exercise, source: 'custom' })),
        ].sort((a, b) => a.name.localeCompare(b.name));
        setSearch({ query: trimmedQuery, results, loading: false, error: null });
      } catch (error) {
        if (isCurrent) {
          setSearch({ query: trimmedQuery, results: [], loading: false, error: error.message || 'Search failed.' });
        }
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [trimmedQuery, showCreator]);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        if (showCreator) setShowCreator(false);
        else onClose();
      }
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, showCreator]);

  function resolveImageUrl(image) {
    if (!image) return null;
    return image.startsWith('http') ? image : `${IMAGE_BASE_URL}${image}`;
  }

  async function handleSelect(exercise) {
    if (selectingId) return;
    setSelectingId(`${exercise.source}:${exercise.id}`);
    try {
      await onSelect(exercise);
    } catch (error) {
      console.error('Failed to select exercise:', error);
      setSelectingId(null);
    }
  }

  const searchIsCurrent = !search.loading && search.query === trimmedQuery;
  const hasNoResults = Boolean(trimmedQuery) && searchIsCurrent && !search.error && search.results.length === 0;
  const visibleResults = searchIsCurrent && !search.error ? search.results : [];

  return createPortal(
    <div className="exercise-picker-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="exercise-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label={showCreator ? 'Create custom exercise' : title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="exercise-picker-header">
          <h2>{showCreator ? 'Create custom exercise' : title}</h2>
          <button className="exercise-picker-close" type="button" onClick={onClose} aria-label={closeLabel}>
            <X size={19} />
            <span>{closeLabel}</span>
          </button>
        </header>

        {showCreator ? (
          <CustomExerciseCreator
            initialName={trimmedQuery}
            onCancel={() => setShowCreator(false)}
            onCreated={(exercise) => {
              setShowCreator(false);
              void handleSelect({ ...exercise, source: 'custom' });
            }}
          />
        ) : (
          <>
            <div className="exercise-picker-search">
              <Search size={19} aria-hidden="true" />
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                placeholder="Search exercises..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                autoFocus
              />
            </div>

            <div className="exercise-picker-results">
              {!trimmedQuery && <p className="exercise-picker-message">Search for an exercise to add it.</p>}
              {trimmedQuery && !searchIsCurrent && <p className="exercise-picker-message">Searching…</p>}
              {searchIsCurrent && search.error && <p className="exercise-picker-message" role="alert">{search.error}</p>}
              {hasNoResults && (
                <>
                  <p className="exercise-picker-message">No exercises found.</p>
                  <button type="button" className="exercise-picker-result" onClick={() => setShowCreator(true)}>
                    Create custom exercise: {trimmedQuery}
                  </button>
                </>
              )}

              {visibleResults.map((exercise) => {
                const key = `${exercise.source}:${exercise.id}`;
                const isSelecting = selectingId === key;
                const imageUrl = exercise.source === 'catalogue' ? resolveImageUrl(exercise.images?.[0]) : null;
                return (
                  <button
                    className="exercise-picker-result"
                    key={key}
                    type="button"
                    onClick={() => handleSelect(exercise)}
                    disabled={Boolean(selectingId)}
                  >
                    {imageUrl ? (
                      <img src={imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <span className="exercise-picker-result__fallback" aria-hidden="true">💪</span>
                    )}
                    <span className="exercise-picker-result__name">
                      {exercise.name}{exercise.source === 'custom' ? ' · Custom' : ''}
                    </span>
                    <span className="exercise-picker-result__arrow" aria-hidden="true">{isSelecting ? '…' : '›'}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>,
    document.body
  );
}