// lib/muscles.js
import { publicAsset } from './publicAsset';

export const MUSCLES = {
  chest: { icon: publicAsset('assets/speed.gif'), label: 'Chest' },
  triceps: { icon: publicAsset('assets/speed.gif'), label: 'Triceps' },
  biceps: { icon: publicAsset('assets/minion.gif'), label: 'Biceps' },
  shoulders: { icon: publicAsset('assets/sponge.gif'), label: 'Shoulders' },
  abdominals: { icon: publicAsset('assets/speed.gif'), label: 'Abdominals' },
  lats: { icon: publicAsset('assets/speed.gif'), label: 'Lats' },
  'middle back': { icon: publicAsset('assets/speed.gif'), label: 'Middle Back' },
  'lower back': { icon: publicAsset('assets/speed.gif'), label: 'Lower Back' },
  traps: { icon: publicAsset('assets/speed.gif'), label: 'Traps' },
  quadriceps: { icon: publicAsset('assets/speed.gif'), label: 'Quadriceps' },
  hamstrings: { icon: publicAsset('assets/speed.gif'), label: 'Hamstrings' },
  glutes: { icon: publicAsset('assets/speed.gif'), label: 'Glutes' },
  calves: { icon: publicAsset('assets/speed.gif'), label: 'Calves' },
  forearms: { icon: publicAsset('assets/speed.gif'), label: 'Forearms' },
  abductors: { icon: publicAsset('assets/speed.gif'), label: 'Abductors' },
  adductors: { icon: publicAsset('assets/speed.gif'), label: 'Adductors' },
  neck: { icon: publicAsset('assets/speed.gif'), label: 'Neck' },
};

const DEFAULT_MUSCLE = {
  icon: publicAsset('assets/default.png'),
  label: 'Unknown',
};

export function muscles(raw) {
  return MUSCLES[raw] || { ...DEFAULT_MUSCLE, label: raw };
}