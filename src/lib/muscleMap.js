// lib/muscleMap.js
const MUSCLE_MAP = {
  abdominals: ["abs"],
  abductors: ["abductors"],
  adductors: ["adductor"],
  biceps: ["biceps"],
  calves: ["calves"],
  chest: ["chest"],
  forearms: ["forearm"],
  glutes: ["gluteal"],
  hamstrings: ["hamstring"],
  lats: ["upper-back"],
  "lower back": ["lower-back"],
  "middle back": ["trapezius"],
  neck: ["neck"],
  quadriceps: ["quadriceps"],
  shoulders: ["front-deltoids", "back-deltoids"],
  traps: ["trapezius"],
  triceps: ["triceps"],
};

export function mapMusclesToBodyParts(muscles = []) {
  const mapped = muscles
    .flatMap((muscle) => MUSCLE_MAP[muscle?.toLowerCase()] ?? [])
    .filter(Boolean);

  return [...new Set(mapped)];
}