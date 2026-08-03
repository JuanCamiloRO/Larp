// hooks/useRecentFoods.js
// Fetches the user's most recently logged foods (deduplicated by barcode),
// optionally scoped to a specific meal type -- matching MyFitnessPal's
// behavior where "recent breakfast" and "recent dinner" are separate lists,
// since what you eat for breakfast rarely overlaps with dinner.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

const RECENT_LIMIT = 10;

export function useRecentFoods(userId, refreshKey, mealType = null) {
  const [recentFoods, setRecentFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    let query = supabase
      .from('food_logs')
      .select('food_barcode, food_name, grams, calories, protein, carbs, fat, created_at, meal_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (mealType) {
      query = query.eq('meal_type', mealType);
    }

    const { data, error } = await query;

    if (!error && data) {
      const seen = new Set();
      const deduped = [];
      for (const log of data) {
        if (!log.food_barcode || seen.has(log.food_barcode)) continue;
        seen.add(log.food_barcode);
        deduped.push(log);
        if (deduped.length >= RECENT_LIMIT) break;
      }
      setRecentFoods(deduped);
    }
    setLoading(false);
  }, [userId, mealType]);

  useEffect(() => {
    fetchRecent();
  }, [fetchRecent, refreshKey]);

  return { recentFoods, loading, refetchRecent: fetchRecent };
}