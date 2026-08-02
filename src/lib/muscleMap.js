// lib/muscleMap.js
const MUSCLE_MAP = {
  abdominals: 'abs',
  abductors: 'abductors',
  adductors: 'adductor',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearm',
  glutes: 'gluteal',
  hamstrings: 'hamstring',
  lats: 'upper-back',
  'lower back': 'lower-back',
  'middle back': 'upper-back',
  neck: 'neck',
  quadriceps: 'quadriceps',
  shoulders: 'front-deltoids',
  traps: 'trapezius',
  triceps: 'triceps',
};

export function mapMusclesToBodyParts(muscles = []) {
  const mapped = muscles
    .map((m) => MUSCLE_MAP[m?.toLowerCase()])
    .filter(Boolean);
  return [...new Set(mapped)];
}