// components/NotificationPanel.jsx
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../css/notifications.css';

export default function NotificationPanel({ notifications, onClose, onMarkRead }) {
    const navigate = useNavigate();

  return (
    <div className="notification-page">
      <header className="settings-header">
        <button
          type="button"
          className="settings-header__back"
          onClick={() => onClose()}
          aria-label="Go back"
        >
          <ArrowLeft size={21} />
        </button>
        <div>
        <p>Notifications (work in progress)</p>
        <h1>All Notifications</h1>
        </div>
      </header>

      <div className="notification-page__list">
        {notifications.length === 0 ? (
          <p className="subtle">No notifications yet.</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-item ${n.is_read ? '' : 'unread'}`}
              onClick={() => onMarkRead(n.id)}
            >
              <strong>{n.title}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
              {n.actor_avatar_url && <img className="follow-avatar" src={n.actor_avatar_url} alt="Avatar" />}
              {n.body && <strong>{n.body}</strong>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}