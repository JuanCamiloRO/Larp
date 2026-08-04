// lib/muscles.js
// Unified muscle metadata: icon path + display label.
// Add real files to /public/muscles/ as you create them; anything missing
// a file falls back to a placeholder path (swap for a real fallback asset)

export const MUSCLES = {
  chest: { icon: '/resources/speed.gif', label: 'Chest' },
  triceps: { icon: '/resources/speed.gif', label: 'Triceps' },
  biceps: { icon: '/resources/minion.gif', label: 'Biceps' },
  shoulders: { icon: '/resources/sponge.gif', label: 'Shoulders' },
  abdominals: { icon: '/resources/speed.gif', label: 'Abdominals' },
  lats: { icon: '/resources/speed.gif', label: 'Lats' },
  'middle back': { icon: '/resources/speed.gif', label: 'Middle Back' },
  'lower back': { icon: '/resources/speed.gif', label: 'Lower Back' },
  traps: { icon: '/resources/speed.gif', label: 'Traps' },
  quadriceps: { icon: '/resources/speed.gif', label: 'Quadriceps' },
  hamstrings: { icon: '/resources/speed.gif', label: 'Hamstrings' },
  glutes: { icon: '/resources/speed.gif', label: 'Glutes' },
  calves: { icon: '/resources/speed.gif', label: 'Calves' },
  forearms: { icon: '/resources/speed.gif', label: 'Forearms' },
  abductors: { icon: '/resources/speed.gif', label: 'Abductors' },
  adductors: { icon: '/resources/speed.gif', label: 'Adductors' },
  neck: { icon: '/resources/speed.gif', label: 'Neck' },
};

const DEFAULT_MUSCLE = { icon: '/resources/default.png', label: 'Unknown' };

export function muscles(raw) {
  return MUSCLES[raw] || { ...DEFAULT_MUSCLE, label: raw };
}