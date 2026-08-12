import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, Search } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import '../css/routine-editor.css';

export default function RoutinePicker({ title, closeLabel, onSelect, onClose }) {
  const { user } = useAuth();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadRoutines() {
      if (!user?.id) return;
      setLoading(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('routines')
        .select('id, name, is_public')
        .eq('user_id', user.id)
        .order('name');

      if (cancelled) return;

      if (queryError) {
        console.error('Failed to load routines:', queryError);
        setError('Could not load your routines.');
        setLoading(false);
        return;
      }

      setRoutines(data || []);
      setLoading(false);
    }

    loadRoutines();
    return () => { cancelled = true; };
  }, [user?.id]);

  const filtered = routines.filter((routine) =>
    routine.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="routine-editor-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <header className="routine-editor-header">
        <button
          type="button"
          className="routine-editor-back"
          onClick={onClose}
          aria-label={closeLabel || 'Close'}
        >
          <ArrowLeft size={21} />
        </button>

        <div className="routine-editor-header__title">
          <p>Your routines</p>
          <h1>{title}</h1>
        </div>

        <span aria-hidden="true" />
      </header>

      <div className="routine-editor-content">
        <div className="routine-editor-search" style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input
            type="text"
            placeholder="Search your routines"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="routine-editor-name-input"
            style={{ width: '100%', paddingLeft: 36, boxSizing: 'border-box' }}
            autoFocus
          />
        </div>

        {loading && <p>Loading your routines…</p>}
        {error && <p className="routine-editor-error" role="alert">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <div className="routine-editor-empty">
            <p>
              {routines.length === 0
                ? "You haven't created any routines yet — build one first, then come back to add it here."
                : 'No routines match your search.'}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <section className="routine-editor-list" aria-label="Available routines">
            {filtered.map((routine) => (
              <button
                type="button"
                key={routine.id}
                className="routine-editor-row"
                onClick={() => onSelect(routine)}
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
              >
                <div className="routine-editor-row__main">
                  <strong>{routine.name}</strong>
                  {!routine.is_public && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, opacity: 0.5, marginTop: 4 }}>
                      <Lock size={12} /> Private
                    </span>
                  )}
                </div>
              </button>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}