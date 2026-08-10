// components/LogFoodModal.jsx
// Appears after a food is selected from search. Lets the user set a serving
// size (grams) and pick which meal to log it under, showing a live macro
// preview scaled to that serving before confirming with onConfirm.

import { useState, useMemo } from 'react';
import { MEAL_TYPES } from '../hooks/useFoodLogs';

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

export default function LogFoodModal({ food, defaultMeal, onConfirm, onCancel }) {
  const [grams, setGrams] = useState(100);
  const [mealType, setMealType] = useState(defaultMeal || 'breakfast');
  const [error, setError] = useState(null);

  // Recompute macros live as the user adjusts serving size
  const scaledMacros = useMemo(() => {
    const scale = grams / 100;
    return {
      calories: food.calories_per_100g != null ? Math.round(food.calories_per_100g * scale) : null,
      protein: food.protein_per_100g != null ? Math.round(food.protein_per_100g * scale * 10) / 10 : null,
      carbs: food.carbs_per_100g != null ? Math.round(food.carbs_per_100g * scale * 10) / 10 : null,
      fat: food.fat_per_100g != null ? Math.round(food.fat_per_100g * scale * 10) / 10 : null,
    };
  }, [grams, food]);

  function handleConfirm() {
    if (grams <= 0) { setError('Must log at least 1 gram'); return;};
    onConfirm(food, mealType, grams);
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          {food.image_url && <img src={food.image_url} alt={food.name} className="modal-food-thumb" />}
          <div>
            <h3 style={{ color: 'white', margin: 0 }}>{food.name}</h3>
            {food.brand && <span className="subtle">{food.brand}</span>}
          </div>
        </div>

        <label className="modal-label">Serving size (grams)</label>
        <input
          type="number"
          className="food-search-input"
          value={grams}
          onChange={(e) => setGrams((e.target.value))}
        />
        <span style={{ color: 'red' }} className="subtle">{error}</span>

        <label className="modal-label" style={{ marginTop: '14px' }}>Meal</label>
        <div className="meal-selector">
          {MEAL_TYPES.map((meal) => (
            <button
              key={meal}
              className={`meal-selector-btn ${mealType === meal ? 'active' : ''}`}
              onClick={() => setMealType(meal)}
            >
              {MEAL_LABELS[meal]}
            </button>
          ))}
        </div>

        <div className="modal-macro-preview">
          <span className="subtle">Calories: {scaledMacros.calories ?? '—'}</span>
          <span className="subtle">Protein: {scaledMacros.protein ?? '—'}g</span>
          <span className="subtle">Carbs: {scaledMacros.carbs ?? '—'}g</span>
          <span className="subtle">Fat: {scaledMacros.fat ?? '—'}g</span>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm}>Add to diary</button>
        </div>
      </div>
    </div>
  );
}