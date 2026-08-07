// hooks/useFoodLogs.js
// Manages a single day's food diary: fetching logged entries grouped by
// meal, adding a new entry (with macros pre-computed for the serving size),
// and deleting an entry. Macros are snapshotted at log time so edits to a
// food's base data later don't retroactively change past diary entries.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];

export function useFoodLogs(userId, dateStr) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!userId || !dateStr) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('food_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', dateStr)
      .order('created_at', { ascending: true });

    if (!error) setLogs(data || []);
    setLoading(false);
  }, [userId, dateStr]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Inserts an already-computed food_logs entry (user_id/log_date are
  // filled in here) and updates local state on success. Shared by both
  // addLog (per-100g foods scaled by grams) and any caller that already
  // has absolute macro totals to save, like a multi-item meal scan.
  async function addLogEntry(entry) {
    const fullEntry = { user_id: userId, log_date: dateStr, ...entry };

    const { data, error } = await supabase
      .from('food_logs')
      .insert(fullEntry)
      .select()
      .single();

    if (!error && data) {
      setLogs((prev) => [...prev, data]);
    }
    return { data, error };
  }

  // Adds a food to the diary. `food` is a row from the 'foods' table
  // (per-100g macros); `grams` is how much was actually eaten; macros
  // are scaled and stored as a snapshot on the log row itself.
  async function addLog(food, mealType, grams) {
    const scale = grams / 100;

    return addLogEntry({
      food_barcode: food.barcode,
      food_name: food.name,
      meal_type: mealType,
      grams,
      calories: food.calories_per_100g != null ? food.calories_per_100g * scale : null,
      protein: food.protein_per_100g != null ? food.protein_per_100g * scale : null,
      carbs: food.carbs_per_100g != null ? food.carbs_per_100g * scale : null,
      fat: food.fat_per_100g != null ? food.fat_per_100g * scale : null,
    });
  }

  async function deleteLog(logId) {
    setLogs((prev) => prev.filter((l) => l.id !== logId)); // optimistic
    const { error } = await supabase.from('food_logs').delete().eq('id', logId);
    if (error) fetchLogs(); // revert on failure by refetching real state
  }

  // Groups the flat log list into { breakfast: [...], lunch: [...], ... }
  const logsByMeal = MEAL_TYPES.reduce((acc, meal) => {
    acc[meal] = logs.filter((l) => l.meal_type === meal);
    return acc;
  }, {});

  // Running daily totals across all meals
  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories || 0),
      protein: acc.protein + (l.protein || 0),
      carbs: acc.carbs + (l.carbs || 0),
      fat: acc.fat + (l.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return { logs, logsByMeal, totals, loading, addLog, addLogEntry, deleteLog, refetch: fetchLogs };
}

export { MEAL_TYPES };