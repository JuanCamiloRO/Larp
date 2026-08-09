import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useFollowersUserIds } from '../hooks/useFollowersUserIds';
import FollowButton from './FollowButton';

export default function ViewFollowers({ userId, onClose }) {
  const navigate = useNavigate();
  const { followers, loading } = useFollowersUserIds(userId);
  const [query, setQuery] = useState('');

  const filteredFollowers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return followers;

    return followers.filter((row) =>
      row.profile?.username?.toLowerCase().includes(q)
    );
  }, [followers, query]);

  function goToProfile(profileId) {
    onClose?.();
    navigate(`/profile/${profileId}`);
  }

  return (
    <div className="followers-modal">
      <header className="followers-modal__header">
        <button
          className="followers-modal__back"
          onClick={onClose}
          aria-label="Go back"
        >
          <ArrowLeft size={22} strokeWidth={2.5} />
        </button>

        <h1 className="followers-modal__title">Followers</h1>

        <div className="followers-modal__spacer" aria-hidden="true" />
      </header>

      <div className="followers-modal__search">
        <Search size={16} className="followers-modal__search-icon" />
        <input
          type="text"
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="followers-modal__list">
        {loading && (
          <p className="followers-modal__empty">Loading followers...</p>
        )}

        {!loading && filteredFollowers.length === 0 && (
          <p className="followers-modal__empty">
            {query ? 'No results.' : 'No followers yet.'}
          </p>
        )}

        {!loading &&
          filteredFollowers.map((row) => {
            const profile = row.profile;
            if (!profile) return null;

            return (
              <div className="followers-modal__row" key={row.follower_id}>
                <button
                  className="followers-modal__row-main"
                  onClick={() => goToProfile(profile.id)}
                >
                  <img
                    className="followers-modal__avatar"
                    src={profile.avatar_url || '/default-avatar.png'}
                    alt={profile.username}
                  />

                  <span className="followers-modal__username">
                    {profile.username}
                  </span>
                </button>

                <FollowButton style={{width: '30%'}} targetUserId={profile.id}/>
              </div>
            );
          })}
      </div>
    </div>
  );
}