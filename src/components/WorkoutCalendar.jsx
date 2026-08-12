// components/WorkoutCalendar.jsx
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "../supabase";
import { useAuth } from "../hooks/useAuth";
import "../css/calendar.css";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const padNumber = (number) => String(number).padStart(2, "0");

function getDateKey(date) {
  return [
    date.getFullYear(),
    padNumber(date.getMonth() + 1),
    padNumber(date.getDate()),
  ].join("-");
}

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getNextMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

function getCalendarStart(monthStart) {
  const dayOfWeek = monthStart.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const start = new Date(monthStart);
  start.setDate(start.getDate() - mondayOffset);

  return start;
}

function getCalendarDays(monthStart) {
  const calendarStart = getCalendarStart(monthStart);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);

    return date;
  });
}

export default function WorkoutCalendar({ userId }) {
  const { user } = useAuth();

  const targetUserId = userId ?? user?.id;

  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const monthStart = useMemo(
    () => getMonthStart(visibleMonth),
    [visibleMonth]
  );

  const nextMonthStart = useMemo(
    () => getNextMonthStart(visibleMonth),
    [visibleMonth]
  );

  const calendarDays = useMemo(
    () => getCalendarDays(monthStart),
    [monthStart]
  );

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(visibleMonth),
    [visibleMonth]
  );

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    async function loadWorkouts() {
      setLoading(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("workouts")
        .select("id, name, ended_at, sets, volume, duration")
        .eq("user_id", targetUserId)
        .not("ended_at", "is", null)
        .gte("ended_at", monthStart.toISOString())
        .lt("ended_at", nextMonthStart.toISOString())
        .order("ended_at", { ascending: true });

      if (queryError) {
        console.error("Load calendar workouts:", queryError);
        setError("Could not load workout calendar.");
        setWorkouts([]);
      } else {
        setWorkouts(data ?? []);
      }

      setLoading(false);
    }

    loadWorkouts();
  }, [targetUserId, monthStart, nextMonthStart]);

  const workoutsByDate = useMemo(() => {
    return workouts.reduce((result, workout) => {
      const dateKey = getDateKey(new Date(workout.ended_at));

      if (!result[dateKey]) {
        result[dateKey] = [];
      }

      result[dateKey].push(workout);

      return result;
    }, {});
  }, [workouts]);

  const previousMonth = () => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1)
    );
  };

  const goToCurrentMonth = () => {
    setVisibleMonth(new Date());
  };

  const todayKey = getDateKey(new Date());
  const completedWorkoutCount = workouts.length;
  const trainingDayCount = Object.keys(workoutsByDate).length;

  return (
    <section className="workout-calendar">
      <header className="workout-calendar__header">
        <div>
          <p className="workout-calendar__eyebrow">Consistency</p>
          <h2 className="workout-calendar__title">Workout calendar</h2>
        </div>

        <div className="workout-calendar__stats">
          <span>
            <strong>{completedWorkoutCount}</strong> workouts
          </span>

          <span>
            <strong>{trainingDayCount}</strong> days trained
          </span>
        </div>
      </header>

      <div className="workout-calendar__navigation">
        <button
          type="button"
          className="workout-calendar__nav-button"
          onClick={previousMonth}
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          type="button"
          className="workout-calendar__month-button"
          onClick={goToCurrentMonth}
          title="Return to current month"
        >
          {monthLabel}
        </button>

        <button
          type="button"
          className="workout-calendar__nav-button"
          onClick={nextMonth}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? (
        <p className="workout-calendar__message">Loading calendar...</p>
      ) : error ? (
        <p className="workout-calendar__message workout-calendar__message--error">
          {error}
        </p>
      ) : (
        <>
          <div className="workout-calendar__weekdays">
            {WEEK_DAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="workout-calendar__grid">
            {calendarDays.map((date) => {
              const dateKey = getDateKey(date);
              const dayWorkouts = workoutsByDate[dateKey] ?? [];
              const workoutCount = dayWorkouts.length;

              const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
              const isToday = dateKey === todayKey;
              const hasWorkout = workoutCount > 0;

              const workoutLabel =
                workoutCount === 1
                  ? "1 completed workout"
                  : `${workoutCount} completed workouts`;

              return (
                <div
                  key={dateKey}
                  className={[
                    "workout-calendar__day",
                    !isCurrentMonth && "workout-calendar__day--outside",
                    isToday && "workout-calendar__day--today",
                    hasWorkout && "workout-calendar__day--completed",
                    workoutCount > 1 && "workout-calendar__day--multiple",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  title={hasWorkout ? workoutLabel : undefined}
                >
                  <span className="workout-calendar__day-number">
                    {date.getDate()}
                  </span>

                  {hasWorkout && (
                    <span className="workout-calendar__indicator">
                      {workoutCount > 1 ? workoutCount : "•"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <footer className="workout-calendar__legend">
            <span>
              <span className="workout-calendar__legend-dot" />
              Completed workout
            </span>

            <span>
              Click the month name to return to today
            </span>
          </footer>
        </>
      )}
    </section>
  );
}