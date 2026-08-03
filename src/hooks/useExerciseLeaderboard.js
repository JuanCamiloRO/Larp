import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
const LEADERBOARD_LIMIT = 50;

export function useExerciseLeaderboard(exerciseId, friendUserIds = null) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!exerciseId) return;

    // In friends mode with zero friends, skip the query entirely --
    // an empty .in() array would otherwise be sent as a malformed filter.
    if (friendUserIds && friendUserIds.length === 0) {
      setLeaderboard([]);
      setLoading(false);
      return;
    }

    fetchLeaderboard();

    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('exercise_ranks')
        .select('user_id, best_1rm, profiles(username, avatar_url)')
        .eq('exercise_id', exerciseId)
        .order('best_1rm', { ascending: false })
        .limit(LEADERBOARD_LIMIT);

      if (friendUserIds) {
        query = query.in('user_id', friendUserIds);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setLeaderboard(data || []);
      }
      setLoading(false);
    }
  }, [exerciseId, friendUserIds]);

  return { leaderboard, loading, error };
}