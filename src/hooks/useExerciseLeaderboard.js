// hooks/useExerciseLeaderboard.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useExerciseLeaderboard(exerciseId) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!exerciseId) return;
    fetchLeaderboard();
  }, [exerciseId]);

  async function fetchLeaderboard() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('exercise_ranks')
      .select('user_id, best_1rm, rank, profiles(username, avatar_url)')
      .eq('exercise_id', exerciseId)
      .order('best_1rm', { ascending: false })
      .limit(50);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setLeaderboard(data || []);
    }
    setLoading(false);
  }

  return { leaderboard, loading, error, refetch: fetchLeaderboard };
}