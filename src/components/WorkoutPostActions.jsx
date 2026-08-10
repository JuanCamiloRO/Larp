import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { Heart, MessageCircle } from 'lucide-react';
import { supabase } from '../supabase';
import '../css/home.css';

export default function WorkoutPostActions({
  postId,
  postOwnerId,
  initialLikeCount = 0,
  initiallyLiked = false,
  commentCount = 0,
  onComment,
}) {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [saving, setSaving] = useState(false);

  async function toggleLike() {
    if (!postId || saving) {
      console.error('Cannot like post: missing postId or request is saving', {
        postId,
        saving,
      });
      return;
    }

    if (!user) {
      console.error('Cannot like post: no authenticated user');
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1)));
    setSaving(true);

    const result = nextLiked
      ? await supabase.from('workout_post_likes').insert({
          post_id: postId,
          user_id: user.id,
        })
      : await supabase
          .from('workout_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

    if (result.error) {
      console.error('Like request failed:', {
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint,
        code: result.error.code,
      });

      setLiked(previousLiked);
      setLikeCount(previousCount);
      setSaving(false);
      return;
    }

    if (postOwnerId && user.id !== postOwnerId) {
      if (nextLiked) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: postOwnerId,
            actor_id: user.id,
            type: 'like',
            title: 'New like',
            actor_avatar_url: profile?.avatar_url || null,
            body: `${profile?.username || 'Someone'} liked your post`,
            reference_id: postId,
          });

        if (notificationError) {
          console.error('Failed to create like notification:', notificationError);
        }
      } else {
        console.log({ postOwnerId, userId: user.id, postId })
        const { data: deletedRows, error: deleteNotifError } = await supabase
  .from('notifications')
  .delete()
  .eq('actor_id', user.id)
  .eq('type', 'like')
  .eq('reference_id', postId);



        if (deleteNotifError) {
          console.error('Failed to delete like notification:', deleteNotifError);
        }
      }
    }

    setSaving(false);
  }

  return (
    <div className="workout-post-actions">
      <button
        type="button"
        className={`workout-post-action ${liked ? 'is-liked' : ''}`}
        onClick={toggleLike}
        disabled={saving}
        aria-pressed={liked}
        aria-label={liked ? 'Unlike workout' : 'Like workout'}
      >
        <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
        <span>{likeCount}</span>
      </button>

      <button
        type="button"
        className="workout-post-action"
        onClick={onComment}
        aria-label="View comments"
      >
        <MessageCircle size={17} />
        <span>{commentCount}</span>
      </button>
    </div>
  );
}