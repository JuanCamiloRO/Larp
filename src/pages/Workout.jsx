import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, Compass, Dumbbell, Layers, ListPlus, Notebook, Plus, Trash, X } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { usePrograms } from '../hooks/usePrograms';
import { useWorkoutContext } from '../context/WorkoutContext';
import { resolveIncrement, resolveRepRange, roundToIncrement, suggestProgression } from '../lib/progression';
import ExercisePicker from '../components/ExercisePicker';
import ExerciseRankBadge from '../components/ExerciseRankBadge';
import PRToast from '../components/PRToast';
import WorkoutSummary from '../components/WorkoutSummary';
import WorkoutTimer from '../components/WorkoutTimer';
import RestTimer from '../components/RestTimer';
import SessionMuscleMap from '../components/SessionMuscleMap';
import '../css/workout.css';

// --- Constants and exercise identity ---
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const EMPTY_SET = { dbId: null, reps: '', durationSeconds: '', weight: '', done: false, isPR: false, saving: false, wasSuggested: false };
const NOTE_SAVE_DEBOUNCE_MS = 600;
const PROGRESSION_SESSION_LIMIT = 10;
const isCustom = (exercise) => exercise.source === 'custom';
const isTimed = (exercise) => isCustom(exercise) && exercise.measurement_type === 'time';
const exerciseKey = (exercise) => `${isCustom(exercise) ? 'custom' : 'catalogue'}:${exercise.id}`;

const createSetFromPrevious = (previous, exercise) => ({
  ...EMPTY_SET,
  weight: previous?.weight?.toString() ?? '',
  reps: isTimed(exercise) ? '' : (previous?.reps?.toString() ?? ''),
  durationSeconds: isTimed(exercise) ? (previous?.durationSeconds?.toString() ?? '') : '',
});

const createSetFromSuggestion = (suggestion, previous, exercise) => {
  if (isCustom(exercise)) return createSetFromPrevious(previous, exercise);
  const suggestedWeight = suggestion?.weight;
  return {
    ...EMPTY_SET,
    weight: suggestedWeight != null ? suggestedWeight.toString() : (previous?.weight?.toString() ?? ''),
    reps: '',
    wasSuggested: suggestedWeight != null,
  };
};

// Only catalogue exercises participate in the existing bodyweight rank algorithm.
const BODYWEIGHT_LOAD_EXERCISE_IDS = new Set([
  '21c7ce91-7468-4838-8e22-beb7939a0f57',
  '98cbd91f-bb5a-43f8-b14f-d0fc29a0d584',
  '876292d7-a14e-491c-b1e2-88f24f5f9662',
  '358f5fa6-df47-47af-bf85-7eb5518ee4fc',
  '1e6d091c-0b64-4975-bcbf-c6105df6533a',
]);

