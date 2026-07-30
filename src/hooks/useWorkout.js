import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export function useWorkout() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    async function fetchWorkouts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('workouts')
        .select('*, workout_sets(*, exercises(name, images))')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setWorkouts(data);
      }
      setLoading(false);
    }

    fetchWorkouts();
  }, [user]);

  return { workouts, loading, error };
}