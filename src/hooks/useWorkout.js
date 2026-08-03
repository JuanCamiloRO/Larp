// hooks/useWorkout.js
// Fetches a user's workouts with nested sets/exercises. Accepts an optional
// userId -- when omitted, defaults to the currently authenticated user
// (preserving useWorkout() as used on Dashboard); when passed, fetches that
// user's workouts instead (used by PublicProfile).

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export function useWorkout(userId) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!targetUserId) return;

    async function fetchWorkouts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_sets(*, exercises(name, images))')
        .eq('user_id', targetUserId)
        .order('started_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setWorkouts(data);
      }
      setLoading(false);
    }

    fetchWorkouts();
  }, [targetUserId]);

  return { workouts, loading, error };
}