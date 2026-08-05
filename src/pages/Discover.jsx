import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ProfileSearchBar from '../components/ProfileSearchBar';
import FollowCard from '../components/FollowCard';
import '../css/discover.css';

export default function Discover() {
  return (
    <main className="discover-page">
      <header className="discover-header">
        <Link
          to="/"
          className="discover-back-button"
          aria-label="Back to home"
        >
          <ArrowLeft size={23} strokeWidth={2.5} />
        </Link>

        <h1 className="discover-page__title">Discover</h1>

        {/* Keeps the title visually centred */}
        <div className="discover-header__spacer" aria-hidden="true" />
      </header>

      <p className="discover-page__subtitle">
        Find lifters, follow their journey, and compare progress.
      </p>

      <ProfileSearchBar />

      <section className="discover-page__suggestions">
        <FollowCard />
      </section>
    </main>
  );
}