const CALORIES_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

// Resolves a macro's target in grams regardless of how it was set.
export function resolveMacroGoalGrams(macro, { mode, value, calorieGoal }) {
  if (value == null) return null;
  if (mode === 'percent') {
    const macroCalories = (value / 100) * calorieGoal;
    return macroCalories / CALORIES_PER_GRAM[macro];
  }
  return value; // already grams
}

export function macroGoalsInGrams({ macro_goal_mode, protein_goal, carbs_goal, fat_goal, calorieGoal }) {
  return {
    protein: resolveMacroGoalGrams('protein', { mode: macro_goal_mode, value: protein_goal, calorieGoal }),
    carbs: resolveMacroGoalGrams('carbs', { mode: macro_goal_mode, value: carbs_goal, calorieGoal }),
    fat: resolveMacroGoalGrams('fat', { mode: macro_goal_mode, value: fat_goal, calorieGoal }),
  };
}