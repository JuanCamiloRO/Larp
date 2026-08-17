// hooks/useCalorieGoal.js
// Reads and updates the user's daily calorie goal and macro goals, stored
// on 'profiles'. Macro goals are always stored in grams; when the calorie
// goal changes, existing macro grams are scaled proportionally so a macro
// set as "30% of calories" stays ~30% after the calorie goal moves.

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const DEFAULT_MACROS = { protein_goal: null, carbs_goal: null, fat_goal: null };

export function useCalorieGoal(userId) {
  const [goal, setGoal] = useState(2000);
  const [macros, setMacros] = useState(DEFAULT_MACROS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchGoal();
  }, [userId]);

  async function fetchGoal() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('daily_calorie_goal, protein_goal, carbs_goal, fat_goal')
      .eq('id', userId)
      .single();

    if (!error && data) {
      if (data.daily_calorie_goal) setGoal(data.daily_calorie_goal);
      setMacros({
        protein_goal: data.protein_goal,
        carbs_goal: data.carbs_goal,
        fat_goal: data.fat_goal,
      });
    }
    setLoading(false);
  }

  async function updateGoal(newGoal) {
    if (newGoal <= 0) return { error: 'Goal must be positive' };

    const previousGoal = goal;
    const previousMacros = macros;
    const ratio = newGoal / previousGoal;

    // Scale any macro goals that are already set, so their share of
    // calories stays roughly constant when the calorie goal changes.
    const scaledMacros = {
      protein_goal: macros.protein_goal != null ? Math.round(macros.protein_goal * ratio) : null,
      carbs_goal: macros.carbs_goal != null ? Math.round(macros.carbs_goal * ratio) : null,
      fat_goal: macros.fat_goal != null ? Math.round(macros.fat_goal * ratio) : null,
    };

    setGoal(newGoal); // optimistic update
    setMacros(scaledMacros);

    const { error } = await supabase
      .from('profiles')
      .update({ daily_calorie_goal: newGoal, ...scaledMacros })
      .eq('id', userId);

    if (error) {
      fetchGoal(); // revert both goal and macros on failure
    }
    return { error };
  }

  async function updateMacroGoals(newMacros) {
    const previous = macros;
    setMacros(newMacros); // optimistic update

    const { error } = await supabase
      .from('profiles')
      .update({
        protein_goal: newMacros.protein_goal,
        carbs_goal: newMacros.carbs_goal,
        fat_goal: newMacros.fat_goal,
      })
      .eq('id', userId);

    if (error) setMacros(previous); // revert on failure
    return { error };
  }

  return { goal, loading, updateGoal, macros, updateMacroGoals };
}