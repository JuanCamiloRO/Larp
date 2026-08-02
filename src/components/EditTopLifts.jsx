// pages/EditTopLifts.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

export default function EditTopLifts() {
  const { user } = useAuth();
  const [allRecords, setAllRecords] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchAllRecords();
    fetchCurrentPins();
  }, [user]);

  async function fetchAllRecords() {
    setLoading(true);
    const { data, error } = await supabase
      .from('exercise_ranks')
      .select('best_1rm, exercises(id, name)')
      .eq('user_id', user.id)
      .order('best_1rm', { ascending: false });

    if (error) {
      console.error('fetchAllRecords error:', error.message);
    } else {
      setAllRecords(data || []);
    }
    setLoading(false);
  }

  async function fetchCurrentPins() {
    const { data, error } = await supabase
      .from('pinned_lifts')
      .select('exercise_id, position')
      .eq('user_id', user.id)
      .order('position');

    if (error) {
      console.error('fetchCurrentPins error:', error.message);
    } else {
      setSelected((data || []).map((p) => p.exercise_id));
    }
  }

  function toggleSelect(exerciseId) {
    setSelected((prev) => {
      if (prev.includes(exerciseId)) {
        return prev.filter((id) => id !== exerciseId);
      }
      if (prev.length >= 5) return prev;
      return [...prev, exerciseId];
    });
  }

  async function savePins() {
    if (!user) return;
    setSaving(true);
    await supabase.from('pinned_lifts').delete().eq('user_id', user.id);

    if (selected.length > 0) {
      const rows = selected.map((exerciseId, index) => ({
        user_id: user.id,
        exercise_id: exerciseId,
        position: index + 1,
      }));
      await supabase.from('pinned_lifts').insert(rows);
    }
    setSaving(false);
  }

  if (!user || loading) {
    return <p className="subtle" style={{ padding: '16px' }}>Loading...</p>;
  }

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ color: 'white' }}>Choose your top lifts</h1>
      <p className="subtle" style={{ marginBottom: '16px' }}>
        Pick up to 5 lifts to showcase on your profile. Leave empty to auto-show your best 5.
      </p>

      <div className="leaderboard-list">
        {allRecords.map((r) => {
          const isSelected = selected.includes(r.exercises.id);
          const order = selected.indexOf(r.exercises.id) + 1;
          return (
            <div
              key={r.exercises.id}
              className={`leaderboard-row ${isSelected ? 'you' : ''}`}
              onClick={() => toggleSelect(r.exercises.id)}
              style={{ cursor: 'pointer' }}
            >
              <span className="leaderboard-rank">{isSelected ? order : ''}</span>
              <span className="follow-name">{r.exercises.name}</span>
              <span className="leaderboard-1rm">{Math.round(r.best_1rm)}kg</span>
            </div>
          );
        })}
      </div>

      <button
        className="btn-primary"
        style={{ marginTop: '20px', width: '100%' }}
        onClick={savePins}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save selection'}
      </button>
    </div>
  );
}