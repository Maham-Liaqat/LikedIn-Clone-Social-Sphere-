import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreatePost from './CreatePost';
import Post from './Post';
import './Feed.css';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/posts');
      setPosts(response.data);
    } catch (error) {
      setError('Failed to load posts');
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const updatePost = (updatedPost) => {
    setPosts(posts.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const deletePost = (postId) => {
    setPosts(posts.filter(post => post._id !== postId));
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  return (
    <div className="feed">
      <div className="feed-container">
        <CreatePost onPostCreated={addPost} />
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="posts-list">
          {posts.length === 0 ? (
            <div className="no-posts">
              <p>No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map(post => (
              <Post 
                key={post._id} 
                post={post} 
                onUpdate={updatePost}
                onDelete={deletePost}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;