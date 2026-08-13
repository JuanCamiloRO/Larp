import { useState } from 'react';
import Leaderboard from './Leaderboard';
import MuscleRanks from './MuscleRanks';
import '../css/ranking.css';

export default function Ranking() {
  const [tab, setTab] = useState('leaderboard');
  return (
    <div className="ranking-page">
      <div className="ranking-tabs">
        <button
          className={`ranking-tab ${tab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setTab('leaderboard')}
        >
          Leaderboard
        </button>
        <button
          className={`ranking-tab ${tab === 'ranks' ? 'active' : ''}`}
          onClick={() => setTab('ranks')}
        >
          My Rank
        </button>
      </div>
      {tab === 'leaderboard' ? <Leaderboard /> : <MuscleRanks />}
    </div>
  );
}