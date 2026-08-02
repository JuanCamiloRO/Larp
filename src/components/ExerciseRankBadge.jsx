// components/ExerciseRankBadge.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { TIERS } from '../lib/rankTiers';

export default function ExerciseRankBadge({ exerciseId, userId }) {
  const [rank, setRank] = useState(null);

  useEffect(() => {
    async function fetchRank() {
      const { data } = await supabase
        .from('exercise_ranks')
        .select('rank, best_1rm')
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .maybeSingle();

      if (data) setRank(data);
    }
    fetchRank();
  }, [exerciseId, userId]);

  if (!rank) return null;

  const tier = TIERS[rank.rank];
  if (!tier) return null;

  return (
    <span className="exercise-rank-badge">
      <img src={tier.icon} alt={tier.label} className="rank-icon" />
      {tier.label}
    </span>
  );
}