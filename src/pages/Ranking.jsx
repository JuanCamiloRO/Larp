import { useState } from 'react';
import Leaderboard from './Leaderboard';
import MuscleRanks from './MuscleRanks';
import DailyChallenges from './DailyChallenges';
import '../css/ranking.css';

export default function Ranking() {
  const [tab, setTab] = useState('leaderboard');
  const renderContent = () => {
    switch (tab) {
      case 'leaderboard':
        return <Leaderboard />;
      case 'ranks':
        return <MuscleRanks />;
      case 'challenges':
        return <DailyChallenges />;
      default:
        return null;
    }
  };
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
        <button  className={`ranking-tab ${tab === 'challenges' ? 'active' : ''}`}
          onClick={() => setTab('challenges')}>
          Challenges
        </button>
      </div>
      <div className="ranking-content">{renderContent()}</div>
    </div>
  );
}