// hooks/useTopLifts.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useTopLifts(userId) {
  const [lifts, setLifts] = useState([]);
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchTopLifts();
  }, [userId]);

  async function fetchTopLifts() {
    setLoading(true);

    const { data: pins } = await supabase
      .from('pinned_lifts')
      .select('position, exercises(id, name), exercise_ranks!inner(best_1rm)')
      .eq('user_id', userId)
      .eq('exercise_ranks.user_id', userId)
      .order('position');

    if (pins && pins.length > 0) {
      setLifts(
        pins.map((p) => ({
          exercise_id: p.exercises.id,
          exercise_name: p.exercises.name,
          best_1rm: p.exercise_ranks.best_1rm,
        }))
      );
      setIsCustom(true);
    } else {
      const { data: auto } = await supabase
        .from('exercise_ranks')
        .select('best_1rm, exercises(id, name)')
        .eq('user_id', userId)
        .order('best_1rm', { ascending: false })
        .limit(5);

      setLifts(
        (auto || []).map((r) => ({
          exercise_id: r.exercises.id,
          exercise_name: r.exercises.name,
          best_1rm: r.best_1rm,
        }))
      );
      setIsCustom(false);
    }

    setLoading(false);
  }

  return { lifts, isCustom, loading, refetch: fetchTopLifts };
}