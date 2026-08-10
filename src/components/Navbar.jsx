// components/NavBar.jsx
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Home,
  PlusCircle,
  Trophy,
  TrendingUp,
  Medal,
  Hamburger,
  Settings,
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

        <NavLink to="/dashboard" className="nav-item">
          <TrendingUp size={24} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/nutrition" className="nav-item">
          <Hamburger size={24} />
          <span>Nutrition</span>
        </NavLink>
        
        <NavLink to="/workout" className="nav-item nav-center">
          <PlusCircle size={32} />
        </NavLink>

       <NavLink to="/leaderboard" className="nav-item">
          <Trophy size={24} />
          <span>Leaderboard</span>
        </NavLink>

        <NavLink to="/ranks" className="nav-item">
          <Medal size={24} />
          <span>Ranks</span>
        </NavLink>
      
      <NavLink to="/settings" className="nav-item">
          <Settings size={24} />
          <span>Settings</span>
        </NavLink>
        </nav>
    </>
  );
}