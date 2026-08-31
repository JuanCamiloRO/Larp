// components/MealStats.jsx
const NUTRIENT_FIELDS = [
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'carbs', label: 'Carbs', unit: 'g' },
  { key: 'fat', label: 'Fat', unit: 'g' },
  { key: 'fiber', label: 'Fiber', unit: 'g' },
  { key: 'sugar', label: 'Sugar', unit: 'g' },
  { key: 'saturated_fat', label: 'Saturated Fat', unit: 'g' },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
  { key: 'salt', label: 'Salt', unit: 'g' },
];

const round = (n) => Math.round(n * 10) / 10;

function sumMealNutrients(mealLogs = []) {
  return mealLogs.reduce(
    (totals, log) => {
      totals.calories += log.calories || 0;
      totals.protein += log.protein || 0;
      totals.carbs += log.carbs || 0;
      totals.fat += log.fat || 0;
      totals.fiber += log.fiber || 0;
      totals.sugar += log.sugar || 0;
      totals.saturated_fat += log.saturated_fat || 0;
      totals.sodium += log.sodium || 0;
      totals.salt += log.salt || 0;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, saturated_fat: 0, sodium: 0, salt: 0 }
  );
}

export default function MealStats({ logsByMeal, selectedMeal, mealLabel, onClose }) {
  if (!selectedMeal) return null;

  const mealLogs = logsByMeal[selectedMeal] || [];
  const totals = sumMealNutrients(mealLogs);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mealLabel}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {mealLogs.length === 0 ? (
          <p className="subtle">No foods logged for this meal.</p>
        ) : (
          <>
            <p className="meal-stats-calories">{round(totals.calories)} kcal</p>
            <ul className="meal-stats-list">
              {NUTRIENT_FIELDS.map(({ key, label, unit }) => (
                <li key={key}>
                  <span>{label}</span>
                  <span>{round(totals[key])}{unit}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}