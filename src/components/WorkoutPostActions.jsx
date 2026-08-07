import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { supabase } from '../supabase';
import '../css/home.css';

export default function WorkoutPostActions({
  postId,
  initialLikeCount = 0,
  initiallyLiked = false,
  commentCount = 0,
  onComment,
}) {
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

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Could not get authenticated user:', authError);
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