// hooks/useMuscleRanks.js
// Reads saved ranks and calculates display progress.
//
// best_score is the historical normalized score saved when the best set was
// performed. It must be used for rank progress so changing profile weight does
// not recalculate an old performance with today's bodyweight.
//
// exercise_thresholds now stores TWO ladders per exercise (gender = 'male'
// and gender = 'female'), each with its own min_score cutoffs. This hook
// must filter to the user's gender when fetching thresholds, otherwise the
// two ladders get interleaved when sorted by min_score and "next tier"
// math (progress %, target e1RM) comes out wrong even though current rank
// (read straight from exercise_ranks.rank) still looks fine.
//
// Call with: useMuscleRanks(userId, currentBodyweightKg, userGender)


import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { TIER_ORDER } from '../lib/rankTiers';
import { MUSCLE_GROUPS, MUSCLE_TO_GROUP } from '../lib/muscleGroups';


const BODYWEIGHT_E1RM_EXPONENT = 0.67;


function indexToRank(index) {
  return TIER_ORDER[
    Math.max(0, Math.min(TIER_ORDER.length - 1, Math.round(index)))
  ];
}


function scoreToE1RM(score, bodyweightKg) {
  const scoreNumber = Number(score);
  const bodyweightNumber = Number(bodyweightKg);


  if (!Number.isFinite(scoreNumber) || scoreNumber < 0) return null;
  if (!Number.isFinite(bodyweightNumber) || bodyweightNumber <= 0) return null;


  return scoreNumber * Math.pow(bodyweightNumber, BODYWEIGHT_E1RM_EXPONENT);
}


function e1RMToScore(e1RM, bodyweightKg) {
  const e1RMNumber = Number(e1RM);
  const bodyweightNumber = Number(bodyweightKg);


  if (!Number.isFinite(e1RMNumber)) return null;
  if (!Number.isFinite(bodyweightNumber) || bodyweightNumber <= 0) return null;


  return e1RMNumber / Math.pow(bodyweightNumber, BODYWEIGHT_E1RM_EXPONENT);
}


