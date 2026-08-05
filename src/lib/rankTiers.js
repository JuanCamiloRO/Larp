// lib/rankTiers.js
// Keys match the EXACT casing stored in exercise_thresholds.rank and
// exercise_ranks.rank (confirmed from live data): 'Scroller', 'Crossfitter',
// 'Calisthenic', 'Gymbro', 'Peptide', 'Larper', 'Fake Natty' -- capitalized,
// with a literal space in 'Fake Natty'. Bracket notation required for that key.
import { publicAsset } from './publicAsset';

export const TIERS = {
  'Scroller': { label: 'Scroller', icon: publicAsset('assets/bronze.png') },
  'Crossfitter': { label: 'Crossfitter', icon: publicAsset('assets/platinum.png') },
  'Calisthenic': { label: 'Calisthenic', icon: publicAsset('assets/diamond.png') },
  'Gymbro': { label: 'Gymbro', icon: publicAsset('assets/gymbro.png') },
  'Peptide': { label: 'Peptide', icon: publicAsset('assets/peptide.png') },
  'Larper': { label: 'Larper', icon: publicAsset('assets/champion.png') },
  'Fake Natty': { label: 'Fake Natty', icon: publicAsset('assets/unreal.png') },
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