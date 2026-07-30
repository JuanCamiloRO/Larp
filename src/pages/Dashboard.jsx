import { useProfile } from "../hooks/useProfile"
import Graph from "../components/Graph"
import ExerciseDisplay from "../components/ExerciseDisplay"
import "../style.css"
import { useWorkout } from "../hooks/useWorkout"

export default function Dashboard() {
    const { profile, loading, error } = useProfile()
    const { workouts } = useWorkout()

    return (
      <>
      <div style={{color: 'white', background: 'var(--surface'}}>
        <h1>{profile?.username}</h1>

        <div className="stats-row" style={{ display: "flex", justifyContent: "space-between" }}>
          <div className="stat">
            <span className="stat-label">Workouts</span>
            <p>{profile?.workouts}</p>
          </div>
          <div className="stat">
            <span className="stat-label">Followers</span>
            <p>{profile?.followers}</p>
          </div>
          <div className="stat">
            <span className="stat-label">Following</span>
            <p className="stat-number">{profile?.following}</p>
          </div>
        </div>

        <Graph />
      </div>
        <div style={{padding: '1rem'}}>
        <h1 style={{padding:'1rem'}}>Workouts</h1>
        <ExerciseDisplay />
        </div>
      </>
    )
}