export function useMuscleRanks(userId, currentBodyweightKg = null, userGender = null) {
  const [muscleRanks, setMuscleRanks] = useState([]);
  const [loading, setLoading] = useState(true);


  const fetchMuscleRanks = useCallback(async () => {
    if (!userId) {
      setMuscleRanks([]);
      setLoading(false);
      return;
    }


    setLoading(true);


    const { data: muscleData, error: muscleError } = await supabase
      .from('muscle_ranks')
      .select('muscle, avg_rank_index, rank')
      .eq('user_id', userId)
      .order('muscle', { ascending: true });


    if (muscleError || !muscleData) {
      setMuscleRanks([]);
      setLoading(false);
      return;
    }


    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercise_ranks')
      .select('exercise_id, rank, best_1rm, best_score, exercises(name, primary_muscles)')
      .eq('user_id', userId);


    if (exerciseError) {
      console.error('Failed to load exercise ranks:', exerciseError);
      setMuscleRanks([]);
      setLoading(false);
      return;
    }


    const exerciseIds = (exerciseData || []).map(
      (exercise) => exercise.exercise_id
    );


    let thresholdRows = [];


    if (exerciseIds.length > 0 && userGender) {
      const { data, error: thresholdsError } = await supabase
        .from('exercise_thresholds')
        .select('exercise_id, rank, min_score')
        .eq('gender', userGender)
        .in('exercise_id', exerciseIds);


      if (thresholdsError) {
        console.error('Failed to load exercise thresholds:', thresholdsError);
        setMuscleRanks([]);
        setLoading(false);
        return;
      }


      thresholdRows = data || [];
    }


    const thresholdsByExercise = {};


    for (const threshold of thresholdRows) {
      if (!thresholdsByExercise[threshold.exercise_id]) {
        thresholdsByExercise[threshold.exercise_id] = [];
      }


      thresholdsByExercise[threshold.exercise_id].push(threshold);
    }


    for (const exerciseId of Object.keys(thresholdsByExercise)) {
      thresholdsByExercise[exerciseId].sort(
        (a, b) => Number(a.min_score) - Number(b.min_score)
      );
    }


    function buildExerciseEntry(exerciseRank) {
      const sortedThresholds =
        thresholdsByExercise[exerciseRank.exercise_id] || [];


      const currentThresholdIndex = sortedThresholds.findIndex(
        (threshold) => threshold.rank === exerciseRank.rank
      );


      const isUnranked = exerciseRank.rank === 'Unranked';
      const currentThreshold = isUnranked
        ? { min_score: 0 }
        : sortedThresholds[currentThresholdIndex] || { min_score: 0 };


      const nextThreshold = isUnranked
        ? sortedThresholds[0] || null
        : sortedThresholds[currentThresholdIndex + 1] || null;


      const best1RM = Number(exerciseRank.best_1rm) || 0;
      const savedBestScore = Number(exerciseRank.best_score);


      // Fallback supports old rows created before best_score was added. New
      // rows should always use the persisted historical best_score.
      const bestScore = Number.isFinite(savedBestScore)
        ? savedBestScore
        : e1RMToScore(best1RM, currentBodyweightKg);


      let progress = 0;


      if (nextThreshold && bestScore !== null) {
        const currentMinScore = Number(currentThreshold.min_score) || 0;
        const nextMinScore = Number(nextThreshold.min_score);
        const scoreRange = nextMinScore - currentMinScore;


        progress = scoreRange > 0
          ? ((bestScore - currentMinScore) / scoreRange) * 100
          : 0;


        progress = Math.max(0, Math.min(100, progress));
      } else if (!nextThreshold) {
        progress = 100;
      }


      // This is a readable target expressed as e1RM at the user's current
      // bodyweight. It does not alter the historical saved best_score.
      const nextTargetE1RM = nextThreshold
        ? scoreToE1RM(nextThreshold.min_score, currentBodyweightKg)
        : null;


      const e1RMToNext = nextTargetE1RM !== null
        ? Math.max(0, Math.round((nextTargetE1RM - best1RM) * 10) / 10)
        : null;


      return {
        exerciseId: exerciseRank.exercise_id,
        name: exerciseRank.exercises?.name || 'Unknown exercise',
        rank: exerciseRank.rank,
        nextRank: nextThreshold ? nextThreshold.rank : null,
        best1RM,
        bestScore,
        progress,
        nextTargetE1RM,
        e1RMToNext,
        nextThresholdWeight: nextTargetE1RM,
        kgToNext: e1RMToNext,
      };
    }


    function buildMuscleRow(muscleRank) {
      const currentIndex = TIER_ORDER.indexOf(muscleRank.rank);
      const safeCurrentIndex = currentIndex >= 0 ? currentIndex : -1;
      const nextTierKey = TIER_ORDER[safeCurrentIndex + 1] || null;
      const averageIndex = Number(muscleRank.avg_rank_index) || 0;
      const progress = nextTierKey
        ? Math.max(0, Math.min(100, (averageIndex - safeCurrentIndex) * 100))
        : 100;


      const exercisesForMuscle = (exerciseData || [])
        .filter((exercise) =>
          exercise.exercises?.primary_muscles?.includes(muscleRank.muscle)
        )
        .map(buildExerciseEntry)
        .sort((a, b) => b.bestScore - a.bestScore);


      return {
        muscle: muscleRank.muscle,
        avgRankIndex: averageIndex,
        currentTierKey: muscleRank.rank,
        nextTierKey,
        progress,
        exercises: exercisesForMuscle,
      };
    }


    const ungrouped = [];
    const groupBuckets = {};


    for (const muscleRank of muscleData) {
      const group = MUSCLE_TO_GROUP[muscleRank.muscle];


      if (!group) {
        ungrouped.push(buildMuscleRow(muscleRank));
        continue;
      }


      if (!groupBuckets[group.key]) groupBuckets[group.key] = [];
      groupBuckets[group.key].push(muscleRank);
    }


    const groupedRows = MUSCLE_GROUPS
      .filter((group) => groupBuckets[group.key]?.length > 0)
      .map((group) => {
        const members = groupBuckets[group.key];
        const averageIndex =
          members.reduce(
            (sum, member) => sum + Number(member.avg_rank_index || 0),
            0
          ) / members.length;
        const rank = indexToRank(averageIndex);
        const currentIndex = TIER_ORDER.indexOf(rank);
        const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
        const nextTierKey = TIER_ORDER[safeCurrentIndex + 1] || null;
        const progress = nextTierKey
          ? Math.max(
              0,
              Math.min(100, (averageIndex - safeCurrentIndex) * 100)
            )
          : 100;


        const exercisesForGroup = (exerciseData || [])
          .filter((exercise) =>
            exercise.exercises?.primary_muscles?.some((primaryMuscle) =>
              group.muscles.includes(primaryMuscle)
            )
          )
          .map(buildExerciseEntry)
          .sort((a, b) => b.bestScore - a.bestScore);


        const subMuscles = group.muscles
          .map((muscleKey) =>
            members.find((member) => member.muscle === muscleKey)
          )
          .filter(Boolean)
          .map(buildMuscleRow);


        return {
          muscle: group.key,
          isGroup: true,
          groupLabel: group.label,
          groupIcon: group.icon,
          avgRankIndex: averageIndex,
          currentTierKey: rank,
          nextTierKey,
          progress,
          exercises: exercisesForGroup,
          subMuscles,
        };
      });


    setMuscleRanks([...groupedRows, ...ungrouped]);
    setLoading(false);
  }, [currentBodyweightKg, userId, userGender]);


  useEffect(() => {
    fetchMuscleRanks();
  }, [fetchMuscleRanks]);


  return {
    muscleRanks,
    loading,
    refetch: fetchMuscleRanks,
  };
}