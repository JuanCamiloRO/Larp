// lib/rankTiers.js
// Keys must match the EXACT casing stored in exercise_thresholds.rank
// and exercise_ranks.rank. 'Fake Natty' has a literal space, so always
// use bracket notation when accessing it dynamically.
import { publicAsset } from './publicAsset';

export const TIERS = {
  Bronze: {
    label: 'Bronze',
    icon: publicAsset('resources/bronze.png'),
  },
  Silver: {
    label: 'Silver',
    icon: publicAsset('resources/silver.png'),
  },
  Gold: {
    label: 'Gold',
    icon: publicAsset('resources/gold.png'),
  },
  Platinum: {
    label: 'Platinum',
    icon: publicAsset('resources/platinum.png'),
  },
  Diamond: {
    label: 'Diamond',
    icon: publicAsset('resources/diamond.png'),
  },
  Larper: {
    label: 'Larper',
    icon: publicAsset('resources/champion.png'),
  },
  'Fake Natty': {
    label: 'Fake Natty',
    icon: publicAsset('resources/unreal.png'),
  },
};

export const TIER_ORDER = [
  'Bronze',
  'Silver',
  'Gold',
  'Platinum',
  'Diamond',
  'Larper',
  'Fake Natty',
];