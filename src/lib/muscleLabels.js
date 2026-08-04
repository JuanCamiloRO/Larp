// lib/muscles.js
// Unified muscle metadata: icon path + display label.
// Add real files to /public/muscles/ as you create them; anything missing
// a file falls back to a placeholder path (swap for a real fallback asset)

export const MUSCLES = {
  chest: { icon: '/muscles/chest.png', label: 'Chest' },
  triceps: { icon: '/muscles/triceps.png', label: 'Triceps' },
  biceps: { icon: '/muscles/biceps.png', label: 'Biceps' },
  shoulders: { icon: '/muscles/shoulders.png', label: 'Shoulders' },
  abdominals: { icon: '/muscles/abdominals.png', label: 'Abdominals' },
  lats: { icon: '/muscles/lats.png', label: 'Lats' },
  'middle back': { icon: '/muscles/middle-back.png', label: 'Middle Back' },
  'lower back': { icon: '/muscles/lower-back.png', label: 'Lower Back' },
  traps: { icon: '/muscles/traps.png', label: 'Traps' },
  quadriceps: { icon: '/muscles/quadriceps.png', label: 'Quadriceps' },
  hamstrings: { icon: '/muscles/hamstrings.png', label: 'Hamstrings' },
  glutes: { icon: '/muscles/glutes.png', label: 'Glutes' },
  calves: { icon: '/muscles/calves.png', label: 'Calves' },
  forearms: { icon: '/muscles/forearms.png', label: 'Forearms' },
  abductors: { icon: '/muscles/abductors.png', label: 'Abductors' },
  adductors: { icon: '/muscles/adductors.png', label: 'Adductors' },
  neck: { icon: '/muscles/neck.png', label: 'Neck' },
};

const DEFAULT_MUSCLE = { icon: '/muscles/default.png', label: 'Unknown' };

export function muscles(raw) {
  return MUSCLES[raw] || { ...DEFAULT_MUSCLE, label: raw };
}