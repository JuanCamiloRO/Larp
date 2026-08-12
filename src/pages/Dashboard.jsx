import { useState } from 'react';
import { ArrowLeft, ChevronRight, ScanLine } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWorkout } from '../hooks/useWorkout';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ExerciseDisplay from '../components/ExerciseDisplay';
import MuscleHeatmap from '../components/MuscleHeatmap';
import BodyScan from '../components/BodyScan';
import WeightProgress from '../components/WeightProgress';
import ViewFollowers from '../components/ViewFollowers';
import ViewFollowed from '../components/ViewFollowed';
import WorkoutCalendar from '../components/WorkoutCalendar';
import '../css/dashboard.css';
import '../css/weight-progress.css';
import '../css/social.css';

function DashboardSkeleton() {
  return <main className="public-profile-page dashboard-home page-transition" aria-busy="true"><section className="public-profile-hero public-profile-hero--skeleton"><div className="public-profile-top"><div className="public-profile-skeleton public-profile-skeleton--avatar" /><div className="public-profile-skeleton-stats">{[0,1,2].map((item) => <div className="public-profile-skeleton-stat" key={item}><div className="public-profile-skeleton public-profile-skeleton--number" /><div className="public-profile-skeleton public-profile-skeleton--label" /></div>)}</div></div><div className="public-profile-skeleton public-profile-skeleton--username" /><div className="public-profile-skeleton public-profile-skeleton--bio" /></section><div className="dashboard-skeleton-card"><div className="public-profile-skeleton dashboard-skeleton-card__icon" /><div className="dashboard-skeleton-card__copy"><div className="public-profile-skeleton dashboard-skeleton-card__title" /><div className="public-profile-skeleton dashboard-skeleton-card__subtitle" /></div></div><section className="public-profile-section"><div className="public-profile-skeleton dashboard-skeleton-section-title" />{[0,1].map((item) => <div className="public-profile-skeleton dashboard-skeleton-workout" key={item} />)}</section></main>;
}


export default function Dashboard() {
  const [isBodyScanOpen, setIsBodyScanOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: profileLoading, error: profileError } = useProfile(user?.id, refreshKey);
  const { workouts, loading: workoutsLoading, error: workoutsError } = useWorkout(user?.id);


  const recentWorkouts = workouts?.slice(0, 3) || [];
  const workoutCount = workouts?.length || 0;
  const preferredUnit = profile?.preferred_units === 'lb' || profile?.preferred_units === 'lbs' ? 'lb' : 'kg';

  if (profileLoading) return <DashboardSkeleton />;
  if (profileError) return <main className="public-profile-page dashboard-home page-transition"><div className="dashboard-error"><h1>Couldn’t load your profile</h1><p>{profileError}</p></div></main>;
  return <main className="public-profile-page dashboard-home page-transition">
    
    <section className="weight-progress"><div className="public-profile-top"><img className="public-profile-avatar" src={profile?.avatar_url || '/default-avatar.png'} alt={profile?.username || 'Your avatar'} onError={(event) => { event.currentTarget.src = '/default-avatar.png'; }} /><div className="public-profile-stats"><div className="public-profile-stat"><span className="public-profile-stat__number">{workoutsLoading ? '—' : workoutCount}</span><span className="public-profile-stat__label">Workouts</span></div><div className="public-profile-stat"><span className="public-profile-stat__number" onClick={() => setShowFollowers(true)}>{profile?.followers ?? 0}</span><span className="public-profile-stat__label">Followers</span></div><div className="public-profile-stat"><span className="public-profile-stat__number" onClick={()=> setShowFollowing(true)}>{profile?.following ?? 0}</span><span className="public-profile-stat__label">Following</span></div></div></div><div className="public-profile-info"><h1 className="public-profile-username">{profile?.username || 'Your profile'}</h1>{profile?.bio && <p className="public-profile-bio">{profile.bio}</p>}</div></section>
    {showFollowers && <ViewFollowers onClose={() => setShowFollowers(false)} userId={profile?.id} />}{showFollowing && <ViewFollowed onClose={() => setShowFollowing(false)} userId={profile?.id} />}
    <section className="weight-progress"><header className="weight-progress__header"><p>Muscle Activity</p></header><MuscleHeatmap userId={user?.id} /></section>
    <section><WorkoutCalendar userId={user?.id} /></section>
    <section className="public-profile-section"><ExerciseDisplay workouts={recentWorkouts} loading={workoutsLoading} error={workoutsError} authorProfile={profile} showAuthor={false} exercisePreviewCount={3} showActions={false} /></section>
    <button type="button" className="body-scan-launcher" onClick={() => setIsBodyScanOpen(true)}><span className="body-scan-launcher__icon" aria-hidden="true"><ScanLine size={23} strokeWidth={2.25} /></span><span className="body-scan-launcher__copy"><span className="body-scan-launcher__title">Body Scan</span><span className="body-scan-launcher__subtitle">Analyze your physique and potential</span></span><ChevronRight className="body-scan-launcher__chevron" size={22} strokeWidth={2.5} aria-hidden="true" /></button>
    {isBodyScanOpen && <div className="body-scan-overlay" role="dialog" aria-modal="true" aria-label="Body Scan"><header className="body-scan-overlay__header"><button type="button" className="body-scan-overlay__back-button" onClick={() => setIsBodyScanOpen(false)} aria-label="Close Body Scan"><ArrowLeft size={22} strokeWidth={2.5} /></button><h1 className="body-scan-overlay__title">Body Scan</h1><div aria-hidden="true" /></header><div className="body-scan-overlay__content"><BodyScan onClose={() => setIsBodyScanOpen(false)} /></div></div>}
  </main>;
}