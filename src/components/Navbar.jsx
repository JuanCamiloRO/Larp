import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  Trophy,
  Hamburger,
  TrendingUp,
} from 'lucide-react';
import { useWorkoutContext } from '../context/WorkoutContext.jsx';

export default function NavBar() {
  const { isActive } = useWorkoutContext();
  const location = useLocation();

  const loginPage = location.pathname === '/login' || location.pathname === '/signup';
  if (loginPage) return;

  const isWorkoutPage =
    location.pathname === '/workout' ||
    location.pathname.startsWith('/workout/');

  const showActiveWorkoutBanner = isActive && !isWorkoutPage;

  return (
    <>
      {showActiveWorkoutBanner && (
        <Link to="/workout" className="active-workout-banner">
          🏋️ Workout in progress — tap to resume
        </Link>
      )}

      <nav className="bottom-nav">
        <NavLink to="/" className="nav-item" end>
          <Home size={24} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/ranking" className="nav-item">
          <Trophy size={24} />
          <span>Ranking</span>
        </NavLink>

        <NavLink to="/workout" className="nav-center-wrap">
          <div className="nav-center-btn">
            <PlusCircle size={22} />
          </div>
        </NavLink>

        <NavLink to="/nutrition" className="nav-item">
          <Hamburger size={24} />
          <span>Nutrition</span>
        </NavLink>

        <NavLink to="/dashboard" className="nav-item">
          <TrendingUp size={24} />
          <span>Dashboard</span>
        </NavLink>
      </nav>
    </>
  );
}