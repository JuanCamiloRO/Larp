import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

// --- Shared utilities ---
function countByPost(rows = []) {
  return rows.reduce((counts, row) => {
    counts[row.post_id] = (counts[row.post_id] || 0) + 1;
    return counts;
  }, {});
}

function logSupabaseError(label, error) {
  if (!error) return;
  console.error(label, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });
}

export function useFeedWorkouts() {
  // --- Feed state ---
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // --- Authenticate and resolve authors followed by the viewer ---
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setWorkouts([]);
        return;
      }
      const { data: follows, error: followError } = await supabase
        .from('follows').select('following_id').eq('follower_id', user.id);
      if (followError) throw followError;
      const visibleUserIds = [...new Set([...(follows || []).map((follow) => follow.following_id), user.id])];

      // --- Load posts and both kinds of exercise via their FK relationships ---
      // RLS decides whether custom_exercises resolves for this viewer.
      // No !inner join: a missing custom exercise must not hide an entire post.
      const { data: posts, error: postsError } = await supabase
        .from('workout_posts')
        .select(`
          id,
          workout_id,
          user_id,
          caption,
          visibility,
          created_at,
          profiles!workout_posts_user_id_fkey(username, avatar_url),
          workouts!workout_posts_workout_id_fkey(
            *,
            workout_sets(
              *,
              exercises(name, images),
              custom_exercises(name, measurement_type)
            )
          )
        `)
        .in('user_id', visibleUserIds)
        .or(`user_id.eq.${user.id},visibility.eq.public,visibility.eq.followers`)
        .order('created_at', { ascending: false })
        .limit(30);
      if (postsError) throw postsError;

      const postIds = (posts || []).filter((post) => post.workouts).map((post) => post.id);
      if (!postIds.length) {
        setWorkouts([]);
        return;
      }

      // --- Interactions for the fetched posts ---
      const [likesResult, commentsResult] = await Promise.all([
        supabase.from('workout_post_likes').select('post_id, user_id').in('post_id', postIds),
        supabase.from('workout_post_comments').select('post_id').in('post_id', postIds),
      ]);
      if (likesResult.error) throw likesResult.error;
      if (commentsResult.error) throw commentsResult.error;
      const likes = likesResult.data || [];
      const likeCounts = countByPost(likes);
      const commentCounts = countByPost(commentsResult.data || []);
      const likedPostIds = new Set(likes.filter((like) => like.user_id === user.id).map((like) => like.post_id));

      // --- Shape expected by ExerciseDisplay ---
      setWorkouts((posts || []).filter((post) => post.workouts).map((post) => ({
        ...post.workouts,
        post_id: post.id,
        post_caption: post.caption,
        post_created_at: post.created_at,
        profiles: post.profiles,
        like_count: likeCounts[post.id] || 0,
        comment_count: commentCounts[post.id] || 0,
        liked_by_user: likedPostIds.has(post.id),
      })));
    } catch (cause) {
      logSupabaseError('Feed query failed:', cause);
      setError(cause.message || 'Could not load workouts.');
      setWorkouts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchFeed(); }, [fetchFeed]);
  return { workouts, loading, error, refetch: fetchFeed };
}