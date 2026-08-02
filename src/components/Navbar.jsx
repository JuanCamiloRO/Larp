// components/NavBar.jsx
import { NavLink } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Home, BarChart2, PlusCircle, Globe, Trophy,TrendingUp, Medal, User } from 'lucide-react';
import { useWorkoutContext } from '../context/WorkoutContext.jsx';

export default function NavBar() {
  const { isActive } = useWorkoutContext();

  return (
    <>
    {isActive && (
        <Link to="/workout" className="active-workout-banner">
          🏋️ Workout in progress — tap to resume
        </Link>
      )}
    <nav className="bottom-nav">
      <NavLink to="/" className="nav-item" end>
        <Home size={24} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/dashboard" className="nav-item">
        <TrendingUp size={24} />
        <span>Stats</span>
      </NavLink>

      <NavLink to="/discover" className="nav-item">
        <Globe size={24} />
        <span>Discover</span>
      </NavLink>

      <NavLink to="/workout" className="nav-item nav-center">
        <PlusCircle size={32} />
      </NavLink>

      <NavLink to="/ranks" className="nav-item">
        <Medal size={24} />
        <span>Ranks</span>
      </NavLink>

      <NavLink to="/leaderboard" className="nav-item">
        <Trophy size={24} />
        <span>Leaderboard</span>
      </NavLink>

      <NavLink to="/profile" className="nav-item">
        <User size={24} />
        <span>Profile</span>
      </NavLink>
    </nav>
    </>
  );
}