export default function PRToast({ toast }) {
  if (!toast) return null;

  return (
    <div className="pr-toast">
      🥇 New PR — {toast.exercise} {toast.weight}kg × {toast.reps}
    </div>
  );
}