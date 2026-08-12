// components/RestTimer.jsx
import { useEffect, useState } from "react";
import "../css/rest-timer.css";

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function RestTimer({ startSignal, onClose }) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [running, setRunning] = useState(true);

  // Every completed set gives this component a new startSignal.
  // Reset the rest stopwatch and immediately start it again.
  useEffect(() => {
    setSecondsElapsed(0);
    setRunning(true);
  }, [startSignal]);

  useEffect(() => {
    if (!running) return undefined;

    const interval = window.setInterval(() => {
      setSecondsElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  const resetTimer = () => {
    setSecondsElapsed(0);
    setRunning(true);
  };

  return (
  <div className="rest-chronometer">
    <span className="rest-chronometer__label">Rest</span>
    <span className="rest-chronometer__time">
      {formatTime(secondsElapsed)}
    </span>
  </div>
);
}