import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useFoodLogs, MEAL_TYPES } from '../hooks/useFoodLogs';
import { useCalorieGoal } from '../hooks/useCalorieGoal';
import { useRecentFoods } from '../hooks/useRecentFoods';
import { ScanLine, ArrowLeft, Plus, X } from 'lucide-react';
import { macroGoalsInGrams } from '../lib/macros';
import MealScan from '../components/MealScan';
import FoodSearch from '../components/FoodSearch';
import LogFoodModal from '../components/LogFoodModal';
import CalorieRing from '../components/CalorieRing';
import CalorieGoalEditor from '../components/CalorieGoalEditor';
import MacroProgress from '../components/MacroProgress';
import MacroGoalModal from '../components/MacroGoalModal';
import RecentFoods from '../components/RecentFoods';
import ScanBarcodeButton from '../components/ScanBarcodeButton';
import WeightProgress from '../components/WeightProgress';
import '../css/nutrition.css';

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
  const navigate = useNavigate();

  const { logs, logsByMeal, totals, loading, addLog, addLogEntry, deleteLog } = useFoodLogs(user?.id, dateStr);
  const { goal, updateGoal, macros, updateMacroGoals } = useCalorieGoal(user?.id);
  const [searchOpenForMeal, setSearchOpenForMeal] = useState(null);
  const { recentFoods, loading: recentLoading, refetchRecent } = useRecentFoods(
    user?.id,
    logs.length,
    searchOpenForMeal
  );
  const [pendingFood, setPendingFood] = useState(null);
  const [mealScanOpen, setMealScanOpen] = useState(false);
  const [macroModalOpen, setMacroModalOpen] = useState(false);

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

  function mealCalories(logs) {
    return logs.reduce((sum, log) => sum + (log.calories || 0), 0);
  }

  async function handleConfirmScan(meal, mealType) {
    const mealTotals = meal.items.reduce(
      (total, item) => ({
        calories: total.calories + Number(item?.calories || 0),
        protein: total.protein + Number(item?.protein || 0),
        carbs: total.carbs + Number(item?.carbs || 0),
        fat: total.fat + Number(item?.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    await addLogEntry({
      food_name: meal.mealName || 'Scanned meal',
      meal_type: mealType,
      grams: 1,
      ...mealTotals,
    });

    refetchRecent();
    setMealScanOpen(false);
  }

  function openMealScan(meal) {
    setSearchOpenForMeal(meal);
    setMealScanOpen(true);
  }

  function toggleFoodSearch(meal) {
    setSearchOpenForMeal(searchOpenForMeal === meal ? null : meal);
  }

  return (
    <div className="page-transition">
      <div>
        <header className="settings-header" style={{ marginBottom: '12px' }}>
          <button
            type="button"
            className="settings-header__back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft size={21} />
          </button>
          <div>
            <p>Nutrition</p>
            <h1>Log your meals</h1>
          </div>
        </header>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="date-nav">
          <button className="date-nav-btn" onClick={() => changeDay(-1)}>‹</button>
          <span className="date-nav-label">{formatDisplayDate(currentDate)}</span>
          <button className="date-nav-btn" onClick={() => changeDay(1)}>›</button>
        </div>

        <div className="weight-progress">
          <CalorieRing consumed={totals.calories} goal={goal} />

          <MacroProgress
            consumed={{ protein: totals.protein, carbs: totals.carbs, fat: totals.fat }}
            goals={macroGoalsInGrams(macros)}
          />


          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button
              type="button"
              className="primary-btn"
              onClick={() => setMacroModalOpen(true)}
            >
             Edit Nutrition Goals 
            </button>
          </div>
        </div>

        {mealScanOpen && (
          <MealScan
            defaultMeal={searchOpenForMeal || 'lunch'}
            onConfirm={handleConfirmScan}
            onClose={() => setMealScanOpen(false)}
          />
        )}

        {macroModalOpen && (
          <MacroGoalModal
            calorieGoal={goal}
            initialGoal={macros}
            onSave={updateMacroGoals}
            onClose={() => setMacroModalOpen(false)}
          />
        )}

        {loading && <p className="subtle" style={{ marginTop: '16px' }}>Loading diary...</p>}

        {!loading && MEAL_TYPES.map((meal) => (
          <div key={meal} className="meal-section">
            <div className="meal-section-header">
              <div className="meal-section-title">
                <span className="follow-name">{MEAL_LABELS[meal]}</span>
                <span className="meal-kcal">{Math.round(mealCalories(logsByMeal[meal]))} kcal</span>
              </div>

              <div className="meal-section-actions">
                <span onClickCapture={() => setSearchOpenForMeal(meal)}>
                  <ScanBarcodeButton
                    className="meal-icon-btn"
                    iconOnly
                    onFoodFound={(food) => setPendingFood(food)}
                  />
                </span>

                <button
                  type="button"
                  className="meal-icon-btn"
                  aria-label={`Scan a meal for ${MEAL_LABELS[meal]}`}
                  onClick={() => openMealScan(meal)}
                >
                  <ScanLine size={17} />
                </button>

                <button
                  type="button"
                  className={`meal-icon-btn meal-icon-btn--add${searchOpenForMeal === meal ? ' is-active' : ''}`}
                  aria-label={searchOpenForMeal === meal ? 'Close add food' : `Add food to ${MEAL_LABELS[meal]}`}
                  onClick={() => toggleFoodSearch(meal)}
                >
                  {searchOpenForMeal === meal ? <X size={17} /> : <Plus size={17} />}
                </button>
              </div>
            </div>

            {searchOpenForMeal === meal && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <FoodSearch onSelectFood={handleSelectFood} />
                <RecentFoods recentFoods={recentFoods} loading={recentLoading} onSelectFood={handleSelectFood} />
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

        <WeightProgress userId={user?.id} />

        <p className="subtle" style={{ marginTop: '24px', fontSize: '11px' }}>
          Nutrition data from Open Food Facts, available under the Open Database License.
        </p>
      </div>
    </div>
  );
}