// components/FollowButton.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';

export default function FollowButton({ targetUserId }) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    checkFollowStatus();
  }, [targetUserId]);

  async function checkFollowStatus() {
    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();
    setIsFollowing(!!data);
  }

  async function toggleFollow() {
    if (isFollowing) {
      await supabase.from('follows').delete()
        .eq('follower_id', user.id).eq('following_id', targetUserId);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
    }
    setIsFollowing(!isFollowing);
  }

  return (
    <button onClick={toggleFollow} className={isFollowing ? 'btn-secondary' : 'btn-primary'}>
      {isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}