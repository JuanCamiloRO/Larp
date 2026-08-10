import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';
import { supabase } from '../supabase';
import { useFeedWorkouts } from '../hooks/useFeedWorkouts';
import ExerciseDisplay from '../components/ExerciseDisplay';
import NotificationPanel from '../components/NotificationPanel';
import '../css/style.css';

function Home() {
  const { user } = useAuth();
  const { workouts, loading, error } = useFeedWorkouts();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

useEffect(() => {
  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data || []);
  }
  if (user?.id) fetchNotifications();
}, [user]);

  return (
    <main className="page-transition">
      <header className="settings-header" style={{ display:"flex",justifyContent: 'space-between' }}>
        <div>
          <p>Home</p>
          <h1>Feed</h1>  
        </div>
        <div className="home-header-buttons">
  <Link
    to="/discover"
    className="home-discover-button"
    aria-label="Discover lifters"
  >
    <Search size={22} strokeWidth={2.5} />
  </Link>
  <button
    className="home-notification-button"
    onClick={() => setShowNotifications(!showNotifications)}
    aria-label="Notifications"
  >
    <Bell size={22} strokeWidth={2.5} />
    {unreadCount > 0 && (
      <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
    )}
  </button>
</div>
      </header>

      <div className="home-page">
        {showNotifications && (
  <NotificationPanel
    notifications={notifications}
    onClose={() => setShowNotifications(false)}
    onMarkRead={async (id) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }}
  />
)}
      <ExerciseDisplay
        workouts={workouts}
        loading={loading}
        error={error}
        showAuthor
      />
    </div>   
     </main>
  );
}

export default Home;