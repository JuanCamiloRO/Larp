// pages/PublicProfile.jsx
// Mirrors Dashboard's layout and components exactly (profile header, stats,
// workouts, muscle heatmap), scoped to the profile being viewed instead of
// the logged-in user. Omits EditTopLifts since visitors can't curate
// someone else's top lifts. Adds a back button and FollowButton, which
// Dashboard doesn't need since you can't follow yourself.
//
// Assumes useProfile(userId) is parameterized the same way useWorkout and
// useMuscleHeatmap now are -- i.e. it accepts an optional userId and, when
// provided, fetches that user's profile/follower counts instead of the
// logged-in user's. If useProfile still ignores its argument and always
// resolves via useAuth() internally, this page will incorrectly show the
// viewer's own data instead of the profile owner's.

import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWorkout } from '../hooks/useWorkout';
import ExerciseDisplay from '../components/ExerciseDisplay';
import MuscleHeatmap from '../components/MuscleHeatmap';
import FollowButton from '../components/FollowButton';
import '../css/style.css';

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { profile, loading: profileLoading, error: profileError } = useProfile(userId);
  const { workouts, loading: workoutsLoading, error: workoutsError } = useWorkout(userId);

  const workoutCount = workouts?.length || 0;

  if (profileLoading) return <p className="subtle">Loading profile...</p>;
  if (profileError) return <p className="message error">Couldn't load profile: {profileError}</p>;

  return (
    <div className="dashboard-page">
      <button
        onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, marginBottom: '16px', cursor: 'pointer', padding: 0 }}
      >
        ‹ Back
      </button>

      <div className="profile-header">
        <div className="profile-top">
          <img
            className="profile-avatar"
            src={profile?.avatar_url || '/default-avatar.png'}
            alt={profile?.username || 'User avatar'}
          />

          <div className="profile-stats">
            <div className="stat">
              <span className="stat-number">{workoutCount}</span>
              <span className="stat-label">Workouts</span>
            </div>
            <div className="stat">
              <span className="stat-number">{profile?.followers ?? 0}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat">
              <span className="stat-number">{profile?.following ?? 0}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>

        <div className="profile-info">
          <h1 className="profile-username">{profile?.username}</h1>
          {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
        </div>

        {user?.id !== userId && <FollowButton targetUserId={userId} />}
      </div>

      <div className="dashboard-workouts">
        <h2 className="dashboard-section-title">Workouts</h2>
        <ExerciseDisplay workouts={workouts} loading={workoutsLoading} error={workoutsError} />
      </div>

      <MuscleHeatmap userId={userId} />
    </div>
  );
}