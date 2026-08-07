import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Dumbbell, ListPlus, Plus, Trash, X } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth';
import { useWorkoutContext } from '../context/WorkoutContext';
import ExercisePicker from '../components/ExercisePicker';
import ExerciseRankBadge from '../components/ExerciseRankBadge';
import PRToast from '../components/PRToast';
import WorkoutSummary from '../components/WorkoutSummary';
import SessionMuscleMap from '../components/SessionMuscleMap';
import '../css/workout.css';

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const EMPTY_SET = { dbId: null, reps: '', weight: '', done: false, isPR: false, saving: false };

export default function Workout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { workoutId, setWorkoutId, name, setName, startedAt, setStartedAt, endedAt, setEndedAt, exercises, setExercises, resetWorkout } = useWorkoutContext();
  const [showPicker, setShowPicker] = useState(false);
  const [showWorkoutMenu, setShowWorkoutMenu] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [routinesLoading, setRoutinesLoading] = useState(false);
  const [startingRoutineId, setStartingRoutineId] = useState(null);
  const [routineError, setRoutineError] = useState('');
  const [finished, setFinished] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [toast, setToast] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(null), 2500); return () => clearTimeout(timer); }, [toast]);
  const imageUrl = (image) => image.startsWith('http') ? image : `${IMAGE_BASE_URL}${image}`;
  const patchExercise = (index, updater) => setExercises((current) => current.map((item, itemIndex) => itemIndex === index ? updater(item) : item));

  async function ensureWorkout() {
    if (workoutId) return workoutId;
    if (!startedAt) setStartedAt(new Date());
    const { data, error } = await supabase.from('workouts').insert({ user_id: user.id }).select().single();
    if (error) { console.error('Failed to create workout:', error); return null; }
    setWorkoutId(data.id);
    return data.id;
  }

  async function getPreviousSetsForExercise(exerciseId) {
    const { data: previousWorkout, error } = await supabase.from('workouts').select('id, ended_at, workout_sets!inner(exercise_id)').eq('user_id', user.id).eq('workout_sets.exercise_id', exerciseId).not('ended_at', 'is', null).order('ended_at', { ascending: false }).limit(1).maybeSingle();
    if (error || !previousWorkout) { if (error) console.error('Previous workout:', error); return {}; }
    const { data: sets, error: setsError } = await supabase.from('workout_sets').select('set_number, weight, reps').eq('workout_id', previousWorkout.id).eq('exercise_id', exerciseId).order('set_number');
    if (setsError) { console.error('Previous sets:', setsError); return {}; }
    return (sets || []).reduce((result, set) => ({ ...result, [set.set_number]: { weight: set.weight, reps: set.reps } }), {});
  }

  async function addExercise(exercise) {
    const previousSets = await getPreviousSetsForExercise(exercise.id);
    setExercises((current) => [...current, { ...exercise, previousSets, sets: [{ ...EMPTY_SET }] }]);
    setShowPicker(false);
  }

  async function loadRoutines() {
    setRoutinesLoading(true); setRoutineError('');
    const { data, error } = await supabase.from('routines').select('id, name, updated_at, routine_exercises(position, default_sets, exercises(*))').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (error) { console.error('Load routines:', error); setRoutineError('Could not load your routines.'); } else setRoutines(data || []);
    setRoutinesLoading(false);
  }

  async function openRoutines() { setShowWorkoutMenu(true); await loadRoutines(); }
  function startEmptyWorkout() { resetWorkout(); setName(''); setShowPicker(true); }

  async function startRoutine(routine) {
    const items = [...(routine.routine_exercises || [])].filter((item) => item.exercises).sort((a, b) => a.position - b.position);
    if (!items.length) return setRoutineError('This routine has no exercises yet.');
    setStartingRoutineId(routine.id); setRoutineError('');
    try {
      const nextExercises = await Promise.all(items.map(async (item) => ({ ...item.exercises, previousSets: await getPreviousSetsForExercise(item.exercises.id), sets: Array.from({ length: item.default_sets }, () => ({ ...EMPTY_SET })) })));
      resetWorkout(); setName(routine.name); setStartedAt(new Date()); setExercises(nextExercises); setShowWorkoutMenu(false);
    } catch (error) { console.error('Start routine:', error); setRoutineError('Could not start this routine.'); }
    finally { setStartingRoutineId(null); }
  }

  async function removeExercise(index) {
    const ids = exercises[index].sets.filter((set) => set.dbId).map((set) => set.dbId);
    if (ids.length) { const { error } = await supabase.from('workout_sets').delete().in('id', ids); if (error) return console.error(error); }
    setExercises((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }
  function addSet(index) { patchExercise(index, (item) => ({ ...item, sets: [...item.sets, { ...EMPTY_SET }] })); }
  async function deleteSet(exerciseIndex, setIndex) {
    const set = exercises[exerciseIndex].sets[setIndex];
    if (set.dbId) { const { error } = await supabase.from('workout_sets').delete().eq('id', set.dbId); if (error) return console.error(error); }
    patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.filter((_, index) => index !== setIndex) }));
  }
  function updateSet(exerciseIndex, setIndex, field, value) { patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((set, index) => index === setIndex ? { ...set, [field]: value } : set) })); }

  async function toggleSetDone(exerciseIndex, setIndex) {
    const exercise = exercises[exerciseIndex]; const set = exercise.sets[setIndex];
    if (set.saving) return;
    if (!set.done) {
      if (set.weight === '' || set.reps === '') return;
      patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((current, index) => index === setIndex ? { ...current, done: true, saving: true, isPR: false } : current) }));
      try {
        const currentWorkoutId = await ensureWorkout(); if (!currentWorkoutId) throw new Error('No workout');
        const { data, error } = await supabase.from('workout_sets').insert({ workout_id: currentWorkoutId, exercise_id: exercise.id, reps: Number(set.reps), weight: Number(set.weight), set_number: setIndex + 1 }).select().single();
        if (error) throw error;
        patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((current, index) => index === setIndex ? { ...current, dbId: data.id, saving: false } : current) }));
        const { data: pr, error: prError } = await supabase.from('personal_records').select('id').eq('set_id', data.id).maybeSingle();
        if (prError) console.error(prError);
        if (pr) { patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((current, index) => index === setIndex ? { ...current, isPR: true } : current) })); setToast({ exercise: exercise.name, weight: set.weight, reps: set.reps }); }
      } catch (error) {
        console.error('Save set:', error);
        patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((current, index) => index === setIndex ? { ...current, done: false, saving: false, dbId: null, isPR: false } : current) }));
      }
      return;
    }
    if (set.dbId) { const { error } = await supabase.from('workout_sets').delete().eq('id', set.dbId); if (error) return console.error(error); }
    patchExercise(exerciseIndex, (item) => ({ ...item, sets: item.sets.map((current, index) => index === setIndex ? { ...current, done: false, saving: false, dbId: null, isPR: false } : current) }));
  }

 async function finishWorkout() {
    if (!workoutId) return resetWorkout();
    const { data: workout, error } = await supabase.from('workouts').select('*, workout_sets(*, exercises(id, name))').eq('id', workoutId).single();
    if (error) return console.error(error);
    const totalSets = workout.workout_sets?.length || 0;
    const totalVolume = workout.workout_sets?.reduce((sum, set) => sum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0);
    const completedAt = endedAt || new Date(); const minutes = startedAt ? Math.max(0, Math.round((new Date(completedAt) - new Date(startedAt)) / 60000)) : 0;
    const { error: updateError } = await supabase.from('workouts').update({ name, ended_at: completedAt, sets: totalSets, volume: totalVolume, duration: minutes }).eq('id', workoutId);
    if (updateError) return console.error(updateError);

    const { error: postError } = await supabase.from('workout_posts').insert({
      workout_id: workoutId,
      user_id: user.id,
      caption: name || null,
      visibility: 'public',
    });
    if (postError) console.error('Failed to create workout post:', postError);

    const ids = [...new Set((workout.workout_sets || []).map((set) => set.exercises?.id).filter(Boolean))];
    let ranks = [];
    if (ids.length) { const { data } = await supabase.from('exercise_ranks').select('exercise_id, rank, best_1rm, exercises(name)').eq('user_id', user.id).in('exercise_id', ids); ranks = data || []; }
    setSummary({ totalSets, totalVolume, minutes, ranks }); resetWorkout();
  }

  async function deleteWorkout() {
    if (workoutId) { const { error: setsError } = await supabase.from('workout_sets').delete().eq('workout_id', workoutId); if (setsError) return console.error(setsError); const { error } = await supabase.from('workouts').delete().eq('id', workoutId); if (error) return console.error(error); }
    resetWorkout(); setConfirmingDelete(false);
  }

  if (authLoading || !user) return <div className="workout-loading">Loading...</div>;
  return <main className="workout-page"><div className="workout-page__content">
    <header className="workout-page__header"><h1 className="workout-page__title">Workout</h1><button className="workout-new-button" onClick={openRoutines}><ListPlus size={18} /> Routines</button></header>
    <PRToast toast={toast} />
    {exercises.length === 0 ? <section className="workout-empty-state"><Dumbbell size={34} /><h2>Ready to train?</h2><p>Start an empty workout or choose a saved routine.</p><button className="workout-empty-state__button" onClick={startEmptyWorkout}><Plus size={18} /> Add exercise</button></section> : <>
      <SessionMuscleMap exercises={exercises} />
      <section className="workout-exercises">{exercises.map((exercise, exerciseIndex) => <article className="workout-card" key={exercise.id}><header className="workout-card__header"><div className="workout-card__exercise-info">{exercise.images?.[0] && <img className="workout-card__thumbnail" src={imageUrl(exercise.images[0])} alt={exercise.name} />}<span className="workout-card__exercise-name">{exercise.name}</span><ExerciseRankBadge exerciseId={exercise.id} userId={user.id} /><button className="icon-button icon-button--delete" onClick={() => removeExercise(exerciseIndex)}><Trash size={16} /></button></div></header><div className="set-table"><div className="set-table__header"><span>Set</span><span>Previous</span><span>Weight</span><span>Reps</span><span /><span /><span /></div>{exercise.sets.map((set, setIndex) => { const previous = exercise.previousSets?.[setIndex + 1]; return <div className={`set-row ${set.done ? 'set-row--completed' : ''}`} key={set.dbId ?? `local-${setIndex}`}><span className="set-row__number">{setIndex + 1}</span><span className={`set-row__previous ${previous ? '' : 'set-row__previous--empty'}`}>{previous ? `${previous.weight} × ${previous.reps}` : '—'}</span><input className="set-row__input" type="number" step="0.5" placeholder={previous ? previous.weight : 'weight'} value={set.weight} disabled={set.done} onChange={(event) => updateSet(exerciseIndex, setIndex, 'weight', event.target.value)} /><input className="set-row__input" type="number" step="1" placeholder={previous ? previous.reps : 'reps'} value={set.reps} disabled={set.done} onChange={(event) => updateSet(exerciseIndex, setIndex, 'reps', event.target.value)} /><span className="set-row__pr-icon">{set.isPR ? '🥇' : ''}</span><button className={`set-row__check-button ${set.done ? 'set-row__check-button--active' : ''}`} onClick={() => toggleSetDone(exerciseIndex, setIndex)} disabled={set.saving}>{set.saving ? '…' : '✓'}</button><button className="set-row__delete-button" onClick={() => deleteSet(exerciseIndex, setIndex)}>✕</button></div>; })}</div><button className="add-set-button" onClick={() => addSet(exerciseIndex)}>+ Add Set</button></article>)}</section>
      <button className="add-exercise-button" onClick={() => setShowPicker(true)}>+ Add Exercise</button><div className="workout-actions"><button className="finish-workout-button" onClick={() => { setEndedAt(new Date()); setFinished(true); }}>Finish Workout</button><button className="delete-workout-button" onClick={() => setConfirmingDelete(true)}>Delete</button></div>
    </>}
    <div className="workout-bottom-spacer" />
    {showPicker && <ExercisePicker onSelect={addExercise} onClose={() => setShowPicker(false)} />}
    {showWorkoutMenu && <div className="confirmation-overlay" onMouseDown={() => setShowWorkoutMenu(false)}><section className="workout-picker-dialog" role="dialog" onMouseDown={(event) => event.stopPropagation()}><header className="workout-picker-dialog__header"><div><p>Routines</p><h2>Your training plans</h2></div><button className="icon-button" onClick={() => setShowWorkoutMenu(false)}><X size={20} /></button></header><button className="workout-choice-card" onClick={() => { setShowWorkoutMenu(false); navigate('/routines/new'); }}><ListPlus size={21} /><span><strong>Create routine</strong><small>Build a repeatable workout</small></span></button><button className="workout-choice-card"   onClick={() => { setShowWorkoutMenu(false); navigate('/routines'); }}><Compass size={21} /><span><strong>Explore routines</strong><small>Discover public routines soon</small></span></button><div className="workout-picker-dialog__routines-header"><span>Saved routines</span><span>{routines.length}</span></div>{routinesLoading && <p className="workout-picker-dialog__status">Loading routines…</p>}{routineError && <p className="workout-picker-dialog__error">{routineError}</p>}{!routinesLoading && !routineError && !routines.length && <p className="workout-picker-dialog__status">No saved routines yet. Create your first one above.</p>}<div className="workout-picker-dialog__routine-list">{routines.map((routine) => { const count = routine.routine_exercises?.length || 0; const sets = routine.routine_exercises?.reduce((sum, item) => sum + item.default_sets, 0) || 0; return <button className="saved-routine-card" key={routine.id} onClick={() => startRoutine(routine)} disabled={startingRoutineId !== null}><span><strong>{routine.name}</strong><small>{count} exercises · {sets} sets</small></span><span className="saved-routine-card__start">{startingRoutineId === routine.id ? 'Starting…' : 'Start'}</span></button>; })}</div></section></div>}
    {finished && <div className="confirmation-overlay"><div className="confirmation-dialog"><p className="confirmation-dialog__text">Are you sure you want to finish the workout?</p><input className="confirmation-dialog__input" placeholder="Enter workout name" value={name} onChange={(event) => setName(event.target.value)} /><div className="confirmation-dialog__actions"><button className="confirmation-dialog__button confirmation-dialog__button--primary" onClick={() => { finishWorkout(); setFinished(false); }}>Finish workout</button><button className="confirmation-dialog__button" onClick={() => setFinished(false)}>Cancel</button></div></div></div>}
    {confirmingDelete && <div className="confirmation-overlay"><div className="confirmation-dialog"><p className="confirmation-dialog__text">Delete this entire workout? This cannot be undone.</p><div className="confirmation-dialog__actions"><button className="confirmation-dialog__button confirmation-dialog__button--danger" onClick={deleteWorkout}>Yes, delete</button><button className="confirmation-dialog__button" onClick={() => setConfirmingDelete(false)}>Cancel</button></div></div></div>}
    <WorkoutSummary summary={summary} onClose={() => setSummary(null)} />
  </div></main>;
}