import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export function useFollowersUserIds(userId) {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowers = useCallback(async () => {
    if (!userId) {
      setFollowers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
  .from('follows')
  .select(`
    follower_id,
    profile:profiles!follower_id (
      id,
      username,
      avatar_url
    )
  `)
  .eq('following_id', userId);

    if (!error && data) {
      setFollowers(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  const followerIds = followers.map((row) => row.follower_id);

  return { followers, followerIds, loading, refetchFollowers: fetchFollowers };
}