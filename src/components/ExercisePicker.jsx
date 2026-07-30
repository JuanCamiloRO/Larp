import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

export default function ExercisePicker({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {

    async function search() {
      if (!query) return setResults([]);
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);
      setResults(data || []);
    }
    search();
  }, [query]);

  function resolveImageUrl(img) {
  if (img.startsWith('http')) return img;
  return `${IMAGE_BASE_URL}${img}`;
}

  return (
    <div>
      <input
        className="edit-field"
        placeholder="Search exercise..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.map((ex) => (
        <div
          key={ex.id}
          onClick={() => onSelect(ex)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          {ex.images?.[0] && (
            <img
              src={resolveImageUrl(ex.images[0])}
              alt={ex.name}
              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <span>{ex.name}</span>
        </div>
      ))}
    </div>
  );
}