import ProfileSearchBar from "../components/ProfileSearchBar";
import FollowCard from "../components/FollowCard";
export default function Discover() {
  return (
    <div className="discover-page">
      <h1>Discover</h1>
      <ProfileSearchBar />
      <h2></h2>
        <FollowCard />
    </div>
  );
}