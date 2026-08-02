// hooks/useRanks.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TIER_ORDER } from '../lib/rankTiers';

export function useRanks(userId) {
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchRanks();
  }, [userId]);

  async function fetchRanks() {
    setLoading(true);

    const { data: records, error: recordsError } = await supabase
      .from('exercise_ranks')
      .select('rank, best_1rm, exercise_id, exercises(name)')
      .eq('user_id', userId);

    if (recordsError || !records) {
      setLoading(false);
      return;
    }

    const exerciseIds = records.map((r) => r.exercise_id);

    const { data: thresholds, error: thresholdsError } = await supabase
      .from('exercise_thresholds')
      .select('exercise_id, larpy_min, master_larp_min')
      .in('exercise_id', exerciseIds);

    if (thresholdsError) {
      setLoading(false);
      return;
    }

    const thresholdsMap = Object.fromEntries(
      (thresholds || []).map((t) => [t.exercise_id, t])
    );

    const computed = records
      .filter((r) => thresholdsMap[r.exercise_id] && r.rank)
      .map((r) => {
        const { larpy_min, master_larp_min } = thresholdsMap[r.exercise_id];
        const currentIndex = TIER_ORDER.indexOf(r.rank);
        const nextTierKey = TIER_ORDER[currentIndex + 1] || null;

        let base = 0;
        let nextTierWeight = larpy_min;

        if (r.rank === 'larpy') {
          base = larpy_min;
          nextTierWeight = master_larp_min;
        } else if (r.rank === 'master_larp') {
          nextTierWeight = null;
        }

        let progress = 100;
        if (nextTierWeight !== null) {
          progress = ((r.best_1rm - base) / (nextTierWeight - base)) * 100;
          progress = Math.max(0, Math.min(100, progress));
        }

        return {
          exercise_id: r.exercise_id,
          exercise_name: r.exercises.name,
          best_1rm: r.best_1rm,
          currentTierKey: r.rank,
          nextTierKey,
          nextTierWeight,
          progress,
        };
      });

    setRanks(computed);
    setLoading(false);
  }

  return { ranks, loading };
}