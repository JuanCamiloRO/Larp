// components/MacroGoalModal.jsx
// Modal for setting the daily calorie goal and protein/carbs/fat goals
// together. Macros can be entered as percent-of-calories or grams directly
// (auto-converted live); macro goals are always persisted in grams via
// onSaveMacros. Calorie goal is saved separately via onSaveCalories since
// it lives in a different hook call (useCalorieGoal.updateGoal), which also
// handles proportionally rescaling existing macro grams if needed.

import { useState } from 'react';
import { X } from 'lucide-react';
import '../css/macro-goal.css';

const PRESETS = [
  { key: 'balanced', label: 'Balanced', protein: 30, carbs: 40, fat: 30 },
  { key: 'high_protein', label: 'High protein', protein: 40, carbs: 30, fat: 30 },
  { key: 'low_carb', label: 'Low carb', protein: 35, carbs: 20, fat: 45 },
];

const CALORIES_PER_GRAM = { protein: 4, carbs: 4, fat: 9 };

function gramsFromPercent(pct, calorieGoal, macro) {
  return ((pct / 100) * calorieGoal) / CALORIES_PER_GRAM[macro];
}

function percentFromGrams(grams, calorieGoal, macro) {
  if (!calorieGoal) return 0;
  return ((grams * CALORIES_PER_GRAM[macro]) / calorieGoal) * 100;
}

export default function MacroGoalModal({ calorieGoal, initialGoal, onSaveCalories, onSaveMacros, onClose }) {
  const [calories, setCalories] = useState(calorieGoal);

  // 'mode' only controls what the macro inputs currently represent while
  // editing -- it is never persisted. Storage is always grams.
  const [mode, setMode] = useState('grams');
  const [protein, setProtein] = useState(
    initialGoal?.protein_goal != null ? initialGoal.protein_goal : 30
  );
  const [carbs, setCarbs] = useState(
    initialGoal?.carbs_goal != null ? initialGoal.carbs_goal : 40
  );
  const [fat, setFat] = useState(
    initialGoal?.fat_goal != null ? initialGoal.fat_goal : 30
  );

  function applyPreset(preset) {
    setMode('percent');
    setProtein(preset.protein);
    setCarbs(preset.carbs);
    setFat(preset.fat);
  }

  function switchMode(nextMode) {
    if (nextMode === mode) return;
    if (nextMode === 'grams') {
      setProtein(Math.round(gramsFromPercent(protein, calories, 'protein')));
      setCarbs(Math.round(gramsFromPercent(carbs, calories, 'carbs')));
      setFat(Math.round(gramsFromPercent(fat, calories, 'fat')));
    } else {
      setProtein(Math.round(percentFromGrams(protein, calories, 'protein')));
      setCarbs(Math.round(percentFromGrams(carbs, calories, 'carbs')));
      setFat(Math.round(percentFromGrams(fat, calories, 'fat')));
    }
    setMode(nextMode);
  }

  const gramsPreview = {
    protein: mode === 'percent' ? gramsFromPercent(protein, calories, 'protein') : protein,
    carbs: mode === 'percent' ? gramsFromPercent(carbs, calories, 'carbs') : carbs,
    fat: mode === 'percent' ? gramsFromPercent(fat, calories, 'fat') : fat,
  };

  const calorieCheck =
    gramsPreview.protein * 4 + gramsPreview.carbs * 4 + gramsPreview.fat * 9;
  const calorieDiff = Math.round(calorieCheck - calories);
  const percentTotal = mode === 'percent' ? protein + carbs + fat : null;

  async function handleSave() {
    const newCalories = Number(calories) || 0;

    if (newCalories > 0 && newCalories !== calorieGoal) {
      await onSaveCalories(newCalories);
    }

    await onSaveMacros({
      protein_goal: Math.round(gramsPreview.protein) || 0,
      carbs_goal: Math.round(gramsPreview.carbs) || 0,
      fat_goal: Math.round(gramsPreview.fat) || 0,
    });

    onClose();
  }

  return (
    <div className="macro-goal-backdrop" onClick={onClose}>
      <div className="macro-goal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="macro-goal-header">
          <div>
            <span className="macro-goal-eyebrow">Goals</span>
            <h2>Daily goals</h2>
          </div>
          <button className="macro-goal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="macro-goal-calorie-field">
          <label>
            <span>Daily calories</span>
            <div className="macro-goal-input-wrap">
              <input
                type="number"
                min="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <span className="macro-goal-unit">kcal</span>
            </div>
          </label>
        </div>

        <div className="macro-goal-presets">
          {PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className="macro-goal-preset-btn"
              onClick={() => applyPreset(preset)}
            >
              <strong>{preset.label}</strong>
              <small>{preset.protein}/{preset.carbs}/{preset.fat}</small>
            </button>
          ))}
        </div>

        <div className="macro-goal-mode-toggle" role="tablist">
          <button
            type="button"
            className={mode === 'percent' ? 'is-active' : ''}
            onClick={() => switchMode('percent')}
          >
            Percent
          </button>
          <button
            type="button"
            className={mode === 'grams' ? 'is-active' : ''}
            onClick={() => switchMode('grams')}
          >
            Grams
          </button>
        </div>

        <div className="macro-goal-fields">
          <label className="macro-goal-field">
            <span>Protein</span>
            <div className="macro-goal-input-wrap">
              <input
                type="number"
                min="0"
                value={protein}
                onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <span className="macro-goal-unit">{mode === 'percent' ? '%' : 'g'}</span>
            </div>
            {mode === 'percent' && (
              <small className="subtle">{Math.round(gramsPreview.protein)}g</small>
            )}
          </label>

          <label className="macro-goal-field">
            <span>Carbs</span>
            <div className="macro-goal-input-wrap">
              <input
                type="number"
                min="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <span className="macro-goal-unit">{mode === 'percent' ? '%' : 'g'}</span>
            </div>
            {mode === 'percent' && (
              <small className="subtle">{Math.round(gramsPreview.carbs)}g</small>
            )}
          </label>

          <label className="macro-goal-field">
            <span>Fat</span>
            <div className="macro-goal-input-wrap">
              <input
                type="number"
                min="0"
                value={fat}
                onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
              />
              <span className="macro-goal-unit">{mode === 'percent' ? '%' : 'g'}</span>
            </div>
            {mode === 'percent' && (
              <small className="subtle">{Math.round(gramsPreview.fat)}g</small>
            )}
          </label>
        </div>

        <div className="macro-goal-summary">
          {mode === 'percent' && (
            <span className={percentTotal !== 100 ? 'macro-goal-warn' : 'subtle'}>
              {percentTotal}% of calories
            </span>
          )}
          <span className={Math.abs(calorieDiff) > 25 ? 'macro-goal-warn' : 'subtle'}>
            ≈ {Math.round(calorieCheck)} kcal (goal: {Math.round(calories) || 0} kcal)
          </span>
        </div>

        <button type="button" className="macro-goal-save" onClick={handleSave}>
          Save goals
        </button>
      </div>
    </div>
  );
}