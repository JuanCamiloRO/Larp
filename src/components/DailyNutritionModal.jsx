import { X } from 'lucide-react';
import '../css/nutrition-facts.css';

export default function DailyNutritionModal({ logs, goal, macroGoals, dateLabel, onClose }) {
  const sum = (key) =>
    logs.reduce((total, log) => {
      const v = log[key];
      return v === null || v === undefined ? total : total + Number(v);
    }, 0);

  const hasAny = (key) => logs.some((log) => log[key] !== null && log[key] !== undefined);

  const calories = sum('calories');
  const protein = sum('protein');
  const carbs = sum('carbs');
  const fat = sum('fat');

  const fiber = hasAny('fiber') ? sum('fiber') : null;
  const sugar = hasAny('sugar') ? sum('sugar') : null;
  const saturatedFat = hasAny('saturated_fat') ? sum('saturated_fat') : null;
  const sodiumG = hasAny('sodium') ? sum('sodium') : null;
  const salt = hasAny('salt') ? sum('salt') : null;
  const sodiumMg = sodiumG !== null ? sodiumG * 1000 : null;

  const fmt = (v, digits = 1) => (v === null ? '—' : Number(v.toFixed(digits)));

  const rows = [
    { label: 'Protein', value: protein, unit: 'g'},
    { label: 'Carbs', value: carbs, unit: 'g' },
    { label: 'Fat', value: fat, unit: 'g'},
    { label: 'Saturated Fat', value: saturatedFat, unit: 'g'},
    { label: 'Fiber', value: fiber, unit: 'g' },
    { label: 'Sugar', value: sugar, unit: 'g'},
    { label: 'Sodium', value: sodiumMg, unit: 'mg' },
    { label: 'Salt', value: salt, unit: 'g' },
  ];

  const remaining = goal ? Math.max(goal - calories, 0) : null;

  return (
    <div className="nutrition-page" role="dialog" aria-modal="true">
      <header className="settings-header nutrition-page__header">
        <button
          type="button"
          className="settings-header__back"
          onClick={onClose}
          aria-label="Close daily nutrition"
        >
          <X size={21} />
        </button>
        <div>
          <p>Nutrition</p>
          <h1>{dateLabel || 'Daily breakdown'}</h1>
        </div>
      </header>

      <div className="nutrition-page__body">
        {logs.length === 0 ? (
          <p className="subtle" style={{ marginTop: '16px' }}>Nothing logged yet today.</p>
        ) : (
          <>

            <div className="nutrition-facts-table">
              {rows.map((row) =>
                row.value === null ? null : (
                  <div
                    key={row.label}
                    className={`nutrition-facts-row${row.indent ? ' nutrition-facts-row--indent' : ''}${
                      row.bold ? ' nutrition-facts-row--bold' : ''
                    }`}
                  >
                    <span>{row.label}</span>
                    <span>
                      {fmt(row.value, row.unit === 'mg' ? 0 : 1)} {row.unit}
                    </span>
                  </div>
                )
              )}
            </div>

            {rows.every((r) => r.value === null) && (
              <p className="subtle nutrition-facts-footnote">
                Detailed nutrients (fiber, sugar, sodium, etc.) aren't available yet for
                today's logs. This shows up once foods are logged with full nutriment data.
              </p>
            )}
          </>
        )}

        <p className="subtle nutrition-facts-footnote">
          Totals across all meals logged today. Data from Open Food Facts.
        </p>
      </div>
    </div>
  );
}

function MacroPill({ label, value, goal, color }) {
  return (
    <div className="nutrition-facts-macro-pill">
      <span className="nutrition-facts-macro-dot" style={{ backgroundColor: color }} />
      <span className="subtle" style={{ fontSize: '11px' }}>{label}</span>
      <span className="follow-name" style={{ fontSize: '13px' }}>
        {Math.round(value)}g{goal ? ` / ${Math.round(goal)}g` : ''}
      </span>
    </div>
  );
}