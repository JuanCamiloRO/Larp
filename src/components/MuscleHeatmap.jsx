// components/MuscleHeatmap.jsx
// Restored to the original react-body-highlighter implementation. Only
// change from the original: accepts an optional userId prop, passed
// through to useMuscleHeatmap, so this same component can render either
// the logged-in user's heatmap (Dashboard, userId omitted) or another
// user's heatmap (PublicProfile, userId provided).

import { useState } from 'react';
import Model from 'react-body-highlighter';
import { useMuscleHeatmap } from '../hooks/useMuscleHeatmap';
import { formatSets, toWeeklyAverage } from '../lib/muscleStats';

const RANGE_OPTIONS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

const HEATMAP_COLORS = [
  '#321416',
  '#64201d',
  '#982b25',
  '#d9362d',
  '#ff3b30',
];

const MODEL_STYLE = {
  width: '10rem',
  height: 'auto',
  filter: `
    drop-shadow(0 18px 18px rgba(0, 0, 0, .55))
    drop-shadow(0 0 18px rgba(255, 59, 48, .12))
  `,
};

export default function MuscleHeatmap({ userId }) {
  const [days, setDays] = useState(7);
  const { data, muscleTotals, loading, error } = useMuscleHeatmap(days, userId);

  if (loading) {
    return (
      <div className="chart-container">
        <p className="subtle">Loading muscle activity...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <p className="message error">Error: {error}</p>
      </div>
    );
  }

  const weeklyStats = toWeeklyAverage(muscleTotals, days);

  return (
    <div >
      <div className="chart-buttons">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.days}
            className={days === opt.days ? 'active' : ''}
            onClick={() => setDays(opt.days)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <p className="subtle" style={{ textAlign: 'center', padding: '20px 0' }}>
          No workouts logged in this period yet.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', marginTop: '14px' }}>
            <Model
  data={data}
  type="anterior"
  style={MODEL_STYLE}
  bodyColor="#252529"
  highlightedColors={HEATMAP_COLORS}
/>

<Model
  data={data}
  type="posterior"
  style={MODEL_STYLE}
  bodyColor="#252529"
  highlightedColors={HEATMAP_COLORS}
/>
          </div>

          <div className="muscle-map-legend">
            <span>
              <span className="legend-dot" style={{ background: '#5a2420' }} />
              Secondary (0.5)
            </span>
            <span>
              <span className="legend-dot" style={{ background: '#ff3b30' }} />
              Primary (1.0)
            </span>
          </div>

          <div className="muscle-stats-list">
            {weeklyStats.map(({ muscle, sets, weeklyAvg }) => (
              <div className="muscle-stat-row" key={muscle}>
                <span className="muscle-stat-name">{muscle}</span>
                <span className="muscle-stat-sets">
                  {formatSets(sets)} total sets
                  {days > 7 && (
                    <span className="muscle-stat-weekly"> · {formatSets(weeklyAvg)}/wk</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}