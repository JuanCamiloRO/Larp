import { useState } from "react"
import { useProfile } from "../hooks/useProfile"
import Graph from "../components/Graph"
import ExerciseDisplay from "../components/ExerciseDisplay"
import MuscleHeatmap from "../components/MuscleHeatmap"
import EditTopLifts from "../components/EditTopLifts"
import BodyScan from "../components/BodyScan"
import "../css/style.css"
import { useWorkout } from "../hooks/useWorkout"
import { useAuth } from "../hooks/useAuth"

export default function Dashboard() {
  const [mostrarScan, setMostrarScan] = useState(false)
  const { user } = useAuth()
  const { profile, loading: profileLoading, error: profileError } = useProfile(user?.id)
  const { workouts, loading: workoutsLoading, error: workoutsError } = useWorkout(user?.id)

  const workoutCount = workouts?.length || 0

  return (
    <div className="dashboard-page">
      {/* OVERLAY BODY SCAN */}
      {mostrarScan && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "#0f172a",
            zIndex: 1000,
            overflowY: "auto",
          }}
        >
          <button
            onClick={() => setMostrarScan(false)}
            style={{
              position: "fixed",
              top: 16,
              left: 16,
              zIndex: 1001,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              padding: "8px 14px",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              backdropFilter: "blur(10px)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <BodyScan onClose={() => setMostrarScan(false)} />
        </div>
      )}

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

      {/* BOTÓN BODY SCAN */}
      <div style={{ padding: "0 16px", marginBottom: 8 }}>
        <button
          onClick={() => setMostrarScan(true)}
          style={{
            width: "100%",
            padding: "18px 20px",
            borderRadius: 16,
            border: "1px solid rgba(212, 175, 55, 0.25)",
            background: "linear-gradient(135deg, rgba(212,175,55,0.14), rgba(184,134,11,0.06))",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 14,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onTouchStart={(e) => {
            e.currentTarget.style.transform = "scale(0.98)"
            e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.5)"
          }}
          onTouchEnd={(e) => {
            e.currentTarget.style.transform = "scale(1)"
            e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.25)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #d4af37, #b8860b)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(212,175,55,0.25)",
                flexShrink: 0,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <div style={{ textAlign: "left" }}>
              <span
                style={{
                  display: "block",
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: 0.3,
                }}
              >
                Body Scan
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.35)",
                  marginTop: 2,
                }}
              >
                Analiza tu morfología y potencial
              </span>
            </div>
          </div>

          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(212,175,55,0.6)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
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