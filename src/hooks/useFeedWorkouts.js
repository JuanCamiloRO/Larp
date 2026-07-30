// hooks/useFeedWorkouts.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useFeedWorkouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  async function fetchFeed() {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: follows, error: followError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followError) {
      setError(followError.message);
      setLoading(false);
      return;
    }

    const feedUserIds = [...follows.map(f => f.following_id), user.id];

    const { data, error: workoutsError } = await supabase
      .from('workouts')
      .select(`
        *,
        profiles(username, avatar_url),
        workout_sets(
          *,
          exercises(name, images)
        )
      `)
      .in('user_id', feedUserIds)
      .order('started_at', { ascending: false })
      .limit(30);

    if (workoutsError) {
      setError(workoutsError.message);
    } else {
      setWorkouts(data);
    }

    setLoading(false);
  }

  return { workouts, loading, error, refetch: fetchFeed };
}