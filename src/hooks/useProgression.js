import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './useAuth';
import { resolveIncrement, resolveRepRange, suggestProgression } from '../progression';

const SESSION_HISTORY_LIMIT = 10; // enough for stall detection, cheap to fetch

export function useProgression(exerciseId) {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState(null);
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id || !exerciseId) return;

    setLoading(true);
    setError('');

    try {
      // Step 1: exercise's progression category (compound_lower / compound_upper /
      // isolation) — used only as a fallback increment if the user hasn't set one.
      const { data: exercise, error: exerciseError } = await supabase
        .from('exercises')
        .select('id, progression_category')
        .eq('id', exerciseId)
        .single();
      if (exerciseError) throw exerciseError;

      // Step 2: user's saved prefs for this specific exercise, if any.
      const { data: userPrefs, error: prefsError } = await supabase
        .from('exercise_progression_prefs')
        .select('rep_min, rep_max, increment')
        .eq('user_id', user.id)
        .eq('exercise_id', exerciseId)
        .maybeSingle();
      if (prefsError) throw prefsError;

      // Step 3: account-level training goal, only needed if there are no
      // per-exercise rep-range prefs yet (goal picks the default range).
      let trainingGoal = null;
      if (!userPrefs) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('training_goal')
          .eq('id', user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        trainingGoal = profile?.training_goal ?? null;
      }

      const increment = resolveIncrement({
        userIncrement: userPrefs?.increment,
        category: exercise?.progression_category,
      });
      const { repMin, repMax } = resolveRepRange({
        userRepMin: userPrefs?.rep_min,
        userRepMax: userPrefs?.rep_max,
        goal: trainingGoal,
      });

      setPrefs({ repMin, repMax, increment });

      // Step 4: recent completed sets for this exercise, most recent workout
      // first. We only need workouts that were actually finished
      // (ended_at not null) — an in-progress workout isn't a real data
      // point for "did they hit the top of the range."
      const { data: sets, error: setsError } = await supabase
        .from('workout_sets')
        .select('reps, weight, set_number, workout_id, workouts!inner(ended_at, user_id)')
        .eq('exercise_id', exerciseId)
        .eq('workouts.user_id', user.id)
        .not('workouts.ended_at', 'is', null)
        .order('ended_at', { ascending: false, foreignTable: 'workouts' })
        .limit(SESSION_HISTORY_LIMIT * 6); // generous cap; grouped down to sessions below
      if (setsError) throw setsError;

      // Step 5: group flat set rows into one "session" per workout_id, each
      // shaped as { weight, reps: number[] } — the shape suggestProgression
      // expects. Sets within a session are sorted by set_number so reps[]
      // reads in the order they were performed.
      const byWorkout = new Map();
      for (const set of sets || []) {
        if (!byWorkout.has(set.workout_id)) {
          byWorkout.set(set.workout_id, { endedAt: set.workouts.ended_at, setsByNumber: [] });
        }
        byWorkout.get(set.workout_id).setsByNumber.push(set);
      }

      const sessions = Array.from(byWorkout.values())
        .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
        .slice(0, SESSION_HISTORY_LIMIT)
        .map((session) => ({
          sets: session.setsByNumber
            .sort((a, b) => a.set_number - b.set_number)
            .map((set) => ({ weight: set.weight, reps: set.reps })),
        }));

      // Step 6: run the pure logic function against the shaped history.
      setSuggestion(suggestProgression(sessions, { repMin, repMax, increment }));
    } catch (loadError) {
      console.error('Failed to load progression suggestion:', loadError);
      setError('Could not load a progression suggestion.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, exerciseId]);

  useEffect(() => {
    load();
  }, [load]);

  // Lets the UI (a settings sheet on the exercise card, say) override rep
  // range / increment for just this exercise going forward.
  async function savePrefs({ repMin, repMax, increment }) {
    if (!user?.id || !exerciseId) return { error: 'Not signed in.' };

    const { error: saveError } = await supabase
      .from('exercise_progression_prefs')
      .upsert(
        {
          user_id: user.id,
          exercise_id: exerciseId,
          rep_min: repMin,
          rep_max: repMax,
          increment,
          updated_at: new Date(),
        },
        { onConflict: 'user_id,exercise_id' }
      );

    if (saveError) {
      console.error('Failed to save progression prefs:', saveError);
      return { error: 'Could not save your preference.' };
    }

    await load(); // recompute suggestion with the new prefs
    return { error: null };
  }

  return { suggestion, prefs, loading, error, savePrefs, reload: load };
}