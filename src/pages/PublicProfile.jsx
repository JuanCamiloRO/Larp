import { useState } from 'react';
import { useNavigate, useParams, } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useWorkout } from '../hooks/useWorkout';
import ExerciseDisplay from '../components/ExerciseDisplay';
import MuscleHeatmap from '../components/MuscleHeatmap';
import FollowButton from '../components/FollowButton';
import ViewFollowers from '../components/ViewFollowers';
import ViewFollowed from '../components/ViewFollowed';
import '../css/style.css';
import '../css/social.css';

function PublicProfileSkeleton() {
  return (
    <main className="public-profile-page">
      <div className="public-profile-nav">
        <div className="public-profile-skeleton public-profile-skeleton--button" />
        <div className="public-profile-skeleton public-profile-skeleton--nav-title" />
        <div />
      </div>

      <section className="public-profile-hero public-profile-hero--skeleton">
        <div className="public-profile-skeleton public-profile-skeleton--avatar" />

        <div className="public-profile-skeleton-stats">
          {[0, 1, 2].map((item) => (
            <div className="public-profile-skeleton-stat" key={item}>
              <div className="public-profile-skeleton public-profile-skeleton--number" />
              <div className="public-profile-skeleton public-profile-skeleton--label" />
            </div>
          ))}
        </div>

        <div className="public-profile-skeleton public-profile-skeleton--username" />
        <div className="public-profile-skeleton public-profile-skeleton--bio" />
        <div className="public-profile-skeleton public-profile-skeleton--follow-button" />
      </section>
    </main>
  );
}

export default function PublicProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  

  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useProfile(userId);

  const {
    workouts,
    loading: workoutsLoading,
    error: workoutsError,
  } = useWorkout(userId);

  const latestWorkout = workouts?.[0] ? [workouts[0]] : [];
  const workoutCount = workouts?.length || 0;
  const isOwnProfile = user?.id === userId;
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowed, setShowFollowed] = useState(false);

  if (profileLoading) {
    return <PublicProfileSkeleton />;
  }

  if (profileError) {
    return (
      <main className="public-profile-page">
        <div className="public-profile-nav">
          <button
            className="public-profile-back-button"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft size={23} strokeWidth={2.5} />
          </button>

          <h1 className="public-profile-nav__title">Profile</h1>

          <div className="public-profile-nav__spacer" aria-hidden="true" />
        </div>

        <div className="public-profile-error">
          <h2>Could not load profile</h2>
          <p>{profileError}</p>

          <button
            className="public-profile-error__button"
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="public-profile-page page-transition">
      <header className="public-profile-nav">
        <button
          className="public-profile-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={23} strokeWidth={2.5} />
        </button>

        <h1 className="public-profile-nav__title">Profile</h1>

        <div className="public-profile-nav__spacer" aria-hidden="true" />
      </header>

      <section className="public-profile-hero">
        <div className="public-profile-top">
          <img
            className="public-profile-avatar"
            src={profile?.avatar_url || 'https://tse3.mm.bing.net/th/id/OIP.t8GsH1Q3v-NLfvTKIHIc3QHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'}
            alt={profile?.username || 'User avatar'}
            onError={(event) => {
              event.currentTarget.src = '/default-avatar.png';
            }}
          />

          <div className="public-profile-stats">
            <div className="public-profile-stat">
              <span className="public-profile-stat__number">
                {workoutsLoading ? '—' : workoutCount}
              </span>

              <span className="public-profile-stat__label">
                Workouts
              </span>
            </div>

            <div className="public-profile-stat">
              <span className="public-profile-stat__number">
                <label style={{ backgroundColor: 'transparent', border: 'none' }} onClick={() => setShowFollowers(true) }>{profile?.followers ?? 0}</label>
              </span>
            {showFollowers && <ViewFollowers userId={userId} onClose={() => setShowFollowers(false)} />}

              <span className="public-profile-stat__label">
                Followers
              </span>
            </div>

            <div className="public-profile-stat">
              <span className="public-profile-stat__number">
                <label style={{ backgroundColor: 'transparent', border: 'none' }} onClick={() => setShowFollowed(true) }>{profile?.following ?? 0}</label>
              </span>

              {showFollowed && <ViewFollowed userId={userId} onClose={() => setShowFollowed(false)} />}

              <span className="public-profile-stat__label">
                Following
              </span>
            </div>
          </div>
        </div>

        <div className="public-profile-info">
          <h2 className="public-profile-username">
            {profile?.username || 'Unknown lifter'}
          </h2>

          {profile?.bio && (
            <p className="public-profile-bio">
              {profile.bio}
            </p>
          )}
        </div>

        {!isOwnProfile && (
          <FollowButton
            targetUserId={userId}
            className="public-profile-follow-button"
          />
        )}
      </section>

      <section className="public-profile-section">
        <div className="public-profile-section__header">
          <h2 className="public-profile-section__title">
            Latest workout
          </h2>

          {workoutCount > 1 && (
    <button
      className="public-profile-view-all"
      onClick={() => navigate(`/profile/${userId}/workouts`)}
    >
      View all
    </button>
  )}
        </div>

        <ExerciseDisplay
          workouts={latestWorkout}
          loading={workoutsLoading}
          error={workoutsError}
          authorProfile={profile}
          exercisePreviewCount={3}
          showActions={false}
        />

        {workoutCount === 0 && !workoutsLoading && (
          <p>No workouts yet.</p>)}

      </section>

      <section className="public-profile-section public-profile-section--heatmap">
        <div className="public-profile-section__header">
          <h2 className="public-profile-section__title">
            Muscle activity
          </h2>
        </div>

        <MuscleHeatmap userId={userId} />
      </section>
    </main>
  );
}