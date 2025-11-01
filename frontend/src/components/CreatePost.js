import React, { useState } from 'react';
import axios from 'axios';
import './CreatePost.css';

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Post content cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('content', content);
      if (image) {
        formData.append('image', image);
      }

      const response = await axios.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      onPostCreated(response.data);
      setContent('');
      setImage(null);
      // Reset file input
      const fileInput = document.getElementById('image-input');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div className="create-post">
      <form onSubmit={handleSubmit} className="post-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows="3"
        />
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="post-actions">
          <div className="file-input">
            <label htmlFor="image-input" className="file-label">
              📷 Add Image
            </label>
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !content.trim()}
            className="post-btn"
          >
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
        
        {image && (
          <div className="image-preview">
            <img src={URL.createObjectURL(image)} alt="Preview" />
            <button 
              type="button" 
              onClick={() => setImage(null)}
              className="remove-image"
            >
              Remove
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CreatePost;