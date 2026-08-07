// components/CalorieRing.jsx
// Circular calorie progress indicator, MyFitnessPal-style. Center shows
// calories remaining (or "over"); a stats row below the ring breaks down
// consumed vs. goal so both numbers are visible at a glance.

const SIZE = 160;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CalorieRing({ consumed, goal }) {
  const remaining = goal - consumed;
  const isOver = remaining < 0;

  const percent = Math.min(consumed / goal, 1);
  const dashOffset = CIRCUMFERENCE * (1 - percent);

  const ringColor = isOver ? '#f87171' : 'var(--accent)';

  

  return (
    <div>
      <div className="calorie-ring-wrapper">
        <svg width={SIZE} height={SIZE} className="calorie-ring-svg">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--border)"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
          />
        </svg>

        <div className="calorie-ring-center">
          <span className="calorie-ring-value">
            {Math.abs(Math.round(remaining))}
          </span>
          <span className="calorie-ring-label">
            {isOver ? 'over' : 'remaining'}
          </span>
        </div>
      </div>

      <div className="calorie-stats-row">
        <div className="calorie-stat">
          <span className="calorie-stat-value">{Math.round(consumed)}</span>
          <span className="calorie-stat-label">Consumed</span>
        </div>
        <div className="calorie-stat-divider" />
        <div className="calorie-stat">
          <span className="calorie-stat-value">{Math.round(goal)}</span>
          <span className="calorie-stat-label">Goal</span>
        </div>
      </div>
    </div>
  );
}