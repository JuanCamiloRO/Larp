// hooks/useMuscleHeatmap.js
import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import { mapMusclesToBodyParts } from '../lib/muscleMap';
import { aggregateMuscleSets } from '../lib/muscleStats';

export function useMuscleHeatmap(days = 7) {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [muscleTotals, setMuscleTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchHeatmapData();
  }, [user, days]);

  async function fetchHeatmapData() {
    setLoading(true);
    setError(null);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data: sets, error: fetchError } = await supabase
      .from('workout_sets')
      .select(`
        id,
        exercises(name, primary_muscles, secondary_muscles),
        workouts!inner(user_id, started_at)
      `)
      .eq('workouts.user_id', user.id)
      .gte('workouts.started_at', since.toISOString());

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const primaryData = [];
    const secondaryMuscleSet = new Set();
    const statEntries = [];

    (sets || []).forEach((s) => {
      if (!s.exercises) return;

      const rawPrimary = s.exercises.primary_muscles || [];
      const rawSecondary = s.exercises.secondary_muscles || [];

      statEntries.push({ primaryMuscles: rawPrimary, secondaryMuscles: rawSecondary, count: 1 });

      const primary = mapMusclesToBodyParts(rawPrimary);
      const secondary = mapMusclesToBodyParts(rawSecondary);

      if (primary.length > 0) {
        primaryData.push({ name: s.exercises.name, muscles: primary });
      }

      secondary.forEach((m) => {
        if (!primary.includes(m)) secondaryMuscleSet.add(m);
      });
    });

    const secondaryData = Array.from(secondaryMuscleSet).map((muscle) => ({
      name: 'Secondary',
      muscles: [muscle],
    }));

    setData([...secondaryData, ...primaryData]);
    setMuscleTotals(aggregateMuscleSets(statEntries));
    setLoading(false);
  }

  return { data, muscleTotals, loading, error, refetch: fetchHeatmapData };
}