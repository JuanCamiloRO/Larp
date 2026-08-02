// components/SessionMuscleMap.jsx
import { useState } from 'react';
import Model from 'react-body-highlighter';
import { mapMusclesToBodyParts } from '../lib/muscleMap';
import { aggregateMuscleSets, formatSets } from '../lib/muscleStats';

export default function SessionMuscleMap({ exercises }) {
  const [showModal, setShowModal] = useState(false);

  const primaryData = [];
  const secondaryMuscleSet = new Set();
  const primaryMuscleSet = new Set();
  const statEntries = [];

  exercises.forEach((ex) => {
    const completedSets = ex.sets.filter((s) => s.done).length;
    if (completedSets === 0) return;

    const rawPrimary = ex.primary_muscles || ex.primaryMuscles || ex.muscles || [];
    const rawSecondary = ex.secondary_muscles || ex.secondaryMuscles || [];

    statEntries.push({
      primaryMuscles: rawPrimary,
      secondaryMuscles: rawSecondary,
      count: completedSets,
    });

    const primaryMuscles = mapMusclesToBodyParts(rawPrimary);
    const secondaryMuscles = mapMusclesToBodyParts(rawSecondary);

    if (primaryMuscles.length > 0) {
      for (let i = 0; i < completedSets; i++) {
        primaryData.push({ name: ex.name, muscles: primaryMuscles });
      }
      primaryMuscles.forEach((m) => primaryMuscleSet.add(m));
    }

    secondaryMuscles.forEach((m) => {
      if (!primaryMuscles.includes(m)) secondaryMuscleSet.add(m);
    });
  });

  const secondaryData = Array.from(secondaryMuscleSet).map((muscle) => ({
    name: 'Secondary',
    muscles: [muscle],
  }));

  const data = [...secondaryData, ...primaryData];
  const totalMuscleCount = primaryMuscleSet.size + secondaryMuscleSet.size;
  const muscleTotals = aggregateMuscleSets(statEntries);

  if (data.length === 0) return null;

  return (
    <>
      <button className="muscle-map-trigger" onClick={() => setShowModal(true)}>
        <span className="muscle-map-trigger-icon">💪</span>
        <span className="muscle-map-trigger-text">
          {totalMuscleCount} muscle{totalMuscleCount !== 1 ? 's' : ''} worked
        </span>
        <span className="muscle-map-trigger-arrow">›</span>
      </button>

      {showModal && (
        <div className="summary-overlay" onClick={() => setShowModal(false)}>
          <div className="summary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="summary-header">
              <h2>Muscles Worked</h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <Model
                data={data}
                type="anterior"
                style={{ width: '8rem' }}
                bodyColor="#2c2c2e"
                highlightedColors={['#5a2420', '#ff3b30', '#ff6b61', '#ff9990', '#ffc2ba']}
              />
              <Model
                data={data}
                type="posterior"
                style={{ width: '8rem' }}
                bodyColor="#2c2c2e"
                highlightedColors={['#5a2420', '#ff3b30', '#ff6b61', '#ff9990', '#ffc2ba']}
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
              {muscleTotals.map(({ muscle, sets }) => (
                <div className="muscle-stat-row" key={muscle}>
                  <span className="muscle-stat-name">{muscle}</span>
                  <span className="muscle-stat-sets">{formatSets(sets)} sets</span>
                </div>
              ))}
            </div>

            <button className="summary-close-btn" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}