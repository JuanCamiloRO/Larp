// components/FollowButton.jsx
// Same follow/unfollow logic as before, unchanged. Added: lucide-react icons
// that reflect follow state, plus a hover state on the "Following" button
// that swaps to "Unfollow" (red, UserMinus icon) so the destructive action
// is clear before the user clicks -- same pattern X/Twitter uses.

import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, UserMinus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase';
import '../css/social.css';

export default function FollowButton({ targetUserId, style }) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (!user || !targetUserId) return;
    checkFollowStatus();
  }, [user, targetUserId]);

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

  const showUnfollow = isFollowing && isHovering;

  let Icon = UserPlus;
  let label = 'Follow';
  let className = 'btn-primary follow-btn';

  if (isFollowing) {
    Icon = showUnfollow ? UserMinus : UserCheck;
    label = showUnfollow ? 'Unfollow' : 'Following';
    className = showUnfollow ? 'btn-secondary follow-btn follow-btn-danger' : 'btn-secondary follow-btn';
  }

  return (
    <button
      onClick={toggleFollow}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={className}
      style={style}
    >
      <Icon size={16} strokeWidth={2.5} />
      <span>{label}</span>
    </button>
  );
}