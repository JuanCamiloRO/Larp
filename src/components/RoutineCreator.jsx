import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Search, X } from 'lucide-react';
import { supabase } from '../supabase';
import '../css/picker.css';

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export default function ExercisePicker({
  onSelect,
  onClose,
  variant = 'modal',
  title = 'Select exercise',
  closeLabel = 'Cancel',
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState(null);
  const isPage = variant === 'page';

  useEffect(() => {
    let isCurrent = true;
    const timeout = setTimeout(async () => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) {
        if (isCurrent) {
          setResults([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .ilike('name', `%${trimmedQuery}%`)
        .order('name')
        .limit(20);

      if (!isCurrent) return;
      if (error) {
        console.error('Failed to search exercises:', error);
        setResults([]);
      } else {
        setResults(data || []);
      }
      setLoading(false);
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    if (isPage) return undefined;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isPage]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  function resolveImageUrl(image) {
    if (!image) return null;
    return image.startsWith('http') ? image : `${IMAGE_BASE_URL}${image}`;
  }

  async function handleSelect(exercise) {
    if (selectingId) return;
    setSelectingId(exercise.id);
    try {
      await onSelect(exercise);
    } catch (error) {
      console.error('Failed to select exercise:', error);
      setSelectingId(null);
    }
  }

  const hasQuery = Boolean(query.trim());
  const hasNoResults = !loading && hasQuery && results.length === 0;
  const content = (
    <div className={`exercise-picker ${isPage ? 'exercise-picker--page' : 'exercise-picker--modal'}`}>
      <header className="exercise-picker-header">
        <button className="exercise-picker-close" type="button" onClick={onClose} aria-label={closeLabel}>
          {isPage ? <ArrowLeft size={21} /> : <X size={20} />}
          <span>{closeLabel}</span>
        </button>
        <h1>{title}</h1>
        <span className="exercise-picker-header__spacer" aria-hidden="true" />
      </header>

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
        {!hasQuery && <p className="exercise-picker-message">Search for an exercise to add it.</p>}
        {loading && <p className="exercise-picker-message">Searching…</p>}
        {hasNoResults && <p className="exercise-picker-message">No exercises found.</p>}

        {!loading && results.map((exercise) => {
          const isSelecting = selectingId === exercise.id;
          const imageUrl = resolveImageUrl(exercise.images?.[0]);
          return (
            <button className="exercise-picker-result" key={exercise.id} type="button" onClick={() => handleSelect(exercise)} disabled={Boolean(selectingId)}>
              {imageUrl ? <img src={imageUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span className="exercise-picker-result__fallback" aria-hidden="true">💪</span>}
              <span className="exercise-picker-result__name">{exercise.name}</span>
              <span className="exercise-picker-result__arrow" aria-hidden="true">{isSelecting ? '…' : '›'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (isPage) return <main className="exercise-picker-page">{content}</main>;
  return createPortal(
    <div className="exercise-picker-overlay" role="presentation" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>{content}</section>
    </div>,
    document.body
  );
}