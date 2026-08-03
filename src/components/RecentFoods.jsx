// components/RecentFoods.jsx
// Shows the user's recently logged foods for one-tap re-adding. Since
// food_logs stores macros already scaled to the grams eaten, we convert
// back to a per-100g basis here so the food object can flow straight into
// the existing LogFoodModal (which expects per-100g fields) unchanged.

export default function RecentFoods({ recentFoods, loading, onSelectFood }) {
  if (loading) return null;
  if (recentFoods.length === 0) return null;

  function toFoodObject(log) {
    const scale = 100 / log.grams;
    return {
      barcode: log.food_barcode,
      name: log.food_name,
      brand: null,
      image_url: null,
      calories_per_100g: log.calories != null ? log.calories * scale : null,
      protein_per_100g: log.protein != null ? log.protein * scale : null,
      carbs_per_100g: log.carbs != null ? log.carbs * scale : null,
      fat_per_100g: log.fat != null ? log.fat * scale : null,
    };
  }

  return (
    <div className="recent-foods">
      <span className="follow-name" style={{ display: 'block', marginBottom: '8px' }}>
        Recently logged
      </span>
      <div className="recent-foods-scroll">
        {recentFoods.map((log) => (
          <button
            key={log.food_barcode}
            className="recent-food-chip"
            onClick={() => onSelectFood(toFoodObject(log))}
          >
            <span className="recent-food-name">{log.food_name}</span>
            <span className="subtle recent-food-cals">{Math.round(log.calories)} kcal</span>
          </button>
        ))}
      </div>
    </div>
  );
}