import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useFollowed } from '../hooks/useFollowed';
import FollowButton from './FollowButton';

export default function ViewFollowed({ userId, onClose }) {
  const navigate = useNavigate();
  const { followed, loading } = useFollowed(userId);
  const [query, setQuery] = useState('');

  const filteredFollowed = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return followed;

    return followed.filter((row) =>
      row.profile?.username?.toLowerCase().includes(q)
    );
  }, [followed, query]);

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

        <h1 className="followers-modal__title">Following</h1>

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
          <p className="followers-modal__empty">Loading following...</p>
        )}

        {!loading && filteredFollowed.length === 0 && (
          <p className="followers-modal__empty">
            {query ? 'No results.' : 'Not following anyone yet.'}
          </p>
        )}

        {!loading &&
          filteredFollowed.map((row) => {
            const profile = row.profile;
            if (!profile) return null;

            return (
              <div className="followers-modal__row" key={row.following_id}>
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

                <FollowButton style={{ width: '30%' }} targetUserId={profile.id} />
              </div>
            );
          })}
      </div>
    </div>
  );
}