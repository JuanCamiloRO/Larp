// components/CalorieGoalEditor.jsx
// Small inline editor for changing the daily calorie goal. Tapping the
// current goal text turns it into an input; Enter or blur saves it via
// updateGoal from useCalorieGoal.

import { useState } from 'react';

export default function CalorieGoalEditor({ goal, onUpdateGoal }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(goal);

  function handleSave() {
    if (value > 0 && value !== goal) {
      onUpdateGoal(value);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        type="number"
        autoFocus
        className="calorie-goal-input"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        onBlur={handleSave}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
      />
    );
  }

  return (
    <button
      className="calorie-goal-edit-btn"
      onClick={() => {
        setValue(goal);
        setEditing(true);
      }}
    >
      Goal: {goal} kcal ✎
    </button>
  );
}