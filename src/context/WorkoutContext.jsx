// context/WorkoutContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

const WorkoutContext = createContext(null);

const DRAFT_KEY = 'larp-workout-draft-v1';
const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000; // borradores de más de 24h se descartan
const EMPTY_REST_TIMER = { startedAt: null, exerciseId: null };

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);

    // JSON convierte las fechas en texto, hay que volver a hacerlas Date
    const startedAt = draft.startedAt ? new Date(draft.startedAt) : null;
    if (startedAt && Date.now() - startedAt.getTime() > MAX_DRAFT_AGE_MS) {
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }

    return {
      workoutId: draft.workoutId ?? null,
      name: draft.name ?? '',
      startedAt,
      exercises: (draft.exercises ?? []).map((exercise) => ({
        ...exercise,
        sets: (exercise.sets ?? []).map((set) => ({
          ...set,
          saving: false, // si la app se cerró a mitad de guardado, no dejar el botón bloqueado
          // una serie marcada como hecha que nunca llegó a la BD no cuenta como hecha
          ...(set.done && !set.dbId ? { done: false } : {}),
        })),
      })),
    };
  } catch (error) {
    console.error('Could not restore workout draft:', error);
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* nada más que hacer */ }
    return null;
  }
}

export default function WorkoutProvider({ children }) {
  const [draft] = useState(loadDraft); // se ejecuta una sola vez, al arrancar

  const [workoutId, setWorkoutId] = useState(draft?.workoutId ?? null);
  const [name, setName] = useState(draft?.name ?? '');
  const [startedAt, setStartedAt] = useState(draft?.startedAt ?? null);
  const [endedAt, setEndedAt] = useState(null);
  const [exercises, setExercises] = useState(draft?.exercises ?? []);
  const [restTimer, setRestTimer] = useState(EMPTY_REST_TIMER); // no se persiste a propósito

  // Guardar el borrador cada vez que cambia algo relevante
  useEffect(() => {
    try {
      if (!workoutId && exercises.length === 0) {
        localStorage.removeItem(DRAFT_KEY); // no hay entreno activo
        return;
      }
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ workoutId, name, startedAt, exercises })
      );
    } catch (error) {
      console.error('Could not save workout draft:', error);
    }
  }, [workoutId, name, startedAt, exercises]);

  function startRestTimer(exerciseId) {
    setRestTimer({ startedAt: Date.now(), exerciseId });
  }

  function clearRestTimer() {
    setRestTimer(EMPTY_REST_TIMER);
  }

  function resetWorkout() {
    setWorkoutId(null);
    setName('');
    setStartedAt(null);
    setEndedAt(null);
    setExercises([]);
    setRestTimer(EMPTY_REST_TIMER);
    // el efecto de arriba borra el borrador al ver el estado vacío
  }

  const value = {
    workoutId, setWorkoutId,
    name, setName,
    startedAt, setStartedAt,
    endedAt, setEndedAt,
    exercises, setExercises,
    resetWorkout,
    isActive: !!workoutId || exercises.length > 0,
    restTimer,
    startRestTimer,
    clearRestTimer,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkoutContext() {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkoutContext must be used within WorkoutProvider');
  return ctx;
}