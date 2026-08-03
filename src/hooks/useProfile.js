// hooks/useProfile.js
// Fetches a user's profile row. Accepts an optional userId -- when omitted,
// defaults to the currently authenticated user (preserving useProfile() as
// used on Dashboard); when passed, fetches that user's profile instead
// (used by PublicProfile).

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../supabase';

export function useProfile(userId) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) {
        setError(error.message);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [targetUserId]);

  return { profile, loading, error };
}