// lib/rankTiers.js
// Keys match the EXACT casing stored in exercise_thresholds.rank and
// exercise_ranks.rank (confirmed from live data): 'Scroller', 'Crossfitter',
// 'Calisthenic', 'Gymbro', 'Peptide', 'Larper', 'Fake Natty' -- capitalized,
// with a literal space in 'Fake Natty'. Bracket notation required for that key.
import { publicAsset } from './publicAsset';

export const TIERS = {
  'Scroller': { label: 'Scroller', icon: publicAsset('resources/bronze.png') },
  'Crossfitter': { label: 'Crossfitter', icon: publicAsset('resources/platinum.png') },
  'Calisthenic': { label: 'Calisthenic', icon: publicAsset('resources/diamond.png') },
  'Gymbro': { label: 'Gymbro', icon: publicAsset('resources/gymbro.png') },
  'Peptide': { label: 'Peptide', icon: publicAsset('resources/peptide.png') },
  'Larper': { label: 'Larper', icon: publicAsset('resources/champion.png') },
  'Fake Natty': { label: 'Fake Natty', icon: publicAsset('resources/unreal.png') },
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