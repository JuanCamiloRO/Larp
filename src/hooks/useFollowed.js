import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export function useFollowed(userId) {
  const [followed, setFollowed] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowed = useCallback(async () => {
    if (!userId) {
      setFollowed([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
  .from('follows')
  .select(`
    following_id,
    profile:profiles!following_id (
      id,
      username,
      avatar_url
    )
  `)
  .eq('follower_id', userId);

    if (!error && data) {
      setFollowed(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchFollowed();
  }, [fetchFollowed]);

  const followedIds = followed.map((row) => row.follower_id);

  return { followed, followedIds, loading, refetchFollowed: fetchFollowed };
}