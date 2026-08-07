import { useEffect, useState } from 'react';
import { Send, Trash2, X } from 'lucide-react';
import { supabase } from '../supabase';
import '../css/home.css';

function formatCommentDate(value) {
  if (!value) return '';

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default function WorkoutPostComments({
  postId,
  onClose,
  onCountChange,
}) {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  function WorkoutPostCommentsSkeleton() {
    return (
      <div
        className="workout-comments-list workout-comments-list--skeleton"
        aria-busy="true"
        aria-label="Loading comments"
      >
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="workout-comment workout-comment--skeleton" key={index}>
            <div className="skeleton skeleton--comment-avatar" />

            <div className="workout-comment-skeleton__content">
              <div className="skeleton skeleton--comment-meta" />
              <div className="skeleton skeleton--comment-line" />
              <div className="skeleton skeleton--comment-line-short" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  useEffect(() => {
    let active = true;

    async function loadComments() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      setCurrentUserId(user?.id || null);

      const { data, error: commentsError } = await supabase
        .from('workout_post_comments')
        .select(`
          id,
          post_id,
          user_id,
          body,
          created_at,
          profiles(username, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (!active) return;

      if (commentsError) {
        console.error('Comments query failed:', commentsError);
        setError(commentsError.message);
      } else {
        setComments(data || []);
      }

      setLoading(false);
    }

    if (postId) {
      loadComments();
    } else {
      setLoading(false);
      setError('This workout does not have a post ID.');
    }

    return () => {
      active = false;
    };
  }, [postId]);

  async function submitComment(event) {
    event.preventDefault();

    const trimmedBody = body.trim();
    if (!trimmedBody || sending) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be signed in to comment.');
      return;
    }

    setSending(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from('workout_post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        body: trimmedBody,
      })
      .select(`
        id,
        post_id,
        user_id,
        body,
        created_at,
        profiles(username, avatar_url)
      `)
      .single();

    if (insertError) {
      console.error('Comment insert failed:', insertError);
      setError(insertError.message);
      setSending(false);
      return;
    }

    setComments((current) => [...current, data]);
    setBody('');
    onCountChange?.(comments.length + 1);
    setSending(false);
  }

  async function deleteComment(commentId) {
    const { error: deleteError } = await supabase
      .from('workout_post_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', currentUserId);

    if (deleteError) {
      console.error('Comment delete failed:', deleteError);
      setError(deleteError.message);
      return;
    }

    setComments((current) => current.filter((comment) => comment.id !== commentId));
    onCountChange?.(Math.max(0, comments.length - 1));
  }

  return (
    <div
      className="workout-comments-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="workout-comments-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Comments"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="workout-comments-header">
          <div>
            <span className="workout-comments-eyebrow">Community</span>
            <h2>Comments</h2>
          </div>

          <button
            type="button"
            className="workout-comments-close"
            onClick={onClose}
            aria-label="Close comments"
          >
            <X size={19} />
          </button>
        </header>

        {loading ? (
          <WorkoutPostCommentsSkeleton />
        ) : (
          <div className="workout-comments-list">
            {!comments.length && (
              <p className="subtle">Be the first to comment.</p>
            )}

            {comments.map((comment) => {
              const username = comment.profiles?.username || 'Unknown lifter';

              return (
                <article className="workout-comment" key={comment.id}>
                  <div className="workout-comment-avatar">
                    {comment.profiles?.avatar_url ? (
                      <img src={comment.profiles.avatar_url} alt="" />
                    ) : (
                      username.slice(0, 1).toUpperCase()
                    )}
                  </div>

                  <div className="workout-comment-content">
                    <div className="workout-comment-meta">
                      <strong>@{username}</strong>
                      <time>{formatCommentDate(comment.created_at)}</time>
                    </div>
                    <p>{comment.body}</p>
                  </div>

                  {comment.user_id === currentUserId && (
                    <button
                      type="button"
                      className="workout-comment-delete"
                      onClick={() => deleteComment(comment.id)}
                      aria-label="Delete comment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {error && <p className="workout-comments-error">{error}</p>}

        <form className="workout-comments-form" onSubmit={submitComment}>
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write a comment..."
            maxLength={500}
            aria-label="Write a comment"
          />
          <button
            type="submit"
            disabled={!body.trim() || sending}
            aria-label="Send comment"
          >
            <Send size={17} />
          </button>
          <div style = {{height: 'calc(104px + env(safe-area-inset-bottom, 0px))'}}></div>
        </form>
      </section>
    </div>
  );
}