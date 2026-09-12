import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../hooks/useAuth.jsx';
import '../css/challenges.css';

const XP_PER_LEVEL = 100;
const XP_BY_DIFFICULTY = {
  easy: 20,
  medium: 50,
  hard: 100,
};

function levelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function ConfettiBurst({ onDone }) {
  const pieceCount = 24;
  const pieces = Array.from({ length: pieceCount }, (_, i) => {
    const angle = (360 / pieceCount) * i;
    const distance = 60 + Math.random() * 50;
    const angleRad = (angle * Math.PI) / 180;
    const x = Math.cos(angleRad) * distance;
    const y = Math.sin(angleRad) * distance - 40;
    return {
      x,
      y,
      delay: Math.random() * 80,
      color: ['#ff3b30', '#ffd60a', '#30d158', '#0a84ff'][i % 4],
    };
  });

  useEffect(() => {
    const timer = setTimeout(onDone, 900);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="confetti-burst">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            '--tx': `${piece.x}px`,
            '--ty': `${piece.y}px`,
            '--delay': `${piece.delay}ms`,
            backgroundColor: piece.color,
          }}
        />
      ))}
    </div>
  );
}

function LevelUpBurst({ level, onDone }) {
  const [phase, setPhase] = useState('shake');

  useEffect(() => {
    const toExplode = setTimeout(() => setPhase('explode'), 500);
    const toDone = setTimeout(onDone, 1500);
    return () => {
      clearTimeout(toExplode);
      clearTimeout(toDone);
    };
  }, [onDone]);

  return (
    <div className="level-up-overlay">
      <div className={`level-up-badge level-up-badge--${phase}`}>
        <span className="level-up-badge__label">LEVEL UP</span>
        <span className="level-up-badge__level">{level}</span>
      </div>
      {phase === 'explode' && <ConfettiBurst onDone={() => {}} />}
    </div>
  );
}

export default function DailyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [completions, setCompletions] = useState({});
  const [progress, setProgress] = useState({ challenge_xp: 0, challenge_level: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confettiId, setConfettiId] = useState(null);
  const [levelUp, setLevelUp] = useState(null);
  const barRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    loadTodaysChallenges();
    loadProgress();
  }, [user]);

  async function loadProgress() {
    const { data, error: progressError } = await supabase
      .from('profiles')
      .select('challenge_xp, challenge_level')
      .eq('id', user.id)
      .single();

    if (!progressError && data) {
      setProgress(data);
    }
  }

  async function loadTodaysChallenges() {
    setLoading(true);
    setError(null);

    const today = new Date().toISOString().split('T')[0];

    const { data: dailyRows, error: dailyError } = await supabase
      .from('daily_challenges')
      .select('id, assigned_date, challenges (id, title, description, category, difficulty)')
      .eq('assigned_date', today);

    if (dailyError) {
      setError(dailyError.message);
      setLoading(false);
      return;
    }

    const dailyChallengeIds = dailyRows.map((row) => row.id);

    const { data: completionRows, error: completionError } = await supabase
      .from('user_challenges')
      .select('challenge_id, completed_at')
      .eq('user_id', user.id)
      .in('challenge_id', dailyChallengeIds);

    if (completionError) {
      setError(completionError.message);
      setLoading(false);
      return;
    }

    const completionMap = {};
    completionRows.forEach((row) => {
      completionMap[row.challenge_id] = row.completed_at;
    });

    setChallenges(dailyRows);
    setCompletions(completionMap);
    setLoading(false);
  }

  async function completeChallenge(daily) {
    if (completions[daily.id]) return;

    const { error: insertError } = await supabase.from('user_challenges').insert({
      user_id: user.id,
      challenge_id: daily.id,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setCompletions((prev) => ({
      ...prev,
      [daily.id]: new Date().toISOString(),
    }));

    const xpAward = XP_BY_DIFFICULTY[daily.challenges.difficulty] ?? XP_BY_DIFFICULTY.easy;

    setConfettiId(daily.id);

    setProgress((prev) => {
      const newXp = prev.challenge_xp + xpAward;
      const oldLevel = levelFromXp(prev.challenge_xp);
      const newLevel = levelFromXp(newXp);

      if (newLevel > oldLevel) {
        setTimeout(() => setLevelUp(newLevel), 300);
      }

      return {
        challenge_xp: newXp,
        challenge_level: newLevel,
      };
    });
  }

  if (loading) return <div className="daily-challenges-loading">Loading today's challenges...</div>;
  if (error) return <div className="daily-challenges-error">Error: {error}</div>;

  const xpIntoLevel = progress.challenge_xp % XP_PER_LEVEL;
  const xpPercent = (xpIntoLevel / XP_PER_LEVEL) * 100;

  return (
    <div className="daily-challenges">
      <h1>Today's Challenges</h1>

      <div className={`challenge-progress ${levelUp ? 'challenge-progress--shake' : ''}`} ref={barRef}>
        <div className="challenge-progress__header">
          <span className="challenge-progress__level">Level {progress.challenge_level}</span>
          <span className="challenge-progress__xp">
            {xpIntoLevel} / {XP_PER_LEVEL} XP
          </span>
        </div>
        <div className="challenge-progress__bar">
          <div className="challenge-progress__fill" style={{ width: `${xpPercent}%` }} />
        </div>
      </div>

      {challenges.length === 0 && <p>No challenges assigned for today yet.</p>}
      <ul className="challenge-list">
        {challenges.map((daily) => {
          const isDone = Boolean(completions[daily.id]);
          const challenge = daily.challenges;
          const xpAward = XP_BY_DIFFICULTY[challenge.difficulty] ?? XP_BY_DIFFICULTY.easy;
          return (
            <li key={daily.id} className={`challenge-card ${isDone ? 'completed' : ''}`}>
              <h3>{challenge.title}</h3>
              <p>{challenge.description}</p>
              <span className="challenge-meta">
                {challenge.category} · {challenge.difficulty} · +{xpAward} XP
              </span>
              <div className="challenge-card__action">
                <button onClick={() => completeChallenge(daily)} disabled={isDone}>
                  {isDone ? 'Completed' : 'Mark as done'}
                </button>
                {confettiId === daily.id && (
                  <ConfettiBurst onDone={() => setConfettiId(null)} />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {levelUp && <LevelUpBurst level={levelUp} onDone={() => setLevelUp(null)} />}
    </div>
  );
}