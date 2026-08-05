import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useFeedWorkouts } from '../hooks/useFeedWorkouts';
import ExerciseDisplay from '../components/ExerciseDisplay';
import '../css/style.css';

function Home() {
  const { workouts, loading, error } = useFeedWorkouts();

  return (
    <main className="home-page page-transition">
      <header className="home-header">
        <div>
          <h1 className="home-header__title" style={{ marginTop: '1rem' }}>Home</h1>
          <p className="home-header__subtitle">
            See what people you follow have been training.
          </p>
        </div>

        <Link
          to="/discover"
          className="home-discover-button"
          aria-label="Discover lifters"
        >
          <Search size={22} strokeWidth={2.5} />
        </Link>
      </header>

      <ExerciseDisplay
        workouts={workouts}
        loading={loading}
        error={error}
        showAuthor
      />
    </main>
  );
}

export default Home;