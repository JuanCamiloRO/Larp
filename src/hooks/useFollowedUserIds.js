// hooks/useFollowedUserIds.js
// Returns the set of user_ids the current user follows, for scoping
// leaderboards (or any other view) to "friends only". Assumes a 'follows'
// table with columns (follower_id, following_id) -- adjust names here if
// your schema differs.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export function useFollowedUserIds(userId) {
  const [followedIds, setFollowedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowed = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (!error && data) {
      setFollowedIds(data.map((row) => row.following_id));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFollowed();
  }, [fetchFollowed]);

  return { followedIds, loading, refetchFollowed: fetchFollowed };
}