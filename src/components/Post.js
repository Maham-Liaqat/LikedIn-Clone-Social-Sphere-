import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Post.css';

const Post = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [commentError, setCommentError] = useState('');

  const isAuthor = user.id === post.author._id;

  const handleLike = async () => {
    try {
      const response = await axios.post(`/posts/${post._id}/like`);
      onUpdate(response.data);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentLike = async (commentId) => {
    try {
      const response = await axios.post(`/posts/${post._id}/comments/${commentId}/like`);
      onUpdate(response.data);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty');
      return;
    }

    setLoading(true);
    setCommentError('');

    try {
      const response = await axios.post(`/posts/${post._id}/comment`, {
        text: commentText
      });
      onUpdate(response.data);
      setCommentText('');
      setCommentError('');
    } catch (error) {
      console.error('Error adding comment:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add comment';
      setCommentError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (commentId, e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`/posts/${post._id}/comments/${commentId}/reply`, {
        text: replyText
      });
      onUpdate(response.data);
      setReplyText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        const response = await axios.delete(`/posts/${post._id}/comments/${commentId}`);
        onUpdate(response.data);
      } catch (error) {
        console.error('Error deleting comment:', error);
      }
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.put(`/posts/${post._id}`, {
        content: editContent
      });
      onUpdate(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`/posts/${post._id}`);
        onDelete(post._id);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextSibling) {
      e.target.nextSibling.style.display = 'flex';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const isLiked = post.likes.includes(user.id);

  const getUserInitial = (userObj) => {
    if (!userObj || !userObj.name) return '?';
    return userObj.name.charAt(0).toUpperCase();
  };

  const getUserName = (userObj) => {
    if (!userObj || !userObj.name) return 'Unknown User';
    return userObj.name;
  };

  const canDeleteComment = (comment) => {
    return user.id === comment.user._id || user.id === post.author._id;
  };

  return (
    <div className="post">
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            {post.author.profilePicture ? (
              <img 
                src={`http://localhost:5000/uploads/${post.author.profilePicture}`} 
                alt="Profile" 
                onError={handleImageError}
              />
            ) : null}
            <div className="avatar-placeholder">
              {getUserInitial(post.author)}
            </div>
          </div>
          <div className="author-info">
            <h4>{getUserName(post.author)}</h4>
            <span className="post-time">{formatDate(post.createdAt)}</span>
          </div>
        </div>
        
        {isAuthor && (
          <div className="post-actions">
            <button onClick={() => setIsEditing(!isEditing)}>Edit</button>
            <button onClick={handleDelete} className="delete-btn">Delete</button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="edit-form">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows="3"
          />
          <div className="edit-actions">
            <button onClick={handleUpdate} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="post-content">
          <p>{post.content}</p>
          {post.image && (
            <div className="post-image">
              <img 
                src={`http://localhost:5000/uploads/${post.image}`} 
                alt="Post" 
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      )}

      <div className="post-stats">
        <span>{post.likes.length} likes</span>
        <span>{post.comments.length} comments</span>
      </div>

      <div className="post-interactions">
        <button 
          onClick={handleLike}
          className={isLiked ? 'interaction-btn liked' : 'interaction-btn'}
        >
          👍 {isLiked ? 'Liked' : 'Like'}
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="interaction-btn"
        >
          💬 Comment
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Posting...' : 'Post'}
            </button>
          </form>
          
          {commentError && (
            <div className="error-message" style={{marginBottom: '1rem', fontSize: '0.8rem'}}>
              {commentError}
            </div>
          )}
          
          <div className="comments-list">
            {post.comments && post.comments.map((comment, index) => (
              <div key={comment._id || `comment-${index}`} className="comment">
                <div className="comment-author">
                  {comment.user && comment.user.profilePicture ? (
                    <img 
                      src={`http://localhost:5000/uploads/${comment.user.profilePicture}`} 
                      alt="Profile" 
                      onError={handleImageError}
                    />
                  ) : null}
                  <div className="avatar-placeholder small">
                    {getUserInitial(comment.user)}
                  </div>
                </div>
                <div className="comment-content">
                  <div className="comment-header">
                    <strong>{getUserName(comment.user)}</strong>
                    {canDeleteComment(comment) && (
                      <button 
                        onClick={() => handleDeleteComment(comment._id)}
                        className="delete-comment-btn"
                        title="Delete comment"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p>{comment.text}</p>
                  <div className="comment-actions">
                    <button 
                      onClick={() => handleCommentLike(comment._id)}
                      className={`comment-like-btn ${comment.likes && comment.likes.includes(user.id) ? 'liked' : ''}`}
                    >
                      👍 {comment.likes ? comment.likes.length : 0}
                    </button>
                    <button 
                      onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                      className="comment-reply-btn"
                    >
                      💬 Reply
                    </button>
                    <span className="comment-time">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment._id && (
                    <form onSubmit={(e) => handleReply(comment._id, e)} className="reply-form">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        disabled={loading}
                      />
                      <div className="reply-actions">
                        <button type="submit" disabled={loading}>
                          {loading ? 'Posting...' : 'Reply'}
                        </button>
                        <button type="button" onClick={() => setReplyingTo(null)}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Replies List */}
                  {comment.replies && comment.replies.map((reply, replyIndex) => (
                    <div key={reply._id || `reply-${replyIndex}`} className="reply">
                      <div className="reply-author">
                        {reply.user && reply.user.profilePicture ? (
                          <img 
                            src={`http://localhost:5000/uploads/${reply.user.profilePicture}`} 
                            alt="Profile" 
                            onError={handleImageError}
                          />
                        ) : null}
                        <div className="avatar-placeholder x-small">
                          {getUserInitial(reply.user)}
                        </div>
                      </div>
                      <div className="reply-content">
                        <strong>{getUserName(reply.user)}</strong>
                        <p>{reply.text}</p>
                        <span className="reply-time">
                          {formatDate(reply.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Post;