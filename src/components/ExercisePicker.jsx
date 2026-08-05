import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabase';
import '../css/picker.css';

const IMAGE_BASE_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export default function ExercisePicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState(null);

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
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  function resolveImageUrl(image) {
    if (!image) return null;

    return image.startsWith('http')
      ? image
      : `${IMAGE_BASE_URL}${image}`;
  }

  async function handleSelect(exercise) {
    if (selectingId) return;

    setSelectingId(exercise.id);

    try {
      await onSelect(exercise);
      setSelectingId(null);
    } catch (error) {
      console.error('Failed to select exercise:', error);
      setSelectingId(null);
    }
  }

  const hasQuery = Boolean(query.trim());
  const hasNoResults = !loading && hasQuery && results.length === 0;

  return createPortal(
    <div
      className="exercise-picker-overlay"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="exercise-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Select exercise"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div />

        <header className="exercise-picker-header">
          <h2
            style={{
              margin: 0,
              color: '#fff',
              fontSize: '20px',
            }}
          >
            Select Exercise
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close exercise picker"
            style={{
              border: 'none',
              background: 'none',
              color: '#0a84ff',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </header>

        <div className="exercise-picker-search">
          <input
            className="edit-field"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Search exercises..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            style={{
              boxSizing: 'border-box',
              width: '100%',
              margin: 0,
            }}
          />
        </div>

        <div className="exercise-picker-results">
          {!hasQuery && (
            <p
              style={{
                marginTop: '32px',
                color: '#8e8e93',
                textAlign: 'center',
              }}
            >
              Search for an exercise to add it.
            </p>
          )}

          {loading && (
            <p
              style={{
                marginTop: '32px',
                color: '#8e8e93',
                textAlign: 'center',
              }}
            >
              Searching...
            </p>
          )}

          {hasNoResults && (
            <p
              style={{
                marginTop: '32px',
                color: '#8e8e93',
                textAlign: 'center',
              }}
            >
              No exercises found.
            </p>
          )}

          {!loading &&
            results.map((exercise) => {
              const isSelecting = selectingId === exercise.id;
              const imageUrl = resolveImageUrl(exercise.images?.[0]);

              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => handleSelect(exercise)}
                  disabled={Boolean(selectingId)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 4px',
                    border: 'none',
                    borderBottom: '1px solid #2c2c2e',
                    background: 'transparent',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: selectingId ? 'default' : 'pointer',
                    opacity: selectingId && !isSelecting ? 0.5 : 1,
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt=""
                      style={{
                        width: '52px',
                        height: '52px',
                        flexShrink: 0,
                        borderRadius: '50%',
                        background: '#2c2c2e',
                        objectFit: 'cover',
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      style={{
                        display: 'grid',
                        width: '52px',
                        height: '52px',
                        flexShrink: 0,
                        placeItems: 'center',
                        borderRadius: '50%',
                        background: '#2c2c2e',
                        color: '#8e8e93',
                        fontSize: '22px',
                      }}
                    >
                      💪
                    </div>
                  )}

                  <span
                    style={{
                      minWidth: 0,
                      flex: 1,
                      overflow: 'hidden',
                      fontSize: '16px',
                      fontWeight: 600,
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {exercise.name}
                  </span>

                  <span
                    aria-hidden="true"
                    style={{
                      color: '#8e8e93',
                      fontSize: '20px',
                    }}
                  >
                    {isSelecting ? '…' : '›'}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>,
    document.body
  );
}