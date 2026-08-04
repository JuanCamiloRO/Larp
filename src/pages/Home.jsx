import { useFeedWorkouts } from '../hooks/useFeedWorkouts';
import ExerciseDisplay from '../components/ExerciseDisplay';
import { MUSCLE_MAP } from 'body-muscles';
console.log(JSON.stringify(MUSCLE_MAP, null, 2));

function Home() {
  const { workouts, loading, error } = useFeedWorkouts();

  return (
    <>
      <ExerciseDisplay workouts={workouts} loading={loading} error={error} showAuthor />
    </>
  );
}

export default Home;