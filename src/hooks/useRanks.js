// hooks/useRanks.js
// Fixed to match the REAL exercise_thresholds schema, confirmed from the
// live update_exercise_rank() trigger: exercise_thresholds(exercise_id,
// rank, min_1rm) -- normalized rows, NOT wide per-tier columns.
// Previous version incorrectly assumed columns like `crossfitter_min`
// that never existed.

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

    // normalized: one row per (exercise_id, rank) with its min_1rm
    const { data: thresholdRows, error: thresholdsError } = await supabase
      .from('exercise_thresholds')
      .select('exercise_id, rank, min_1rm')
      .in('exercise_id', exerciseIds);

    if (thresholdsError) {
      setLoading(false);
      return;
    }

    // group threshold rows by exercise_id, sorted ascending by min_1rm
    const thresholdsByExercise = {};
    for (const t of thresholdRows || []) {
      if (!thresholdsByExercise[t.exercise_id]) thresholdsByExercise[t.exercise_id] = [];
      thresholdsByExercise[t.exercise_id].push(t);
    }
    for (const exId in thresholdsByExercise) {
      thresholdsByExercise[exId].sort((a, b) => a.min_1rm - b.min_1rm);
    }

    const computed = records
      .filter((r) => thresholdsByExercise[r.exercise_id] && r.rank)
      .map((r) => {
        const sortedThresholds = thresholdsByExercise[r.exercise_id];
        const currentIndex = sortedThresholds.findIndex((t) => t.rank === r.rank);
        const nextThreshold = sortedThresholds[currentIndex + 1] || null;
        const currentThreshold = sortedThresholds[currentIndex] || { min_1rm: 0 };

        const base = currentThreshold.min_1rm;
        const nextTierWeight = nextThreshold ? nextThreshold.min_1rm : null;

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
          nextTierKey: nextThreshold ? nextThreshold.rank : null,
          nextTierWeight,
          progress,
        };
      });

    setRanks(computed);
    setLoading(false);
  }

  return { ranks, loading };
}