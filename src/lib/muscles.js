// lib/muscles.js
import { publicAsset } from './publicAsset';

export const MUSCLES = {
  chest: { icon: publicAsset('resources/speed.gif'), label: 'Chest' },
  triceps: { icon: publicAsset('resources/speed.gif'), label: 'Triceps' },
  biceps: { icon: publicAsset('resources/minion.gif'), label: 'Biceps' },
  shoulders: { icon: publicAsset('resources/sponge.gif'), label: 'Shoulders' },
  abdominals: { icon: publicAsset('resources/speed.gif'), label: 'Abdominals' },
  lats: { icon: publicAsset('resources/speed.gif'), label: 'Lats' },
  'middle back': { icon: publicAsset('resources/speed.gif'), label: 'Middle Back' },
  'lower back': { icon: publicAsset('resources/speed.gif'), label: 'Lower Back' },
  traps: { icon: publicAsset('resources/speed.gif'), label: 'Traps' },
  quadriceps: { icon: publicAsset('resources/speed.gif'), label: 'Quadriceps' },
  hamstrings: { icon: publicAsset('resources/speed.gif'), label: 'Hamstrings' },
  glutes: { icon: publicAsset('resources/speed.gif'), label: 'Glutes' },
  calves: { icon: publicAsset('resources/speed.gif'), label: 'Calves' },
  forearms: { icon: publicAsset('resources/speed.gif'), label: 'Forearms' },
  abductors: { icon: publicAsset('resources/speed.gif'), label: 'Abductors' },
  adductors: { icon: publicAsset('resources/speed.gif'), label: 'Adductors' },
  neck: { icon: publicAsset('resources/speed.gif'), label: 'Neck' },
};

const DEFAULT_MUSCLE = {
  icon: publicAsset('resources/default.png'),
  label: 'Unknown',
};

export function muscles(raw) {
  return MUSCLES[raw] || { ...DEFAULT_MUSCLE, label: raw };
}