import { useProfile } from "../hooks/useProfile"
import Graph from "../components/Graph"
import ExerciseDisplay from "../components/ExerciseDisplay"
import MuscleHeatmap from "../components/MuscleHeatmap"
import EditTopLifts from "../components/EditTopLifts"
import "../style.css"
import { useWorkout } from "../hooks/useWorkout"

export default function Dashboard() {
  const { profile, loading: profileLoading, error: profileError } = useProfile()
  const { workouts, loading: workoutsLoading, error: workoutsError } = useWorkout()

  const workoutCount = workouts?.length || 0;

  return (
    <div className="dashboard-page">
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

      </div>

      <div className="dashboard-workouts">
        <h2 className="dashboard-section-title">Workouts</h2>
        <ExerciseDisplay workouts={workouts} loading={workoutsLoading} error={workoutsError} />
      </div>
      <MuscleHeatmap />
      <EditTopLifts />
    </div>
    
    
  )
}