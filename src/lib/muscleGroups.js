// lib/muscleGroups.js
// Muscle-group config: any muscle listed here gets folded into its group's
// combined rank instead of showing as its own row. Muscles NOT listed here
// (chest, biceps, triceps, shoulders, abdominals, quadriceps, forearms,
// neck) keep rendering individually as before.
//
// NOTE: quadriceps is intentionally left OUT of 'legs' -- confirm if it
// should be included; add 'quadriceps' to the muscles array below if so.

import { publicAsset } from './publicAsset';

export const MUSCLE_GROUPS = [

    {
        key: 'arms',
        label: 'Arms',
        icon: publicAsset('assets/sponge.gif'),
        muscles: ['triceps', 'biceps', 'forearms'],
    },
  {
    key: 'back',
    label: 'Back',
    icon: publicAsset('assets/winnie.gif'),
    muscles: ['lats', 'middle back', 'traps'],
  },
  {
    key: 'legs',
    label: 'Legs',
    icon: publicAsset('assets/winnie.gif'),
    muscles: ['quadriceps','hamstrings', 'glutes', 'abductors', 'adductors', 'calves'],
  },
];

// reverse lookup: 'lats' -> the 'back' group config, etc.
export const MUSCLE_TO_GROUP = MUSCLE_GROUPS.reduce((acc, group) => {
  for (const m of group.muscles) acc[m] = group;
  return acc;
}, {});