export default function Workout() {
  // --- Session and UI state ---
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const {
    workoutId, setWorkoutId, name, setName, startedAt, setStartedAt, endedAt, setEndedAt,
    exercises, setExercises, resetWorkout, restTimer, startRestTimer,
  } = useWorkoutContext();
  const [showPicker, setShowPicker] = useState(false);
  const [showWorkoutMenu, setShowWorkoutMenu] = useState(false);
  const [routines, setRoutines] = useState([]);
  const { programs, loading: programsLoading, error: programsError } = usePrograms(user?.id);
  const [expandedProgramId, setExpandedProgramId] = useState(null);
  const [routinesLoading, setRoutinesLoading] = useState(false);
  const [startingRoutineId, setStartingRoutineId] = useState(null);
  const [routineError, setRoutineError] = useState('');
  const [finished, setFinished] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [toast, setToast] = useState(null);
  const [summary, setSummary] = useState(null);
  const [bodyWeight, setBodyWeight] = useState(null);
  const noteSaveTimers = useRef({});
  const creatingWorkout = useRef(null);

  // --- Lifecycle and profile data ---
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => () => { Object.values(noteSaveTimers.current).forEach(clearTimeout); }, []);
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    async function loadBodyWeight() {
      const { data, error } = await supabase.from('profiles').select('weight').eq('id', user.id).maybeSingle();
      if (cancelled) return;
      if (error) { console.error('Load body weight:', error); return; }
      setBodyWeight(data?.weight ?? null);
    }
    void loadBodyWeight();
    return () => { cancelled = true; };
  }, [user?.id]);

  // --- Local state utilities and workout creation ---
  const imageUrl = (image) => image.startsWith('http') ? image : `${IMAGE_BASE_URL}${image}`;
  const patchExercise = (index, updater) => setExercises((current) => current.map((item, itemIndex) => itemIndex === index ? updater(item) : item));

  async function ensureWorkout() {
    if (workoutId) return workoutId;
    if (creatingWorkout.current) return creatingWorkout.current;
    creatingWorkout.current = (async () => {
      const { data, error } = await supabase.from('workouts').insert({ user_id: user.id }).select('id, started_at').single();
      if (error) throw error;
      setStartedAt(new Date(data.started_at || Date.now()));
      setWorkoutId(data.id);
      return data.id;
    })();
    try { return await creatingWorkout.current; }
    finally { creatingWorkout.current = null; }
  }

  // --- Previous session: same user, same catalogue/custom source ---
  async function getPreviousSetsForExercise(exercise) {
    const column = isCustom(exercise) ? 'custom_exercise_id' : 'exercise_id';
    const { data: previousWorkout, error } = await supabase
      .from('workouts')
      .select(`id, ended_at, workout_sets!inner(${column})`)
      .eq('user_id', user.id)
      .eq(`workout_sets.${column}`, exercise.id)
      .not('ended_at', 'is', null)
      .order('ended_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !previousWorkout) {
      if (error) console.error('Previous workout:', error);
      return {};
    }
    const { data: sets, error: setsError } = await supabase
      .from('workout_sets').select('set_number, weight, reps, duration_seconds')
      .eq('workout_id', previousWorkout.id).eq(column, exercise.id).order('set_number');
    if (setsError) { console.error('Previous sets:', setsError); return {}; }
    return (sets || []).reduce((result, set) => ({
      ...result,
      [set.set_number]: { weight: set.weight, reps: set.reps, durationSeconds: set.duration_seconds },
    }), {});
  }

  // --- Notes remain catalogue-only until exercise_notes supports custom IDs ---
  async function getPreviousNoteForExercise(exerciseId) {
    const { data, error } = await supabase.from('exercise_notes')
      .select('note, updated_at, workouts!inner(user_id)')
      .eq('workouts.user_id', user.id).eq('exercise_id', exerciseId)
      .not('note', 'eq', '').order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (error) { console.error('Previous note:', error); return ''; }
    return data?.note ?? '';
  }

  async function getExistingNote(workoutIdToCheck, exerciseId) {
    if (!workoutIdToCheck) return '';
    const { data, error } = await supabase.from('exercise_notes').select('note')
      .eq('workout_id', workoutIdToCheck).eq('exercise_id', exerciseId).maybeSingle();
    if (error) { console.error('Load note:', error); return ''; }
    return data?.note ?? '';
  }

  // --- Existing progressive-overload algorithm, for catalogue only ---
  async function getProgressionSuggestion(exerciseId) {
    try {
      const { data: exercise, error: exerciseError } = await supabase.from('exercises')
        .select('id, progression_category').eq('id', exerciseId).single();
      if (exerciseError) throw exerciseError;
      const { data: userPrefs, error: prefsError } = await supabase.from('exercise_progression_prefs')
        .select('rep_min, rep_max, increment').eq('user_id', user.id).eq('exercise_id', exerciseId).maybeSingle();
      if (prefsError) throw prefsError;
      let trainingGoal = null;
      if (!userPrefs) {
        const { data: profile, error: profileError } = await supabase.from('profiles')
          .select('training_goal').eq('id', user.id).maybeSingle();
        if (profileError) throw profileError;
        trainingGoal = profile?.training_goal ?? null;
      }
      const increment = resolveIncrement({ userIncrement: userPrefs?.increment, category: exercise?.progression_category });
      const { repMin, repMax } = resolveRepRange({ userRepMin: userPrefs?.rep_min, userRepMax: userPrefs?.rep_max, goal: trainingGoal });
      const { data: sets, error: setsError } = await supabase.from('workout_sets')
        .select('reps, weight, set_number, workout_id, workouts!inner(ended_at, user_id)')
        .eq('exercise_id', exerciseId).eq('workouts.user_id', user.id)
        .not('workouts.ended_at', 'is', null)
        .order('ended_at', { ascending: false, foreignTable: 'workouts' })
        .limit(PROGRESSION_SESSION_LIMIT * 6);
      if (setsError) throw setsError;
      const byWorkout = new Map();
      for (const set of sets || []) {
        if (!byWorkout.has(set.workout_id)) byWorkout.set(set.workout_id, { endedAt: set.workouts.ended_at, setsByNumber: [] });
        byWorkout.get(set.workout_id).setsByNumber.push(set);
      }
      const sessions = Array.from(byWorkout.values())
        .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
        .slice(0, PROGRESSION_SESSION_LIMIT)
        .map((session) => ({ sets: session.setsByNumber.sort((a, b) => a.set_number - b.set_number)
          .map((set) => ({ weight: set.weight, reps: set.reps })) }));
      if (BODYWEIGHT_LOAD_EXERCISE_IDS.has(exerciseId)) {
        if (bodyWeight == null || bodyWeight <= 0) return null;
        const totalLoadSessions = sessions.map((session) => ({
          sets: session.sets.map((set) => ({ ...set, weight: (set.weight || 0) + bodyWeight })),
        }));
        const totalLoadSuggestion = suggestProgression(totalLoadSessions, { repMin, repMax, increment });
        if (!totalLoadSuggestion) return null;
        const toAddedLoad = (totalWeight) => totalWeight == null ? null : roundToIncrement(Math.max(0, totalWeight - bodyWeight), increment);
        return {
          ...totalLoadSuggestion,
          weight: toAddedLoad(totalLoadSuggestion.weight),
          previousBestSet: totalLoadSuggestion.previousBestSet
            ? { ...totalLoadSuggestion.previousBestSet, weight: toAddedLoad(totalLoadSuggestion.previousBestSet.weight) }
            : undefined,
          isBodyweightLoad: true,
        };
      }
      return suggestProgression(sessions, { repMin, repMax, increment });
    } catch (error) {
      console.error('Progression suggestion:', error);
      return null;
    }
  }

  // --- Add a selected exercise; custom exercises bypass catalogue-only features ---
  async function addExercise(exercise) {
    const normalized = { ...exercise, source: exercise.source === 'custom' ? 'custom' : 'catalogue' };
    const previousSets = await getPreviousSetsForExercise(normalized);
    const custom = isCustom(normalized);
    const note = custom ? '' : await getExistingNote(workoutId, normalized.id);
    const previousNote = custom || note ? '' : await getPreviousNoteForExercise(normalized.id);
    const suggestion = custom ? null : await getProgressionSuggestion(normalized.id);
    setExercises((current) => [...current, {
      ...normalized, previousSets, note, previousNote, suggestion,
      sets: [createSetFromSuggestion(suggestion, previousSets[1], normalized)],
    }]);
    setShowPicker(false);
  }

  // --- Saved routines: keep existing catalogue-only behavior for this stage ---
  async function loadRoutines() {
    setRoutinesLoading(true);
    setRoutineError('');
    const { data, error } = await supabase.from('routines')
      .select('id, name, updated_at, routine_exercises(position, default_sets, exercises(*))')
      .eq('user_id', user.id).order('updated_at', { ascending: false });
    if (error) { console.error('Load routines:', error); setRoutineError('Could not load your routines.'); }
    else setRoutines(data || []);
    setRoutinesLoading(false);
  }
  async function openRoutines() { setShowWorkoutMenu(true); await loadRoutines(); }
  function startEmptyWorkout() { resetWorkout(); setName(''); setShowPicker(true); }
  function toggleProgram(programId) { setExpandedProgramId((current) => current === programId ? null : programId); }

  async function startRoutine(routine) {
    setStartingRoutineId(routine.id);
    setRoutineError('');
    let fullRoutine = routine;
    const hasExerciseData = (routine.routine_exercises || []).some((item) => item.exercises && Object.keys(item.exercises).length > 1);
    if (!hasExerciseData) {
      const { data, error } = await supabase.from('routines')
        .select('id, name, routine_exercises(position, default_sets, exercises(*))')
        .eq('id', routine.id).single();
      if (error || !data) {
        console.error('Load routine for start:', error);
        setRoutineError('Could not load this routine.');
        setStartingRoutineId(null);
        return;
      }
      fullRoutine = data;
    }
    const items = [...(fullRoutine.routine_exercises || [])]
      .filter((item) => item.exercises).sort((a, b) => a.position - b.position);
    if (!items.length) {
      setRoutineError('This routine has no exercises yet.');
      setStartingRoutineId(null);
      return;
    }
    try {
      const nextExercises = await Promise.all(items.map(async (item) => {
        const normalized = { ...item.exercises, source: 'catalogue' };
        const previousSets = await getPreviousSetsForExercise(normalized);
        const previousNote = await getPreviousNoteForExercise(normalized.id);
        const suggestion = await getProgressionSuggestion(normalized.id);
        return {
          ...normalized, previousSets, note: '', previousNote, suggestion,
          sets: Array.from({ length: item.default_sets }, (_, index) => index === 0
            ? createSetFromSuggestion(suggestion, previousSets[1], normalized)
            : createSetFromPrevious(previousSets[index + 1], normalized)),
        };
      }));
      resetWorkout();
      setName(fullRoutine.name);
      setStartedAt(new Date());
      setExercises(nextExercises);
      setShowWorkoutMenu(false);
    } catch (error) { console.error('Start routine:', error); setRoutineError('Could not start this routine.'); }
    finally { setStartingRoutineId(null); }
  }

  // --- Editing exercise rows and sets ---
  async function removeExercise(index) {
    const exercise = exercises[index];
    const ids = exercise.sets.filter((set) => set.dbId).map((set) => set.dbId);
    if (ids.length) {
      const { error } = await supabase.from('workout_sets').delete().in('id', ids);
      if (error) { console.error(error); return; }
    }
    if (workoutId && !isCustom(exercise)) {
      const { error: noteError } = await supabase.from('exercise_notes').delete()
        .eq('workout_id', workoutId).eq('exercise_id', exercise.id);
      if (noteError) console.error('Delete note:', noteError);
    }
    clearTimeout(noteSaveTimers.current[exercise.id]);
    delete noteSaveTimers.current[exercise.id];
    setExercises((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function addSet(index) {
    patchExercise(index, (exercise) => {
      const nextSetNumber = exercise.sets.length + 1;
      const previousSet = exercise.previousSets?.[nextSetNumber];
      const suggestedWeight = isCustom(exercise) ? null : exercise.suggestion?.weight;
      return {
        ...exercise,
        sets: [...exercise.sets, suggestedWeight != null
          ? { ...EMPTY_SET, weight: suggestedWeight.toString(), wasSuggested: true }
          : createSetFromPrevious(previousSet, exercise)],
      };
    });
  }

  async function deleteSet(exerciseIndex, setIndex) {
    const set = exercises[exerciseIndex].sets[setIndex];
    if (set.saving) return;
    if (set.dbId) {
      const { error } = await supabase.from('workout_sets').delete().eq('id', set.dbId);
      if (error) { console.error(error); return; }
    }
    patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.filter((_, index) => index !== setIndex) }));
  }

  function updateSet(exerciseIndex, setIndex, field, value) {
    patchExercise(exerciseIndex, (item) => ({
      ...item,
      sets: item.sets.map((set, index) => index === setIndex
        ? { ...set, [field]: value, ...(field === 'weight' ? { wasSuggested: false } : {}) }
        : set),
    }));
  }

  function updateNote(exerciseIndex, exerciseId, value) {
    if (isCustom(exercises[exerciseIndex])) return;
    patchExercise(exerciseIndex, (item) => ({ ...item, note: value }));
    clearTimeout(noteSaveTimers.current[exerciseId]);
    noteSaveTimers.current[exerciseId] = setTimeout(async () => {
      try {
        const currentWorkoutId = await ensureWorkout();
        const { error } = await supabase.from('exercise_notes').upsert(
          { workout_id: currentWorkoutId, exercise_id: exerciseId, user_id: user.id, note: value, updated_at: new Date() },
          { onConflict: 'workout_id,exercise_id' }
        );
        if (error) console.error('Save note:', error);
      } catch (error) { console.error('Save note:', error); }
    }, NOTE_SAVE_DEBOUNCE_MS);
  }

  // --- Save/undo a set; only custom sets use custom_exercise_id ---
  async function toggleSetDone(exerciseIndex, setIndex) {
    const exercise = exercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    if (set.saving) return;
    if (!set.done) {
      const custom = isCustom(exercise);
      const timed = isTimed(exercise);
      const reps = Number(set.reps);
      const seconds = Number(set.durationSeconds);
      const weight = set.weight === '' ? (custom ? null : NaN) : Number(set.weight);
      if (timed ? !Number.isInteger(seconds) || seconds <= 0 : !Number.isInteger(reps) || reps <= 0) return;
      if (weight !== null && !Number.isFinite(weight)) return;
      patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((current, index) =>
        index === setIndex ? { ...current, saving: true, isPR: false } : current) }));
      try {
        const currentWorkoutId = await ensureWorkout();
        const { data, error } = await supabase.from('workout_sets').insert({
          workout_id: currentWorkoutId,
          exercise_id: custom ? null : exercise.id,
          custom_exercise_id: custom ? exercise.id : null,
          reps: timed ? null : reps,
          duration_seconds: timed ? seconds : null,
          weight,
          set_number: setIndex + 1,
        }).select('id').single();
        if (error) throw error;
        patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((current, index) =>
          index === setIndex ? { ...current, dbId: data.id, done: true, saving: false } : current) }));
        if (!custom) {
          const { data: pr, error: prError } = await supabase.from('personal_records').select('id').eq('set_id', data.id).maybeSingle();
          if (prError) console.error(prError);
          if (pr) {
            patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((current, index) =>
              index === setIndex ? { ...current, isPR: true } : current) }));
            setToast({ exercise: exercise.name, weight: set.weight, reps: set.reps });
          }
        }
        startRestTimer(exerciseKey(exercise));
      } catch (error) {
        console.error('Save set:', error);
        patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((current, index) =>
          index === setIndex ? { ...current, saving: false, done: false, dbId: null, isPR: false } : current) }));
      }
      return;
    }
    if (set.dbId) {
      const { error } = await supabase.from('workout_sets').delete().eq('id', set.dbId);
      if (error) { console.error(error); return; }
    }
    patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((current, index) =>
      index === setIndex ? { ...current, done: false, saving: false, dbId: null, isPR: false } : current) }));
  }

  // --- Finish or discard workout; only catalogue exercises have ranks ---
  async function finishWorkout() {
    if (!workoutId) { resetWorkout(); return; }
    const { data: workout, error } = await supabase.from('workouts')
      .select('*, workout_sets(*, exercises(id, name))').eq('id', workoutId).single();
    if (error) { console.error(error); return; }
    const totalSets = workout.workout_sets?.length || 0;
    const totalVolume = workout.workout_sets?.reduce((sum, set) =>
      sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0) || 0;
    const completedAt = endedAt || new Date();
    const minutes = startedAt ? Math.max(0, Math.round((new Date(completedAt) - new Date(startedAt)) / 60000)) : 0;
    const { error: updateError } = await supabase.from('workouts')
      .update({ name, ended_at: completedAt, sets: totalSets, volume: totalVolume, duration: minutes })
      .eq('id', workoutId);
    if (updateError) { console.error(updateError); return; }
    const { error: postError } = await supabase.from('workout_posts').insert({
      workout_id: workoutId, user_id: user.id, caption: name || null, visibility: 'public',
    });
    if (postError) console.error('Failed to create workout post:', postError);
    const ids = [...new Set((workout.workout_sets || []).map((set) => set.exercises?.id).filter(Boolean))];
    let ranks = [];
    if (ids.length) {
      const { data, error: rankError } = await supabase.from('exercise_ranks')
        .select('exercise_id, rank, best_1rm, exercises(name)').eq('user_id', user.id).in('exercise_id', ids);
      if (rankError) console.error('Load ranks:', rankError);
      ranks = data || [];
    }
    setSummary({ totalSets, totalVolume, minutes, ranks });
    resetWorkout();
  }

  async function deleteWorkout() {
    if (workoutId) {
      const { error: setsError } = await supabase.from('workout_sets').delete().eq('workout_id', workoutId);
      if (setsError) { console.error(setsError); return; }
      const { error: notesError } = await supabase.from('exercise_notes').delete().eq('workout_id', workoutId);
      if (notesError) console.error(notesError);
      const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
      if (error) { console.error(error); return; }
    }
    resetWorkout();
    setConfirmingDelete(false);
  }

  // --- Workout page and exercise cards ---
  if (authLoading || !user) return <div className="workout-loading">Loading...</div>;
  const workoutStarted = Boolean(workoutId);
  return (
    <main className="workout-page">
      <div className="workout-page__content">
        <header className="workout-page__header">
          <h1 className="workout-page__title">Workout</h1>
          {workoutStarted && startedAt
            ? <WorkoutTimer startedAt={startedAt} />
            : <button className="workout-new-button" onClick={openRoutines}><ListPlus size={18} /> Routines</button>}
        </header>
        <PRToast toast={toast} />
        {exercises.length === 0 ? (
          <section className="workout-empty-state">
            <Dumbbell size={34} />
            <h2>Ready to train?</h2>
            <p>Start an empty workout or choose a saved routine.</p>
            <button className="workout-empty-state__button" onClick={startEmptyWorkout}><Plus size={18} /> Add exercise</button>
          </section>
        ) : (
          <>
            <SessionMuscleMap exercises={exercises.filter((exercise) => !isCustom(exercise))} />
            <section className="workout-exercises">
              {exercises.map((exercise, exerciseIndex) => (
                <article className="workout-card" key={exerciseKey(exercise)}>
                  <header className="workout-card__header">
                    <div className="workout-card__exercise-info">
                      {exercise.images?.[0] && <img className="workout-card__thumbnail" src={imageUrl(exercise.images[0])} alt={exercise.name} />}
                      <span className="workout-card__exercise-name">{exercise.name}</span>
                      {!isCustom(exercise) && <ExerciseRankBadge exerciseId={exercise.id} userId={user.id} />}
                      <button className="icon-button icon-button--delete" onClick={() => removeExercise(exerciseIndex)} aria-label={`Remove ${exercise.name}`}><Trash size={16} /></button>
                      {restTimer.startedAt && restTimer.exerciseId === exerciseKey(exercise) && <RestTimer startedAt={restTimer.startedAt} />}
                    </div>
                    {exercise.suggestion?.targetReps && (
                      <p className="workout-card__progression-hint">
                        {exercise.suggestion.reason === 'progress' && exercise.suggestion.isBodyweightLoad && (
                          exercise.suggestion.previousBestSet
                            ? `You hit ${exercise.suggestion.previousBestSet.reps} reps last time. If possible, add ${exercise.suggestion.weight}kg this session and aim for ${exercise.suggestion.targetReps} reps. If not, aim for ${exercise.suggestion.previousBestSet.reps + 1}-${exercise.suggestion.previousBestSet.reps + 2} reps instead.`
                            : `Add ${exercise.suggestion.weight}kg this session — aim for ${exercise.suggestion.targetReps} reps.`
                        )}
                        {exercise.suggestion.reason === 'progress' && !exercise.suggestion.isBodyweightLoad && (
                          exercise.suggestion.previousBestSet
                            ? `You hit ${exercise.suggestion.previousBestSet.reps} reps at ${exercise.suggestion.previousBestSet.weight}kg last time. Increase the weight to ${exercise.suggestion.weight}kg, aim for ${exercise.suggestion.targetReps} reps.`
                            : `Increase the weight up to ${exercise.suggestion.weight}kg and aim for ${exercise.suggestion.targetReps} reps.`
                        )}
                        {exercise.suggestion.reason === 'add-load' && exercise.suggestion.previousBestSet &&
                          `You hit ${exercise.suggestion.previousBestSet.reps} bodyweight reps last time. You should try adding some weight (vest/belt) instead of chasing more reps.`}
                        {exercise.suggestion.reason === 'deload' && `You stalled a few sessions in a row, try easing back, aim for ${exercise.suggestion.targetReps} reps.`}
                        {exercise.suggestion.reason === 'repeat' && exercise.suggestion.previousBestSet && (
                          exercise.suggestion.previousBestSet.reps >= exercise.suggestion.targetReps
                            ? `Your best set last time was ${exercise.suggestion.previousBestSet.weight}×${exercise.suggestion.previousBestSet.reps}, you should get every set to those reps.`
                            : `Your best set last time was ${exercise.suggestion.previousBestSet.weight}×${exercise.suggestion.previousBestSet.reps}. Try to get ${exercise.suggestion.targetReps} this time.`
                        )}
                        {exercise.suggestion.reason === 'repeat' && !exercise.suggestion.previousBestSet &&
                          `You should use the same weight as last time, aim for ${exercise.suggestion.targetReps} reps`}
                      </p>
                    )}
                  </header>

                  {/* Notes are not supported for custom IDs by the current exercise_notes schema. */}
                  {!isCustom(exercise) && (
                    <div className="workout-card__note">
                      <textarea className="workout-card__note-input" placeholder="Add notes here..."
                        value={exercise.note ?? ''} onChange={(event) => updateNote(exerciseIndex, exercise.id, event.target.value)} rows={1} />
                      {!exercise.note && exercise.previousNote && <p className="workout-card__note-previous">Last time: {exercise.previousNote}</p>}
                    </div>
                  )}

                  {/* A timed custom exercise stores seconds, not reps. */}
                  <div className="set-table">
                    <div className="set-table__header">
                      <span>Set</span><span>Previous</span><span>Weight</span>
                      <span>{isTimed(exercise) ? 'Seconds' : 'Reps'}</span><span /><span /><span />
                    </div>
                    {exercise.sets.map((set, setIndex) => {
                      const previous = exercise.previousSets?.[setIndex + 1];
                      const timed = isTimed(exercise);
                      const metric = timed ? 'durationSeconds' : 'reps';
                      const previousLabel = !previous ? '—' : timed
                        ? `${previous.durationSeconds ?? '—'} s${previous.weight != null ? ` · ${previous.weight} kg` : ''}`
                        : `${previous.weight ?? '—'} × ${previous.reps ?? '—'}`;
                      return (
                        <div className={`set-row ${set.done ? 'set-row--completed' : ''}`} key={set.dbId ?? `local-${setIndex}`}>
                          <span className="set-row__number">{setIndex + 1}</span>
                          <span className={`set-row__previous ${previous ? '' : 'set-row__previous--empty'}`}>{previousLabel}</span>
                          <input className={`set-row__input ${set.wasSuggested && !set.done ? 'set-row__input--suggested' : ''}`}
                            type="number" step="0.5" placeholder={previous?.weight ?? 'weight'} value={set.weight}
                            disabled={set.done} onChange={(event) => updateSet(exerciseIndex, setIndex, 'weight', event.target.value)} />
                          <input className="set-row__input" type="number" min="1" step="1"
                            placeholder={previous?.[metric] ?? (timed ? 'seconds' : 'reps')}
                            value={set[metric] ?? ''} disabled={set.done}
                            onChange={(event) => updateSet(exerciseIndex, setIndex, metric, event.target.value)} />
                          <span className="set-row__pr-icon">{set.isPR ? '🥇' : ''}</span>
                          <button className={`set-row__check-button ${set.done ? 'set-row__check-button--active' : ''}`}
                            onClick={() => toggleSetDone(exerciseIndex, setIndex)} disabled={set.saving}>
                            {set.saving ? '…' : '✓'}
                          </button>
                          <button className="set-row__delete-button" onClick={() => deleteSet(exerciseIndex, setIndex)}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                  <button className="add-set-button" onClick={() => addSet(exerciseIndex)}>+ Add Set</button>
                </article>
              ))}
            </section>
            <button className="add-exercise-button" onClick={() => setShowPicker(true)}>+ Add Exercise</button>
            <div className="workout-actions">
              <button className="finish-workout-button" onClick={() => { setEndedAt(new Date()); setFinished(true); }}>Finish Workout</button>
              <button className="delete-workout-button" onClick={() => setConfirmingDelete(true)}>Discard</button>
            </div>
          </>
        )}
        <div className="workout-bottom-spacer" />

        {/* Exercise picker and routine/program selector */}
        {showPicker && <ExercisePicker onSelect={addExercise} onClose={() => setShowPicker(false)} />}
        {showWorkoutMenu && (
          <div className="confirmation-overlay" onMouseDown={() => setShowWorkoutMenu(false)}>
            <section className="workout-picker-dialog" role="dialog" onMouseDown={(event) => event.stopPropagation()}>
              <header className="workout-picker-dialog__header">
                <div><p>Routines</p><h2>Your training plans</h2></div>
                <button className="icon-button" onClick={() => setShowWorkoutMenu(false)} aria-label="Close routines"><X size={20} /></button>
              </header>
              <button className="workout-choice-card" onClick={() => { setShowWorkoutMenu(false); navigate('/routines/new'); }}>
                <ListPlus size={21} /><span><strong>Create routine</strong><small>Build a repeatable workout</small></span>
              </button>
              <button className="workout-choice-card" onClick={() => { setShowWorkoutMenu(false); navigate('/routines'); }}>
                <Compass size={21} /><span><strong>Explore routines</strong><small>Discover public routines</small></span>
              </button>
              <button className="workout-choice-card" onClick={() => { setShowWorkoutMenu(false); navigate('/programs'); }}>
                <Notebook size={21} /><span><strong>Explore Programs</strong><small>Discover public splits</small></span>
              </button>
              <div className="workout-picker-dialog__routines-header"><span>Saved routines</span><span>{routines.length}</span></div>
              {routinesLoading && <p className="workout-picker-dialog__status">Loading routines…</p>}
              {routineError && <p className="workout-picker-dialog__error">{routineError}</p>}
              {!routinesLoading && !routineError && !routines.length &&
                <p className="workout-picker-dialog__status">No saved routines yet. Create your first one above.</p>}
              <div className="workout-picker-dialog__routine-list">
                {routines.map((routine) => {
                  const exerciseCount = routine.routine_exercises?.length || 0;
                  const setCount = routine.routine_exercises?.reduce((total, item) => total + item.default_sets, 0) || 0;
                  return (
                    <button className="saved-routine-card" key={routine.id} onClick={() => startRoutine(routine)} disabled={startingRoutineId !== null}>
                      <span><strong>{routine.name}</strong><small>{exerciseCount} exercises · {setCount} sets</small></span>
                      <span className="saved-routine-card__start">{startingRoutineId === routine.id ? 'Starting…' : 'Start'}</span>
                    </button>
                  );
                })}
              </div>
              <div className="workout-picker-dialog__routines-header"><span>Saved programs</span><span>{programs.length}</span></div>
              {programsLoading && <p className="workout-picker-dialog__status">Loading programs…</p>}
              {programsError && <p className="workout-picker-dialog__error">{programsError}</p>}
              {!programsLoading && !programsError && !programs.length &&
                <p className="workout-picker-dialog__status">No saved programs yet. Explore public splits above.</p>}
              <div className="workout-picker-dialog__routine-list">
                {programs.map((program) => {
                  const days = program.program_routines || [];
                  const isExpanded = expandedProgramId === program.id;
                  return (
                    <div className="workout-picker-dialog__program" key={program.id}>
                      <button type="button" className="saved-routine-card" onClick={() => toggleProgram(program.id)} aria-expanded={isExpanded}>
                        <span><strong><Layers size={15} style={{ marginRight: 6, verticalAlign: -2 }} />{program.name}</strong>
                          <small>{days.length} day{days.length === 1 ? '' : 's'}</small></span>
                        <span className="saved-routine-card__start">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
                      </button>
                      {isExpanded && (
                        <div className="workout-picker-dialog__program-days">
                          {days.length === 0
                            ? <p className="workout-picker-dialog__status">This program has no days yet.</p>
                            : days.map((slot) => {
                              const routine = slot.routines;
                              return (
                                <button type="button" key={slot.id} className="saved-routine-card saved-routine-card--day"
                                  disabled={!routine || startingRoutineId !== null} onClick={() => routine && startRoutine(routine)}>
                                  <span><strong>{slot.day_label}</strong><small>{routine?.name || 'Routine unavailable'}</small></span>
                                  <span className="saved-routine-card__start">{startingRoutineId === routine?.id ? 'Starting…' : 'Start'}</span>
                                </button>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Finish and discard confirmations */}
        {finished && (
          <div className="confirmation-overlay"><div className="confirmation-dialog">
            <p className="confirmation-dialog__text">Are you sure you want to finish the workout?</p>
            <input className="confirmation-dialog__input" placeholder="Enter workout name" value={name} onChange={(event) => setName(event.target.value)} />
            <div className="confirmation-dialog__actions">
              <button className="confirmation-dialog__button confirmation-dialog__button--primary" onClick={() => { void finishWorkout(); setFinished(false); }}>Finish workout</button>
              <button className="confirmation-dialog__button" onClick={() => setFinished(false)}>Cancel</button>
            </div>
          </div></div>
        )}
        {confirmingDelete && (
          <div className="confirmation-overlay"><div className="confirmation-dialog">
            <p className="confirmation-dialog__text">Delete this entire workout? This cannot be undone.</p>
            <div className="confirmation-dialog__actions">
              <button className="confirmation-dialog__button confirmation-dialog__button--danger" onClick={deleteWorkout}>Yes, delete</button>
              <button className="confirmation-dialog__button" onClick={() => setConfirmingDelete(false)}>Cancel</button>
            </div>
          </div></div>
        )}
        <WorkoutSummary summary={summary} onClose={() => setSummary(null)} />
      </div>
    </main>
  );
}