import ExerciseDisplay from '../components/ExerciseDisplay.jsx';
import FollowCard from '../components/FollowCard.jsx';
export default function Home() {
    return (
    <>
    <h1>Home</h1>
    <button onClick={() => window.location.href = '/workout'}>New Workout</button>
    <ExerciseDisplay />
    <FollowCard />
  </>
    );
}