// lib/muscles.js
// Unified muscle metadata: icon path + display label.
// Add real files to /public/muscles/ as you create them; anything missing
// a file falls back to a placeholder path (swap for a real fallback asset)

export const MUSCLES = {
  chest: { icon: '/resources/default.png', label: 'Chest' },
  triceps: { icon: '/resources/default.png', label: 'Triceps' },
  biceps: { icon: '/resources/default.png', label: 'Biceps' },
  shoulders: { icon: '/resources/default.png', label: 'Shoulders' },
  abdominals: { icon: '/resources/default.png', label: 'Abdominals' },
  lats: { icon: '/resources/default.png', label: 'Lats' },
  'middle back': { icon: '/resources/default.png', label: 'Middle Back' },
  'lower back': { icon: '/resources/default.png', label: 'Lower Back' },
  traps: { icon: '/resources/default.png', label: 'Traps' },
  quadriceps: { icon: '/resources/default.png', label: 'Quadriceps' },
  hamstrings: { icon: '/resources/default.png', label: 'Hamstrings' },
  glutes: { icon: '/resources/default.png', label: 'Glutes' },
  calves: { icon: '/resources/default.png', label: 'Calves' },
  forearms: { icon: '/resources/default.png', label: 'Forearms' },
  abductors: { icon: '/resources/default.png', label: 'Abductors' },
  adductors: { icon: '/resources/default.png', label: 'Adductors' },
  neck: { icon: '/resources/default.png', label: 'Neck' },
};

const DEFAULT_MUSCLE = { icon: '/resources/default.png', label: 'Unknown' };

export function muscles(raw) {
  return MUSCLES[raw] || { ...DEFAULT_MUSCLE, label: raw };
}