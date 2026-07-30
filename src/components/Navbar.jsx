// components/NavBar.jsx
import { NavLink } from 'react-router-dom';
import { Home, BarChart2, PlusCircle, Dumbbell, User } from 'lucide-react';

export default function NavBar() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className="nav-item" end>
        <Home size={24} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/dashboard" className="nav-item">
        <BarChart2 size={24} />
        <span>Stats</span>
      </NavLink>

      <NavLink to="/workout" className="nav-item nav-center">
        <PlusCircle size={32} />
      </NavLink>

      <NavLink to="/ranks" className="nav-item">
        <Dumbbell size={24} />
        <span>ranks</span>
      </NavLink>

      <NavLink to="/profile" className="nav-item">
        <User size={24} />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
}