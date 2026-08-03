// components/ProfileSearchBar.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfileSearch } from '../hooks/useProfileSearch';
import '../css/style.css';

export default function ProfileSearchBar() {
  const [query, setQuery] = useState('');
  const { results, search } = useProfileSearch();
  const navigate = useNavigate();

  return (
    <div className="search-container">
      <input
        placeholder="Search users..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          search(e.target.value);
        }}
      />
      {results.length > 0 && (
        <div className="search-results">
          {results.map((p) => (
            <div
              key={p.id}
              className="follow-row"
              onClick={() => navigate(`/profile/${p.id}`)}
            >
              <img className="follow-avatar" src={p.avatar_url || '/default-avatar.png'} alt="" />
              <span className="follow-name">{p.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}