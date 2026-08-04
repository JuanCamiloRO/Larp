// lib/rankTiers.js
// Keys match the EXACT casing stored in exercise_thresholds.rank and
// exercise_ranks.rank (confirmed from live data): 'Scroller', 'Crossfitter',
// 'Calisthenic', 'Gymbro', 'Peptide', 'Larper', 'Fake Natty' -- capitalized,
// with a literal space in 'Fake Natty'. Bracket notation required for that key.

export const TIERS = {
  'Scroller': { label: 'Scroller', icon: '/resources/bronze.png' },
  'Crossfitter': { label: 'Crossfitter', icon: '/resources/platinum.png' },
  'Calisthenic': { label: 'Calisthenic', icon: '/resources/diamond.png' },
  'Gymbro': { label: 'Gymbro', icon: '/resources/gymbro.png' },
  'Peptide': { label: 'Peptide', icon: '/resources/peptide.png' },
  'Larper': { label: 'Larper', icon: '/resources/champion.png' },
  'Fake Natty': { label: 'Fake Natty', icon: '/resources/unreal.png' },
};

export const TIER_ORDER = [
  'Scroller',
  'Crossfitter',
  'Calisthenic',
  'Gymbro',
  'Peptide',
  'Larper',
  'Fake Natty',
];