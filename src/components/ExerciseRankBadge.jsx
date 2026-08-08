// components/ExerciseRankBadge.jsx
// Unchanged logic -- works for all 7 tiers automatically since it looks
// up TIERS[rank.rank] generically rather than hardcoding tier names.

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { TIERS } from '../lib/rankTiers';

export default function ExerciseRankBadge({ exerciseId, userId, compact = false }) {
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
    compact ? (
  <span >
    <img src={tier.icon} alt={tier.label} className="muscle-icon"  style={{width: "38px", height: "38px"}}   />
  </span>
) : (
  <span className="exercise-rank-badge">
    <img src={tier.icon} alt={tier.label} className="rank-icon" />
    <span className="exercise-rank-label">{tier.label}</span>
  </span>
)
  );
}