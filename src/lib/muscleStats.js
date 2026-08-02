// lib/muscleStats.js
export function aggregateMuscleSets(entries) {
  const totals = {};

  entries.forEach(({ primaryMuscles = [], secondaryMuscles = [], count = 1 }) => {
    primaryMuscles.forEach((m) => {
      if (!m) return;
      const key = normalizeMuscleName(m);
      totals[key] = (totals[key] || 0) + count;
    });

    secondaryMuscles.forEach((m) => {
      if (!m) return;
      const key = normalizeMuscleName(m);
      totals[key] = (totals[key] || 0) + count * 0.5;
    });
  });

  return Object.entries(totals)
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets);
}

function normalizeMuscleName(m) {
  return m
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function formatSets(sets) {
  return sets % 1 === 0 ? `${sets}` : sets.toFixed(1);
}

export function toWeeklyAverage(muscleTotals, days) {
  const weeks = days / 7;
  return muscleTotals.map(({ muscle, sets }) => ({
    muscle,
    sets,
    weeklyAvg: sets / weeks,
  }));
}