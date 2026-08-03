// hooks/useCalorieGoal.js
// Reads and updates the user's daily calorie goal, stored on 'profiles'.
// Kept separate from useFoodLogs since the goal is a user setting, not a
// per-day log -- it doesn't change when you navigate between diary dates.

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

export function useCalorieGoal(userId) {
  const [goal, setGoal] = useState(2000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchGoal();
  }, [userId]);

  async function fetchGoal() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('daily_calorie_goal')
      .eq('id', userId)
      .single();

    if (!error && data?.daily_calorie_goal) {
      setGoal(data.daily_calorie_goal);
    }
    setLoading(false);
  }

  async function updateGoal(newGoal) {
    if (newGoal <= 0) return { error: 'Goal must be positive' };

    setGoal(newGoal); // optimistic update
    const { error } = await supabase
      .from('profiles')
      .update({ daily_calorie_goal: newGoal })
      .eq('id', userId);

    if (error) fetchGoal(); // revert on failure
    return { error };
  }

  return { goal, loading, updateGoal };
}