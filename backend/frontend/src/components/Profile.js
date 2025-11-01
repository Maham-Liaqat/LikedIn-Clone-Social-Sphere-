import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    name: '',
    headline: '',
    location: '',
    website: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setProfile(user);
      setFormData({
        name: user.name || '',
        headline: user.headline || '',
        location: user.location || '',
        website: user.website || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.put('/users/profile', formData);
      setProfile(response.data);
      updateUser(response.data);
      setIsEditing(false);
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profilePicture', file);

    setLoading(true);
    try {
      const response = await axios.post('/users/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setProfile(response.data);
      updateUser(response.data);
      setMessage('Profile picture updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Error uploading profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!profile) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile">
      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-cover">
            <div className="cover-placeholder"></div>
          </div>
          
          <div className="profile-info-section">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                <input
                  type="file"
                  id="profile-picture"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profile-picture" className="avatar-upload-label">
                  {profile.profilePicture ? (
                    <img 
                      src={`http://localhost:5000/uploads/${profile.profilePicture}`} 
                      alt="Profile" 
                      className="profile-avatar-img"
                    />
                  ) : (
                    <div className="avatar-placeholder large">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="avatar-upload-overlay">
                    <span>📷</span>
                  </div>
                </label>
              </div>
              
              <div className="profile-basic-info">
                {isEditing ? (
                  <form onSubmit={handleUpdate} className="profile-form">
                    <div className="form-group">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Full Name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="headline"
                        value={formData.headline}
                        onChange={handleChange}
                        placeholder="Headline (e.g., Software Engineer)"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Location"
                      />
                    </div>
                    <div className="form-group">
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="Website URL"
                      />
                    </div>
                    <div className="form-group">
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        placeholder="Tell us about yourself..."
                        rows="4"
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" disabled={loading} className="save-btn">
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setIsEditing(false)}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h1>{profile.name}</h1>
                    <p className="headline">{profile.headline || 'Add a headline to your profile'}</p>
                    <p className="location">{profile.location}</p>
                    <p className="website">
                      {profile.website && (
                        <a href={profile.website} target="_blank" rel="noopener noreferrer">
                          {profile.website}
                        </a>
                      )}
                    </p>
                    <p className="bio">{profile.bio}</p>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="edit-profile-btn"
                    >
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>
            {message}
          </div>
        )}

        {/* Profile Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile Info
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <div className="profile-details">
              <div className="detail-card">
                <h3>About</h3>
                <p>{profile.bio || 'No bio added yet.'}</p>
              </div>
              
              <div className="detail-card">
                <h3>Contact Information</h3>
                <div className="contact-info">
                  <div className="contact-item">
                    <strong>Email:</strong> {profile.email}
                  </div>
                  {profile.location && (
                    <div className="contact-item">
                      <strong>Location:</strong> {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <div className="contact-item">
                      <strong>Website:</strong> 
                      <a href={profile.website} target="_blank" rel="noopener noreferrer">
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="profile-stats">
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Posts</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Connections</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Following</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">0</div>
                <div className="stat-label">Followers</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;