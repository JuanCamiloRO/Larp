import { useState, useMemo } from 'react';
import { MEAL_TYPES } from '../hooks/useFoodLogs';

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

// Scales a per-100g nutriment field to the given grams. Returns null (not 0)
// when the source field is missing, so we never fabricate data OFF doesn't have.
function scale(perHundred, grams, roundTo = 1) {
  if (perHundred === null || perHundred === undefined) return null;
  const factor = Math.pow(10, roundTo);
  return Math.round(perHundred * (grams / 100) * factor) / factor;
}
export default function LogFoodModal({ food, defaultMeal, onConfirm, onCancel }) {
  const [grams, setGrams] = useState(100);
  const [mealType, setMealType] = useState(defaultMeal || 'breakfast');
  const [error, setError] = useState(null);

  // Recompute the full nutriment set live as the user adjusts serving size.
  // This is also exactly what gets persisted to food_logs on confirm, so the
  // daily nutrition view has real data instead of nulls.
  const scaledNutrients = useMemo(() => {
    return {
      calories: scale(food.calories_per_100g, grams, 0),
      protein: scale(food.protein_per_100g, grams, 1),
      carbs: scale(food.carbs_per_100g, grams, 1),
      fat: scale(food.fat_per_100g, grams, 1),
      fiber: scale(food.fiber_per_100g, grams, 1),
      sugar: scale(food.sugar_per_100g, grams, 1),
      saturated_fat: scale(food.saturated_fat_per_100g, grams, 1),
      sodium: scale(food.sodium_per_100g, grams, 3),
      salt: scale(food.salt_per_100g, grams, 2),
    };
  }, [grams, food]);

  function handleConfirm() {
    const gramsNum = Number(grams);
    if (!gramsNum || gramsNum <= 0) {
      setError('Must log at least 1 gram');
      return;
    }
    onConfirm(food, mealType, gramsNum, scaledNutrients);
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
          onChange={(e) => setGrams(e.target.value)}
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
          <span className="subtle">Calories: {scaledNutrients.calories ?? '—'}</span>
          <span className="subtle">Protein: {scaledNutrients.protein ?? '—'}g</span>
          <span className="subtle">Carbs: {scaledNutrients.carbs ?? '—'}g</span>
          <span className="subtle">Fat: {scaledNutrients.fat ?? '—'}g</span>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" onClick={handleConfirm}>Add to diary</button>
        </div>
      </div>
    </div>
  );
}