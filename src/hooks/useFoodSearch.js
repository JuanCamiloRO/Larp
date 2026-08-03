// hooks/useFoodSearch.js
// Text-based food search (MyFitnessPal-style), separate from barcode lookup.
// Calls the 'search-food' Edge Function, which queries Open Food Facts'
// search endpoint server-side and returns a list of matching products.

import { useState } from 'react';
import { supabase } from '../supabase';

export function useFoodSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function search(query) {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: fnError } = await supabase.functions.invoke('food-search', {
      body: { query: query.trim() },
    });

    setLoading(false);

    if (fnError) {
      setError('Search failed. Try again.');
      setResults([]);
      return;
    }

    if (!data?.success) {
      setError(data?.error || 'No results found');
      setResults([]);
      return;
    }

    setResults(data.foods || []);
  }

  return { results, loading, error, search };
}