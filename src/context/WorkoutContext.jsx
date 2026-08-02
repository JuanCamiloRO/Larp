// context/WorkoutContext.jsx
import { createContext, useContext, useState } from 'react';

const WorkoutContext = createContext(null);

export default function WorkoutProvider({ children }) {
  const [workoutId, setWorkoutId] = useState(null);
  const [name, setName] = useState('');
  const [startedAt, setStartedAt] = useState(null);
  const [endedAt, setEndedAt] = useState(null);
  const [exercises, setExercises] = useState([]);

  function resetWorkout() {
    setWorkoutId(null);
    setName('');
    setStartedAt(null);
    setEndedAt(null);
    setExercises([]);
  }

  const value = {
    workoutId, setWorkoutId,
    name, setName,
    startedAt, setStartedAt,
    endedAt, setEndedAt,
    exercises, setExercises,
    resetWorkout,
    isActive: !!workoutId || exercises.length > 0,
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