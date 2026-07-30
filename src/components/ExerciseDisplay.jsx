import { useWorkout} from '../hooks/useWorkout';
import { Link } from 'react-router-dom';

const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

function resolveImageUrl(img) {
  if (!img) return null;
  return img.startsWith('http') ? img : `${IMAGE_BASE_URL}${img}`;
}

function groupSetsByExercise(sets) {
  const groups = {};
  for (const set of sets) {
    const key = set.exercise_id;
    if (!groups[key]) {
      groups[key] = { name: set.exercises?.name, image: set.exercises?.images?.[0], sets: [] };
    }
    groups[key].sets.push(set);
  }
  return Object.values(groups);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(start, end) {
  if (!end) return 'In progress';
  const minutes = Math.round((new Date(end) - new Date(start)) / 60000);
  return `${minutes} min`;
}

export default function ExerciseDisplay() {
    const { workouts, loading, error } = useWorkout();
    
      if (loading) return <div style={{ color: 'white', padding: '16px' }}>Loading...</div>;
      if (error) return <div style={{ color: 'red', padding: '16px' }}>Error: {error}</div>;
    
      return (
        <div>
    
          {workouts.map((workout) => {
            const exerciseGroups = groupSetsByExercise(workout.workout_sets || []);
            const totalSets = workout.workout_sets?.length || 0;
            const totalVolume = workout.workout_sets?.reduce(
              (sum, s) => sum + (Number(s.weight) || 0) * (Number(s.reps) || 0),
              0
            );
    
            return (
              <div className="workout-card" key={workout.id}>
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>
                    {workout.name?.toUpperCase()} · {formatDate(workout.started_at)}
                  </p>
                  <p style={{ color: '#8e8e93', fontSize: '13px', margin: 0 }}>
                    {formatDuration(workout.started_at, workout.ended_at)} · {totalSets} sets · {totalVolume}kg volume
                  </p>
                </div>
    
                {exerciseGroups.map((group, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                    {group.image && (
                      <img
                        src={resolveImageUrl(group.image)}
                        alt={group.name}
                        style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <p style={{ color: 'white', margin: 0, fontSize: '14px' }}>{group.name}</p>
                      <p style={{ color: '#8e8e93', margin: 0, fontSize: '12px' }}>
                        {group.sets.length} sets · {group.sets.map((s) => `${s.weight}kg x ${s.reps}`).join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
    
        </div>
      );

}