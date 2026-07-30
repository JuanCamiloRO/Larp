import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useRandomProfiles(limit = 5) {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchProfiles() {
      setLoading(true);

      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const followingIds = (follows || []).map((f) => f.following_id);
      const excludeIds = [user.id, ...followingIds];

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .not('id', 'in', `(${excludeIds.join(',')})`);

      if (error) {
        setLoading(false);
        return;
      }

      const randomFive = shuffle(profiles).slice(0, limit);
      setSuggestions(randomFive);
      setLoading(false);
    }

    fetchProfiles();
  }, [user, limit]);

  return { suggestions, loading };
}