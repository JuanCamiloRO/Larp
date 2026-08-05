import { useEffect, useState } from 'react';
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

  function resolveImageUrl(img) {
    if (img.startsWith('http')) return img;
    return `${IMAGE_BASE_URL}${img}`;
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

  return (
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
        <div className="exercise-picker-modal__handle" />

        <div className="exercise-picker-header">
          <h2
            style={{
              margin: 0,
              color: 'white',
              fontSize: '20px',
            }}
          >
            Select Exercise
          </h2>

          <button
            onClick={onClose}
            aria-label="Close exercise picker"
            style={{
              border: 'none',
              background: 'none',
              color: '#0a84ff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>

        <div className="exercise-picker-search">
          <input
            autoFocus
            className="edit-field"
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
          {!query.trim() && (
            <p
              style={{
                color: '#8e8e93',
                textAlign: 'center',
                marginTop: '32px',
              }}
            >
              Exercises will appear here.
            </p>
          )}

          {loading && (
            <p
              style={{
                color: '#8e8e93',
                textAlign: 'center',
                marginTop: '32px',
              }}
            >
              Searching...
            </p>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <p
              style={{
                color: '#8e8e93',
                textAlign: 'center',
                marginTop: '32px',
              }}
            >
              No exercises found.
            </p>
          )}

          {results.map((exercise) => {
            const isSelecting = selectingId === exercise.id;

            return (
              <button
                key={exercise.id}
                onClick={() => handleSelect(exercise)}
                disabled={Boolean(selectingId)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 4px',
                  border: 'none',
                  borderBottom: '1px solid #2c2c2e',
                  background: 'transparent',
                  color: 'white',
                  textAlign: 'left',
                  cursor: selectingId ? 'default' : 'pointer',
                  opacity: selectingId && !isSelecting ? 0.5 : 1,
                }}
              >
                {exercise.images?.[0] ? (
                  <img
                    src={resolveImageUrl(exercise.images[0])}
                    alt=""
                    style={{
                      width: '52px',
                      height: '52px',
                      flexShrink: 0,
                      objectFit: 'cover',
                      borderRadius: '50%',
                      background: '#2c2c2e',
                    }}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '52px',
                      height: '52px',
                      display: 'grid',
                      flexShrink: 0,
                      placeItems: 'center',
                      borderRadius: '10px',
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
                    flex: 1,
                    minWidth: 0,
                    fontSize: '16px',
                    fontWeight: 600,
                  }}
                >
                  {exercise.name}
                </span>

                <span
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
    </div>
  );
}