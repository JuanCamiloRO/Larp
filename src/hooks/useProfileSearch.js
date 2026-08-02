// hooks/useProfileSearch.js
import { useState } from 'react';
import { supabase } from '../supabase';

export function useProfileSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function search(query) {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(20);

    setResults(error ? [] : data);
    setLoading(false);
  }

  return { results, loading, search };
}