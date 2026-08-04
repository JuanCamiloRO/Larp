// hooks/useMuscleRanks.js
// After computing individual muscle ranks (unchanged logic), folds
// grouped muscles (see lib/muscleGroups.js) into combined rows: e.g.
// lats + middle back + traps -> one "Back" row. Group avg_rank_index is
// a simple average across the group's muscles (not re-weighted by sets
// across the whole group) -- see caveat in conversation if this needs
// to become set-weighted later. Ungrouped muscles pass through unchanged.

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TIER_ORDER, TIERS } from '../lib/rankTiers';
import { MUSCLE_GROUPS, MUSCLE_TO_GROUP } from '../lib/muscleGroups';

function indexToRank(i) {
  return TIER_ORDER[Math.max(0, Math.min(TIER_ORDER.length - 1, Math.round(i)))];
}

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

    const exerciseIds = (exerciseData || []).map((e) => e.exercise_id);

    const { data: thresholdRows, error: thresholdsError } = await supabase
      .from('exercise_thresholds')
      .select('exercise_id, rank, min_1rm')
      .in('exercise_id', exerciseIds);

    if (thresholdsError) {
      setLoading(false);
      return;
    }

    const thresholdsByExercise = {};
    for (const t of thresholdRows || []) {
      if (!thresholdsByExercise[t.exercise_id]) thresholdsByExercise[t.exercise_id] = [];
      thresholdsByExercise[t.exercise_id].push(t);
    }
    for (const exId in thresholdsByExercise) {
      thresholdsByExercise[exId].sort((a, b) => a.min_1rm - b.min_1rm);
    }

    function buildExerciseEntry(e) {
      const sortedThresholds = thresholdsByExercise[e.exercise_id] || [];
      const currentThresholdIndex = sortedThresholds.findIndex((t) => t.rank === e.rank);
      const currentThreshold = sortedThresholds[currentThresholdIndex] || { min_1rm: 0 };
      const nextThreshold = sortedThresholds[currentThresholdIndex + 1] || null;

      let exProgress = 100;
      if (nextThreshold) {
        exProgress = ((e.best_1rm - currentThreshold.min_1rm) /
          (nextThreshold.min_1rm - currentThreshold.min_1rm)) * 100;
        exProgress = Math.max(0, Math.min(100, exProgress));
      }

      const kgToNext = nextThreshold
        ? Math.max(0, Math.round((nextThreshold.min_1rm - e.best_1rm) * 10) / 10)
        : null;

      return {
        exerciseId: e.exercise_id,
        name: e.exercises.name,
        rank: e.rank,
        nextRank: nextThreshold ? nextThreshold.rank : null,
        nextThresholdWeight: nextThreshold ? nextThreshold.min_1rm : null,
        kgToNext,
        best1RM: e.best_1rm,
        progress: exProgress,
      };
    }

    function buildMuscleRow(m) {
      const currentIndex = TIER_ORDER.indexOf(m.rank);
      const nextTierKey = TIER_ORDER[currentIndex + 1] || null;
      const progress = nextTierKey
        ? Math.max(0, Math.min(100, (m.avg_rank_index - currentIndex) * 100))
        : 100;

      const exercisesForMuscle = (exerciseData || [])
        .filter((e) => e.exercises?.primary_muscles?.includes(m.muscle))
        .map(buildExerciseEntry)
        .sort((a, b) => b.best1RM - a.best1RM);

      return {
        muscle: m.muscle,
        avgRankIndex: m.avg_rank_index,
        currentTierKey: m.rank,
        nextTierKey,
        progress,
        exercises: exercisesForMuscle,
      };
    }

    const ungrouped = [];
    const groupBuckets = {};

    for (const m of muscleData) {
      const group = MUSCLE_TO_GROUP[m.muscle];
      if (!group) {
        ungrouped.push(buildMuscleRow(m));
        continue;
      }
      if (!groupBuckets[group.key]) groupBuckets[group.key] = [];
      groupBuckets[group.key].push(m);
    }

    const groupedRows = MUSCLE_GROUPS
  .filter((group) => groupBuckets[group.key]?.length > 0)
  .map((group) => {
    const members = groupBuckets[group.key];
    const avgIndex = members.reduce((sum, m) => sum + m.avg_rank_index, 0) / members.length;
    const rank = indexToRank(avgIndex);
    const currentIndex = TIER_ORDER.indexOf(rank);
    const nextTierKey = TIER_ORDER[currentIndex + 1] || null;
    const progress = nextTierKey
      ? Math.max(0, Math.min(100, (avgIndex - currentIndex) * 100))
      : 100;

    const exercisesForGroup = (exerciseData || [])
      .filter((e) =>
        e.exercises?.primary_muscles?.some((pm) => group.muscles.includes(pm))
      )
      .map(buildExerciseEntry)
      .sort((a, b) => b.best1RM - a.best1RM);

    // NEW: per-muscle breakdown within this group, sorted to match the
    // group's declared muscle order (e.g. Arms -> Triceps, Biceps, Forearms).
    const subMuscles = group.muscles
      .map((muscleKey) => members.find((m) => m.muscle === muscleKey))
      .filter(Boolean)
      .map(buildMuscleRow);

    return {
      muscle: group.key,
      isGroup: true,
      groupLabel: group.label,
      groupIcon: group.icon,
      avgRankIndex: avgIndex,
      currentTierKey: rank,
      nextTierKey,
      progress,
      exercises: exercisesForGroup,
      subMuscles, // NEW
    };
  });

    setMuscleRanks([...groupedRows, ...ungrouped]);
    setLoading(false);
  }

  return { muscleRanks, loading, refetch: fetchMuscleRanks };
}