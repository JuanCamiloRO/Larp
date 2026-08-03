// pages/Nutrition.jsx
// Main diary page, MyFitnessPal-style: date navigation at top, calorie ring
// + macro summary, recently logged foods for quick re-adding, then meal
// sections (Breakfast/Lunch/Dinner/Snacks) each listing logged foods with
// a delete option. Tapping "+ Add food" opens search, selecting a result
// opens LogFoodModal to set serving size before logging.

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFoodLogs, MEAL_TYPES } from '../hooks/useFoodLogs';
import { useCalorieGoal } from '../hooks/useCalorieGoal';
import { useRecentFoods } from '../hooks/useRecentFoods';
import FoodSearch from '../components/FoodSearch';
import LogFoodModal from '../components/LogFoodModal';
import CalorieRing from '../components/CalorieRing';
import CalorieGoalEditor from '../components/CalorieGoalEditor';
import RecentFoods from '../components/RecentFoods';

const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

function formatDateStr(date) {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(date) {
  const today = new Date();
  const isToday = formatDateStr(date) === formatDateStr(today);
  if (isToday) return 'Today';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Nutrition() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = formatDateStr(currentDate);

  // 'logs' (flat list) is needed below to key the recent-foods refetch,
  // so it must be destructured here alongside the grouped/aggregated data.
  const { logs, logsByMeal, totals, loading, addLog, deleteLog } = useFoodLogs(user?.id, dateStr);
  const { goal, updateGoal } = useCalorieGoal(user?.id);
  const [searchOpenForMeal, setSearchOpenForMeal] = useState(null);
  const { recentFoods, loading: recentLoading, refetchRecent } = useRecentFoods(
  user?.id,
  logs.length,
  searchOpenForMeal
);
  const [pendingFood, setPendingFood] = useState(null);

  function changeDay(offset) {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + offset);
    setCurrentDate(next);
  }

  function handleSelectFood(food) {
    setPendingFood(food);
  }

  async function handleConfirmLog(food, mealType, grams) {
    await addLog(food, mealType, grams);
    refetchRecent();
    setPendingFood(null);
    setSearchOpenForMeal(null);
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ color: 'white', marginBottom: '16px' }}>Nutrition</h1>

      <div className="date-nav">
        <button className="date-nav-btn" onClick={() => changeDay(-1)}>‹</button>
        <span className="date-nav-label">{formatDisplayDate(currentDate)}</span>
        <button className="date-nav-btn" onClick={() => changeDay(1)}>›</button>
      </div>

      <div className="daily-totals-card">
        <CalorieRing consumed={totals.calories} goal={goal} />
        <div className="daily-totals-macros" style={{ marginTop: '12px' }}>
          <span className="subtle">Protein: {Math.round(totals.protein)}g</span>
          <span className="subtle">Carbs: {Math.round(totals.carbs)}g</span>
          <span className="subtle">Fat: {Math.round(totals.fat)}g</span>
        </div>
        <CalorieGoalEditor goal={goal} onUpdateGoal={updateGoal} />
      </div>


      {loading && <p className="subtle" style={{ marginTop: '16px' }}>Loading diary...</p>}

      {!loading && MEAL_TYPES.map((meal) => (
        <div key={meal} className="meal-section">
          <div className="meal-section-header">
            <span className="follow-name">{MEAL_LABELS[meal]}</span>
            <button
              className="meal-add-btn"
              onClick={() => setSearchOpenForMeal(searchOpenForMeal === meal ? null : meal)}
            >
              {searchOpenForMeal === meal ? 'Close' : '+ Add food'}
            </button>
          </div>

          {searchOpenForMeal === meal && (
            <div style={{ marginBottom: '12px' }}>
                <FoodSearch onSelectFood={handleSelectFood} />
                <RecentFoods recentFoods={recentFoods} loading={recentLoading} onSelectFood={handleSelectFood}/>
            </div>
        )}

          {logsByMeal[meal].length === 0 ? (
            <p className="subtle" style={{ fontSize: '12px', padding: '4px 0' }}>No foods logged.</p>
          ) : (
            <div className="meal-food-list">
              {logsByMeal[meal].map((log) => (
                <div key={log.id} className="meal-food-row">
                  <div className="food-search-info">
                    <span className="follow-name">{log.food_name}</span>
                    <span className="follow-handle">{log.grams}g</span>
                  </div>
                  <span className="subtle">{Math.round(log.calories || 0)} kcal</span>
                  <button className="meal-food-delete" onClick={() => deleteLog(log.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {pendingFood && (
        <LogFoodModal
          food={pendingFood}
          defaultMeal={searchOpenForMeal}
          onConfirm={handleConfirmLog}
          onCancel={() => setPendingFood(null)}
        />
      )}

      <p className="subtle" style={{ marginTop: '24px', fontSize: '11px' }}>
        Nutrition data from Open Food Facts, available under the Open Database License.
      </p>
    </div>
  );
}