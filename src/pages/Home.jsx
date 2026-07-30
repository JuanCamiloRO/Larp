import { useFeedWorkouts } from '../hooks/useFeedWorkouts';
import ExerciseDisplay from '../components/ExerciseDisplay';

function Home() {
  const { workouts, loading, error } = useFeedWorkouts();

  return (
    <>
      <ExerciseDisplay workouts={workouts} loading={loading} error={error} showAuthor />
    </>
  );
}

export default Home;