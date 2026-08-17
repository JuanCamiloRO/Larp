import '../css/macro-progress.css'; 

const MACROS = [
  { key: 'protein', label: 'Protein', className: 'macro-bar--protein' },
  { key: 'carbs', label: 'Carbs', className: 'macro-bar--carbs' },
  { key: 'fat', label: 'Fat', className: 'macro-bar--fat' },
];

export default function MacroProgress({ consumed, goals }) {
  const visible = MACROS.filter((m) => goals?.[m.key] != null && goals[m.key] > 0);
  if (visible.length === 0) return null;

  return (
    <div className="macro-progress">
      {visible.map(({ key, label, className }) => {
        const goal = goals[key];
        const consumedAmount = Math.max(0, consumed?.[key] || 0);
        const pct = Math.min(100, (consumedAmount / goal) * 100);
        const over = consumedAmount > goal;

        return (
          <div className="macro-bar-row" key={key}>
            <div className="macro-bar-labels">
              <span className="macro-bar-name">{label}</span>
              <span className="macro-bar-values">
                {Math.round(consumedAmount)} / {Math.round(goal)}g
              </span>
            </div>
            <div className="macro-bar-track">
              <div
                className={`macro-bar-fill ${className}${over ? ' is-over' : ''}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}