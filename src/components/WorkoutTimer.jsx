// components/WorkoutTimer.jsx
import { useEffect, useState } from "react";
import "../css/workout-timer.css";

function formatTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function WorkoutTimer({ startedAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startedAt) return undefined;

    const updateClock = () => {
      setNow(Date.now());
    };

    updateClock();

    const interval = window.setInterval(updateClock, 1000);

    document.addEventListener("visibilitychange", updateClock);
    window.addEventListener("focus", updateClock);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", updateClock);
      window.removeEventListener("focus", updateClock);
    };
  }, [startedAt]);

  const startedAtMilliseconds = new Date(startedAt).getTime();

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - startedAtMilliseconds) / 1000)
  );

  return (
    <span className="workout-chronometer">
      {formatTime(elapsedSeconds)}
    </span>
  );
}