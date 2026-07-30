import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

const TIERS = {
  larp_baby: { label: 'Larp Baby', icon: '/ranks/bronze.png' },
  larpy: { label: 'Larpy', icon: '/ranks/diamond.png' },
  master_larp: { label: 'Master Larp', icon: '/ranks/unreal.png' },
};

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
      console.log('Rank fetch:', { exerciseId, userId, data });
    }
    fetchRank();
  }, [exerciseId, userId]);

  if (!rank) return null;

  const tier = TIERS[rank.rank];

  return (
    <span className="exercise-rank-badge">
      <img src={tier.icon} alt={tier.label} className="rank-icon" />
      {tier.label}
    </span>
  );
}