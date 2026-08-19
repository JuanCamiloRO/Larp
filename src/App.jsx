import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Discover from './pages/Discover.jsx';
import ExploreRoutines from './components/ExploreRoutines.jsx';
import ExplorePrograms from './components/ExplorePrograms.jsx';
import ViewFollowers from './components/ViewFollowers.jsx';
import Workout from './pages/Workout.jsx';
import Login from './pages/Login.jsx';
import Nutrition from './pages/Nutrition.jsx';
import Profile from './pages/Profile.jsx';
import PublicProfile from './pages/PublicProfile.jsx';
import PrivacyLegal from './pages/Privacy.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ProgramOverview from './components/ProgramOverview.jsx';
import RoutineEditor from './components/RoutineEditor.jsx';
import Settings from './pages/Settings.jsx';
import SignUp from './pages/SignUp.jsx';
import Navbar from './components/Navbar.jsx';
import WorkoutProvider from './context/WorkoutContext.jsx';
import OnBoardingSignUp from "./components/OnBoardingSignUp.jsx";
import ProgramEditor from "./components/ProgramEditor.jsx";
import AuthCallback from "./components/AuthCallback.jsx";
import Ranking from './pages/Ranking.jsx';

export default function App() {
  return (
    <>
    <WorkoutProvider>
    <div>
    
    <Routes>
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
      <Route path="/routines" element={<ProtectedRoute><ExploreRoutines /></ProtectedRoute>} />
      <Route path="/workout" element={<ProtectedRoute><Workout /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile/:userId" element={<PublicProfile />} />
      <Route path="/:userId/followers" element={<ViewFollowers />} />
      <Route path="/login" element={<Login />} />
      <Route path="/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
      <Route path="/programs/new" element={<ProtectedRoute><ProgramEditor /></ProtectedRoute>} />
      <Route path="/programs" element={<ProtectedRoute><ExplorePrograms /></ProtectedRoute>} />
      <Route path="/programs/:programId" element={<ProtectedRoute><ProgramOverview /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
      <Route path="/routines/new" element={<ProtectedRoute><RoutineEditor /></ProtectedRoute>} />
      <Route path="/signup" element={<SignUp />} /> 
      <Route path="/onboarding" element={<ProtectedRoute><OnBoardingSignUp /></ProtectedRoute>} />
      <Route path="/privacy-legal" element={<PrivacyLegal />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
    </Routes>
    
    </div>
    <Navbar/>
    </WorkoutProvider>
    </>
  );
}
