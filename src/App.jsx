import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Discover from './pages/Discover.jsx';
import Workout from './pages/Workout.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Ranks from './pages/Ranks.jsx';
import Settings from './pages/Settings.jsx';
import SignUp from './pages/SignUp.jsx';
import Navbar from './components/Navbar.jsx';
import WorkoutProvider from './context/WorkoutContext.jsx';

export default function App() {
  return (
    <>
    <WorkoutProvider>
    <div>
    
    <Routes>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/workout" element={<ProtectedRoute><Workout /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
      <Route path="/profile/:userId" element={<PublicProfile />} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/ranks" element={<ProtectedRoute><Ranks /></ProtectedRoute>} />
      <Route path="/signup" element={<SignUp />} /> 
    </Routes>
    
    </div>
    <Navbar/>
    </WorkoutProvider>
    </>
  );
}
