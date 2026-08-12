import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
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

/**
 * Live elapsed-time display for an active workout session.
 * Rendered in the Workout page header once `startedAt` is set.
 */
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
  const formattedTime = formatTime(elapsedSeconds);

  return (
    <div
      className="workout-chronometer"
      role="timer"
      aria-live="polite"
      aria-label={`Workout duration: ${formattedTime}`}
    >
      <Timer size={14} className="workout-chronometer__icon" aria-hidden="true" />
      <span className="workout-chronometer__label">Duration</span>
      <span className="workout-chronometer__divider" aria-hidden="true" />
      <span className="workout-chronometer__time">{formattedTime}</span>
    </div>
  );
}
