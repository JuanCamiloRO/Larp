// hooks/useMuscleRanks.js
// Fetches muscle_ranks plus, for each muscle, the individual
// exercise_ranks rows that feed into it (exercises whose primary_muscles
// contains that muscle) -- so expanding a muscle row to show per-exercise
// ranks doesn't need a second round-trip on click.

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TIER_ORDER } from '../lib/rankTiers';

export function useMuscleRanks(userId) {
  const [muscleRanks, setMuscleRanks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchMuscleRanks();
  }, [userId]);

  async function fetchMuscleRanks() {
    setLoading(true);

    const { data: muscleData, error: muscleError } = await supabase
      .from('muscle_ranks')
      .select('muscle, avg_rank_index, rank')
      .eq('user_id', userId)
      .order('muscle', { ascending: true });

    if (muscleError || !muscleData) {
      setLoading(false);
      return;
    }

    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercise_ranks')
      .select('exercise_id, rank, best_1rm, exercises(name, primary_muscles)')
      .eq('user_id', userId);

    if (exerciseError) {
      setLoading(false);
      return;
    }

    const computed = muscleData.map((m) => {
      const currentIndex = TIER_ORDER.indexOf(m.rank);
      const nextTierKey = TIER_ORDER[currentIndex + 1] || null;
      const progress = nextTierKey
        ? Math.max(0, Math.min(100, (m.avg_rank_index - currentIndex) * 100))
        : 100;

      const exercisesForMuscle = (exerciseData || [])
        .filter((e) => e.exercises?.primary_muscles?.includes(m.muscle))
        .map((e) => ({
          exerciseId: e.exercise_id,
          name: e.exercises.name,
          rank: e.rank,
          best1RM: e.best_1rm,
        }))
        .sort((a, b) => b.best1RM - a.best1RM);

      return {
        muscle: m.muscle,
        avgRankIndex: m.avg_rank_index,
        currentTierKey: m.rank,
        nextTierKey,
        progress,
        exercises: exercisesForMuscle,
      };
    });

    setMuscleRanks(computed);
    setLoading(false);
  }

  return { muscleRanks, loading, refetch: fetchMuscleRanks };
}