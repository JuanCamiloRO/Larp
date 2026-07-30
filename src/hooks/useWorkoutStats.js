import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';

export function useWorkoutStats() {
  const { user } = useAuth();
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      setLoading(true);

      const { data, error } = await supabase
        .from('workouts')
        .select('id, started_at, ended_at, workout_sets(reps, weight)')
        .eq('user_id', user.id)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: true });

      if (error) {
        setLoading(false);
        return;
      }

      const shaped = data.map((w) => {
        const sets = w.workout_sets || [];
        const volumen = sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
        const totalReps = sets.reduce((sum, s) => sum + (s.reps || 0), 0);
        const setCount = sets.length;
        const start = new Date(w.started_at);
        const end = new Date(w.ended_at);
        const duracion = Math.round((end - start) / 60000);

        return {
          fechaISO: w.started_at,
          fecha: start.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          duracion,
          volumen,
          reps: totalReps,
          sets: setCount,
        };
      });

      setDatos(shaped);
      setLoading(false);
    }

    fetchStats();
  }, [user]);

  return { datos, loading };
}