// components/RestTimer.jsx
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import "../css/rest-timer.css";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function RestTimer({ startedAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!startedAt) return undefined;

    const updateClock = () => {
      setNow(Date.now());
    };

    updateClock();

    const interval = window.setInterval(updateClock, 1000);

    // Immediately correct the visual time after returning from Spotify,
    // another browser tab, or a locked screen.
    document.addEventListener("visibilitychange", updateClock);
    window.addEventListener("focus", updateClock);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", updateClock);
      window.removeEventListener("focus", updateClock);
    };
  }, [startedAt]);

  const elapsedSeconds = Math.max(
    0,
    Math.floor((now - startedAt) / 1000)
  );

  return (
    <div className="rest-chronometer">
      <div className="rest-chronometer__row">
        <Clock size={12} className="rest-chronometer__icon" />
        <span className="rest-chronometer__label">Rest</span>
      </div>
      <span className="rest-chronometer__time">
        {formatTime(elapsedSeconds)}
      </span>
    </div>
  );
}