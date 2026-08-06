import { ArrowLeft, LockKeyhole, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../css/ranks-coming-soon.css';

const previewRanks = [
  { label: 'Strength', value: 'Coming soon', icon: '✦' },
  { label: 'Consistency', value: 'Coming soon', icon: '◷' },
  { label: 'Community', value: 'Coming soon', icon: '♢' },
];

export default function RanksComingSoon() {
  const navigate = useNavigate();

  return (
    <main className="ranks-coming-soon-page">
      <header className="ranks-coming-soon-header">
        <button
          type="button"
          className="ranks-coming-soon-back"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowLeft size={21} />
        </button>
        <div>
          <p>Compete</p>
          <h1>Ranks</h1>
        </div>
        <span aria-hidden="true" />
      </header>

      <section className="ranks-coming-soon-content">
        <div className="ranks-coming-soon-hero">
          <span className="ranks-coming-soon-trophy" aria-hidden="true">
            <Trophy size={30} />
          </span>
          <span className="ranks-coming-soon-eyebrow">A new way to progress</span>
          <h2>Your training will have a rank.</h2>
          <p>
            We are building a fair ranking system that rewards strength,
            consistency, and progress—not just the heaviest lift.
          </p>
        </div>

        <section className="ranks-coming-soon-preview" aria-label="Upcoming rank categories">
          {previewRanks.map((rank) => (
            <div className="ranks-coming-soon-preview-card" key={rank.label}>
              <span aria-hidden="true">{rank.icon}</span>
              <div>
                <strong>{rank.label}</strong>
                <small>{rank.value}</small>
              </div>
              <LockKeyhole size={15} aria-hidden="true" />
            </div>
          ))}
        </section>

        <div className="ranks-coming-soon-note">
          <strong>Coming soon</strong>
          <p>
            Keep training and logging your workouts. Your progress will count
            when ranks go live.
          </p>
        </div>

        <button
          type="button"
          className="ranks-coming-soon-action"
          onClick={() => navigate('/workout')}
        >
          Start a workout
        </button>
      </section>
    </main>
  );
}