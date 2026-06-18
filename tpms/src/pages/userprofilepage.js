// src/pages/UserProfilePage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../components/userprofile.css';

const API_URL = 'http://127.0.0.1:8000';

const UserProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [followStats, setFollowStats] = useState({
    followers_count: 0,
    following_count: 0,
    is_followed_by_user: false
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', users: [] });
  const [modalLoading, setModalLoading] = useState(false);

  const { username } = useParams();
  const navigate = useNavigate();

  const getAttachmentUrl = (attachment) => {
    if (!attachment) return null;
    return attachment.startsWith('http')
      ? attachment
      : `${API_URL}${attachment.startsWith('/') ? attachment : '/' + attachment}`;
  };

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Fetch current user
        const meRes = await axios.get(`${API_URL}/api/profile/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setCurrentUser(meRes.data);

        // Fetch target profile
        const profileRes = await axios.get(`${API_URL}/api/profiles/${username}/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setProfileData(profileRes.data);

        // Fetch follow stats
        const statsRes = await axios.get(`${API_URL}/api/users/${profileRes.data.id}/follow-stats/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setFollowStats(statsRes.data);

        // Fetch posts of this user
        const postsRes = await axios.get(`${API_URL}/api/posts/`, {
          headers: { Authorization: `Token ${token}` }
        });
        const userPosts = postsRes.data.filter(p => p.author === profileRes.data.id);
        setPosts(userPosts);
      } catch (err) {
        console.error("Failed to fetch profile/posts", err);
        alert("Profile not found.");
        navigate('/posts');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndPosts();
  }, [username, navigate]);

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    const token = localStorage.getItem('authToken');
    try {
      await axios.delete(`${API_URL}/api/posts/${postId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  const handleFollowToggle = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      if (followStats.is_followed_by_user) {
        await axios.delete(`${API_URL}/api/users/${profileData.id}/follow/`, {
          headers: { Authorization: `Token ${token}` }
        });
        setFollowStats(prev => ({
          ...prev,
          is_followed_by_user: false,
          followers_count: prev.followers_count - 1
        }));
      } else {
        await axios.post(`${API_URL}/api/users/${profileData.id}/follow/`, {}, {
          headers: { Authorization: `Token ${token}` }
        });
        setFollowStats(prev => ({
          ...prev,
          is_followed_by_user: true,
          followers_count: prev.followers_count + 1
        }));
      }
    } catch (err) {
      console.error("Follow/unfollow failed", err);
    }
  };

  const openFollowModal = async (listType) => {
    setIsModalOpen(true);
    setModalLoading(true);
    setModalContent({ title: 'Loading...', users: [] });

    const token = localStorage.getItem('authToken');
    try {
      const res = await axios.get(`${API_URL}/api/users/${profileData.id}/${listType}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setModalContent({
        title: listType.charAt(0).toUpperCase() + listType.slice(1),
        users: res.data
      });
    } catch (err) {
      setModalContent({ title: listType, users: [] });
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => setIsModalOpen(false);

  if (loading) return <div className="tpms-dashboard">Loading profile...</div>;
  if (!profileData) return <div className="tpms-dashboard">Profile could not be loaded.</div>;

  const isOwnProfile = currentUser && currentUser.username === profileData.username;
  const isRecruiter = profileData.profile?.role === "recruiter";

  const profilePic = profileData.profile?.profile_picture
    ? (profileData.profile.profile_picture.startsWith('http')
      ? profileData.profile.profile_picture
      : `${API_URL}${profileData.profile.profile_picture}`)
    : 'https://www.transparentpng.com/download/user/gray-user-profile-icon-png-fP8Q1P.png';

  return (
    <div className="tpms-dashboard">
      {/* Navbar */}
      <nav className="demo-navbar">
        <div className="nav-brand">@{profileData.username}</div>
      </nav>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="profile-header">
            <img src={profilePic} alt={profileData.username} className="profile-avatar" />
            <div className="profile-info">
              <h1>{profileData.first_name} {profileData.last_name}</h1>
              <p className="role-text">
                {profileData.role || profileData.profile?.role || 'No role set'}
              </p>
              {/* --- NEW: Bio for Recruiters --- */}
              {isRecruiter && (
                <div className="profile-bio">
                  <h3>About</h3>
                  <p>{profileData.profile?.bio && profileData.profile.bio.trim() !== ""
                        ? profileData.profile.bio
                        : "Bio not updated"}</p>
                </div>
              )}
            </div>
          </div>
          <div className="user-stats">
            <div className="stat-item" onClick={() => openFollowModal('followers')}>
              <span className="stat-number">{followStats.followers_count}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item" onClick={() => openFollowModal('following')}>
              <span className="stat-number">{followStats.following_count}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="main-content">
          <div className="dashboard-card">
            <div className="card-header">
              <h3>{profileData.first_name}’s Posts</h3>
            </div>
            {posts.length > 0 ? (
              <div className="portfolio-grid">
                {posts.map(post => {
                  const attachmentUrl = getAttachmentUrl(post.attachment);
                  const isMyPost = currentUser && post.author === currentUser.id;
                  return (
                    <div 
                      key={post.id} 
                      className="portfolio-item"
                      onClick={() => navigate(`/posts/${post.id}`)}
                    >
                      <div className="portfolio-thumbnail">
                        {attachmentUrl ? (
                          <img src={attachmentUrl} alt="post" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                        ) : (
                          <div className="item-type">Text</div>
                        )}
                      </div>
                      <div className="portfolio-info">
                        <h4>{post.content.length > 50 ? post.content.slice(0,50)+'...' : post.content}</h4>
                        {isMyPost && (
                          <button
                            className="text-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p>No posts yet.</p>}
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="dashboard-card">
            <h3>Actions</h3>
            {isOwnProfile ? (
              <button className="primary-button" onClick={() => navigate('/profile')}>Edit Profile</button>
            ) : (
              <button
                onClick={handleFollowToggle}
                className={followStats.is_followed_by_user ? 'secondary-button' : 'primary-button'}
              >
                {followStats.is_followed_by_user ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>

          <div className="dashboard-card">
            <h3>Skills</h3>
            {profileData.profile?.skills?.length > 0 ? (
              <ul className="skills-list">
                {profileData.profile.skills.map(skill => (
                  <li key={skill.id} className="skill-tag">{skill.name}</li>
                ))}
              </ul>
            ) : (
              <p>No skills added yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{modalContent.title}</h2>
            {modalLoading ? <p>Loading...</p> : (
              <ul className="user-list">
                {modalContent.users.length > 0 ? modalContent.users.map(user => (
                  <li key={user.id} className="user-list-item">
                    <img
                      src={user.profile_picture_url ? `${API_URL}${user.profile_picture_url}` : 'https://www.transparentpng.com/download/user/gray-user-profile-icon-png-fP8Q1P.png'}
                      alt={user.username}
                      className="user-list-avatar"
                    />
                    <div className="user-list-info">
                      <Link to={`/profiles/${user.username}`} onClick={closeModal}>
                        {user.first_name} {user.last_name}
                      </Link>
                      <p>@{user.username}</p>
                    </div>
                  </li>
                )) : <p>No users found.</p>}
              </ul>
            )}
            <div className="modal-actions">
              <button onClick={closeModal} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
