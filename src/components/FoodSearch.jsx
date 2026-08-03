// components/FoodSearch.jsx
// MyFitnessPal-style food search. Fires ONLY on Enter or button click, not
// per keystroke -- Open Food Facts caps search queries at 10 req/min/IP,
// far tighter than their 100 req/min product-read limit, so typeahead
// search was blowing through that budget and causing intermittent 503s.

import { useState } from 'react';
import { useFoodSearch } from '../hooks/useFoodSearch';
import '../css/food.css';

export default function FoodSearch({ onSelectFood }) {
  const [query, setQuery] = useState('');
  const { results, loading, error, search } = useFoodSearch();

  function handleSearch() {
    if (query.trim().length < 2) return;
    search(query.trim());
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div className="food-search">
      <div className="food-search-bar">
        <input
          className="food-search-input"
          type="text"
          placeholder="Search for a food, then press Enter..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn-primary food-search-btn" onClick={handleSearch}>
          Search
        </button>
      </div>

      {loading && <p className="subtle" style={{ marginTop: '10px' }}>Searching...</p>}
      {error && <p className="message error" style={{ marginTop: '10px' }}>{error}</p>}

      {!loading && !error && results.length === 0 && query.length >= 2 && (
        <p className="subtle" style={{ marginTop: '10px' }}>
          Press Enter or tap Search to look up "{query}".
        </p>
      )}

      {results.length > 0 && (
        <div className="food-search-results">
          {results.map((food) => (
            <div
              key={food.barcode}
              className="food-search-row"
              onClick={() => onSelectFood(food)}
            >
              {food.image_url ? (
                <img className="food-search-thumb" src={food.image_url} alt={food.name} />
              ) : (
                <div className="food-search-thumb food-search-thumb-placeholder" />
              )}

              <div className="food-search-info">
                <span className="follow-name">{food.name}</span>
                {food.brand && <span className="follow-handle">{food.brand}</span>}
              </div>

              <span className="subtle food-search-cals">
                {food.calories_per_100g != null ? `${Math.round(food.calories_per_100g)} kcal` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}