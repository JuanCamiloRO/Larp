import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';

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
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setWorkouts([]);
      setLoading(false);
      return;
    }

    const { data: follows, error: followError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followError) {
      logSupabaseError('Feed follows query failed:', followError);
      setError(followError.message);
      setLoading(false);
      return;
    }

    const visibleUserIds = [
      ...new Set([
        ...(follows || []).map((follow) => follow.following_id),
        user.id,
      ]),
    ];

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
            exercises(name, images)
          )
        )
      `)
      .in('user_id', visibleUserIds)
      .order('created_at', { ascending: false })
      .limit(30);

    if (postsError) {
      logSupabaseError('Feed posts query failed:', postsError);
      setError(postsError.message);
      setLoading(false);
      return;
    }

    const postIds = (posts || []).map((post) => post.id);

    if (postIds.length === 0) {
      setWorkouts([]);
      setLoading(false);
      return;
    }

    const [likesResult, commentsResult] = await Promise.all([
      supabase
        .from('workout_post_likes')
        .select('post_id, user_id')
        .in('post_id', postIds),
      supabase
        .from('workout_post_comments')
        .select('post_id')
        .in('post_id', postIds),
    ]);

    if (likesResult.error || commentsResult.error) {
      const queryError = likesResult.error || commentsResult.error;
      logSupabaseError('Feed interaction query failed:', queryError);
      setError(queryError.message);
      setLoading(false);
      return;
    }

    const likes = likesResult.data || [];
    const comments = commentsResult.data || [];
    const likeCounts = countByPost(likes);
    const commentCounts = countByPost(comments);
    const likedPostIds = new Set(
      likes
        .filter((like) => like.user_id === user.id)
        .map((like) => like.post_id)
    );

    const normalizedWorkouts = (posts || [])
      .filter((post) => post.workouts)
      .map((post) => ({
        ...post.workouts,
        post_id: post.id,
        post_caption: post.caption,
        post_created_at: post.created_at,
        profiles: post.profiles,
        like_count: likeCounts[post.id] || 0,
        comment_count: commentCounts[post.id] || 0,
        liked_by_user: likedPostIds.has(post.id),
      }));

    setWorkouts(normalizedWorkouts);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return { workouts, loading, error, refetch: fetchFeed };
}