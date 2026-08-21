// Pure functions only — no Supabase, no React. Keeps this easy to unit test
// and reusable from anywhere (Workout.jsx, a future "suggested weight"
// preview on the routine editor, etc.)

export const CATEGORY_INCREMENTS = {
  compound_lower: 5,
  compound_upper: 2.5,
  isolation: 1.25,
};

export const GOAL_REP_RANGES = {
  strength: { repMin: 4, repMax: 6 },
  hypertrophy: { repMin: 8, repMax: 10 },
  endurance: { repMin: 12, repMax: 15 },
};

const STALL_SESSIONS_BEFORE_DELOAD = 3;
const DELOAD_FACTOR = 0.9;

/**
 * Rounds a weight to the nearest multiple of `increment`, defaulting to a
 * sane plate-loadable step if increment is 0/undefined.
 */
export function roundToIncrement(weight, increment = 2.5) {
  const step = increment || 2.5;
  return Math.round(weight / step) * step;
}

/**
 * A "session" is one completed workout's sets for a single exercise. Weight
 * is tracked PER SET, not per session — a session can legitimately mix
 * weights (e.g. weighted chin-ups where added weight varies set to set, or
 * a top set + backoff sets):
 *
 *   { date, sets: [{ weight: number, reps: number }] }
 *
 * `sessions` must be sorted most-recent-first.
 */

/**
 * Epley estimated 1RM: weight * (1 + reps/30). NOT currently used by
 * suggestProgression below — an earlier version used this to compare sets
 * across different weights, but that produced unstable/nonsensical targets
 * from low-rep sets far from the working weight (see the note in
 * suggestProgression). Left exported as a general utility in case a future
 * feature (PR detection, cross-exercise strength comparison) needs it —
 * just don't reach for it to compare sets within the same session again.
 */
export function estimateOneRepMax(weight, reps) {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
}

/**
 * Inverts the Epley formula to answer "how many reps at THIS weight would
 * match that estimated 1RM?" — used to translate a strong set done at one
 * weight into a concrete rep target at the weight being used next.
 */
export function repsToMatchOneRepMax(oneRepMax, atWeight) {
  if (!atWeight) return 0;
  const reps = 30 * (oneRepMax / atWeight - 1);
  return Math.max(0, Math.round(reps));
}

/**
 * The "working weight" for a session is simply the heaviest weight used —
 * no set-type modeling (drop set, warm-up, etc.) needed or assumed. Lighter
 * sets later in the session (common with weighted chin-ups especially,
 * where holding the same added weight for every set often isn't realistic)
 * are treated as backoff volume, not part of what determines progression.
 * The lifter's top set is what's being progressed.
 */
export function getWorkingWeight(sets) {
  if (!sets?.length) return null;
  return Math.max(...sets.map((set) => set.weight));
}

/**
 * True only if every set performed AT THE WORKING (heaviest) WEIGHT hit
 * repMax. Lighter backoff sets in the same session don't factor in — a
 * single top set is what's being judged as ready to go up or not.
 */
export function didHitTopOfRange(session, repMax) {
  const workingWeight = getWorkingWeight(session?.sets);
  if (workingWeight == null) return false;

  const setsAtWorkingWeight = session.sets.filter((set) => set.weight === workingWeight);
  if (!setsAtWorkingWeight.length) return false;

  return setsAtWorkingWeight.every((set) => set.reps >= repMax);
}

/**
 * The best set among a group of same-weight sets, by reps. Only ever called
 * on sets that all share the working weight (see suggestProgression below) —
 * comparing reps directly is only valid when the weight is held constant.
 */
export function getBestSet(sets) {
  if (!sets?.length) return null;
  return sets.reduce((best, set) => (!best || set.reps > best.reps ? set : best), null);
}

/**
 * Walks back through sessions at the *current working weight* and counts
 * how many consecutive sessions in a row failed to hit repMax at that
 * weight. Stops the moment the working weight changes (older data at a
 * different weight isn't a "stall" at the current weight).
 */
export function countConsecutiveStalls(sessions, currentWorkingWeight, repMax) {
  let stalls = 0;

  for (const session of sessions) {
    if (getWorkingWeight(session.sets) !== currentWorkingWeight) break;
    if (didHitTopOfRange(session, repMax)) break;
    stalls += 1;
  }

  return stalls;
}

/**
 * The main entry point.
 *
 * @param {Array} sessions - most-recent-first, [{ date, sets: [{ weight, reps }] }]
 * @param {Object} prefs - { repMin, repMax, increment }
 * @returns {{ weight, targetReps, previousBestSet, reason: 'progress'|'deload'|'repeat'|'start' }}
 */
export function suggestProgression(sessions, prefs) {
  const { repMin, repMax, increment } = prefs;

  if (!sessions?.length) {
    return { weight: null, targetReps: repMin, reason: 'start' };
  }

  const [lastSession, ...rest] = sessions;
  const workingWeight = getWorkingWeight(lastSession.sets);

  if (didHitTopOfRange(lastSession, repMax)) {
    return {
      weight: roundToIncrement(workingWeight + increment, increment),
      targetReps: repMin,
      reason: 'progress',
    };
  }

  const stalls = countConsecutiveStalls(sessions, workingWeight, repMax);

  if (stalls >= STALL_SESSIONS_BEFORE_DELOAD) {
    return {
      weight: roundToIncrement(workingWeight * DELOAD_FACTOR, increment),
      targetReps: repMax,
      reason: 'deload',
    };
  }

  // The target is "one more rep than your best set at your top weight last
  // time." No off-weight sets (backoff sets lighter than the top set)
  // factor into this — an earlier version tried translating those across
  // the weight gap via estimated 1RM, which is unstable at low rep counts
  // and produced nonsensical jumps (e.g. "try for 10" off a 3-rep top set).
  // Comparing same-weight sets by reps directly has no such failure mode.
  const setsAtWorkingWeight = lastSession.sets.filter((set) => set.weight === workingWeight);
  const bestSet = getBestSet(setsAtWorkingWeight);
  const targetReps = Math.min(repMax, bestSet.reps + 1);

  return {
    weight: workingWeight,
    targetReps,
    previousBestSet: bestSet, // { weight, reps } — lets the UI say exactly what that set was
    reason: 'repeat',
  };
}

/**
 * Resolves the increment to use for an exercise: explicit user pref wins,
 * then category default, then a safe isolation-level fallback.
 */
export function resolveIncrement({ userIncrement, category }) {
  if (userIncrement != null) return userIncrement;
  return CATEGORY_INCREMENTS[category] ?? CATEGORY_INCREMENTS.isolation;
}

/**
 * Resolves default rep range from a training goal, falling back to
 * hypertrophy defaults (8-10) if goal is unset/unrecognized.
 */
export function resolveRepRange({ userRepMin, userRepMax, goal }) {
  if (userRepMin != null && userRepMax != null) {
    return { repMin: userRepMin, repMax: userRepMax };
  }
  return GOAL_REP_RANGES[goal] ?? GOAL_REP_RANGES.hypertrophy;
}