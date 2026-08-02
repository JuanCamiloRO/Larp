import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Workout from './pages/Workout.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
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
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} /> 
    </Routes>
    
    </div>
    <Navbar/>
    </WorkoutProvider>
    </>
  );
}
