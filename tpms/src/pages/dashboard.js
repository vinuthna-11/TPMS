// src/pages/Dashboard.js
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import "../components/dashboard.css";

const API_URL = "http://127.0.0.1:8000";

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null);
  const [activeCommentSection, setActiveCommentSection] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostFile, setNewPostFile] = useState(null);
  const [shareTooltip, setShareTooltip] = useState(null);

  const navigate = useNavigate();

  // ------------------- FETCH DATA -------------------
  const fetchData = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const [profileRes, postsRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/api/profile/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        axios.get(`${API_URL}/api/posts/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        axios.get(`${API_URL}/api/users/`, {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);

      setCurrentUser(profileRes.data);
      setPosts(postsRes.data);

      // Fetch follow status for all users except self
      const usersWithFollowStatus = await Promise.all(
        usersRes.data
          .filter((u) => u.id !== profileRes.data.id && u.id !== 1)
          .map(async (user) => {
            try {
              const statsRes = await axios.get(
                `${API_URL}/api/users/${user.id}/follow-stats/`,
                { headers: { Authorization: `Token ${token}` } }
              );
              return { ...user, is_followed_by_user: statsRes.data.is_followed_by_user };
            } catch {
              return { ...user, is_followed_by_user: false };
            }
          })
      );
      setAllUsers(usersWithFollowStatus);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // ------------------- FOLLOW TOGGLE -------------------
  const handleFollowToggle = async (user) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      if (user.is_followed_by_user) {
        await axios.delete(`${API_URL}/api/users/${user.id}/follow/`, {
          headers: { Authorization: `Token ${token}` },
        });
      } else {
        await axios.post(
          `${API_URL}/api/users/${user.id}/follow/`,
          {},
          { headers: { Authorization: `Token ${token}` } }
        );
      }

      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_followed_by_user: !u.is_followed_by_user } : u
        )
      );
    } catch (err) {
      console.error("Follow/unfollow failed", err);
    }
  };

  // ------------------- POSTS API FUNCTIONS -------------------
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !newPostFile) return;

    const token = localStorage.getItem("authToken");
    const formData = new FormData();
    formData.append("content", newPostContent);
    if (newPostFile) formData.append("attachment", newPostFile);

    try {
      const res = await axios.post(`${API_URL}/api/posts/`, formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setPosts([res.data, ...posts]);
      setNewPostContent("");
      setNewPostFile(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (postId) => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await axios.post(
        `${API_URL}/api/posts/${postId}/like/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setPosts(posts.map((p) => (p.id === postId ? res.data : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleInterest = async (postId) => {
    const token = localStorage.getItem("authToken");
    try {
      const res = await axios.post(
        `${API_URL}/api/posts/${postId}/interest/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setPosts(posts.map((p) => (p.id === postId ? res.data : p)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem("authToken");
    try {
      await axios.delete(`${API_URL}/api/posts/${postId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!newComment.trim()) return;

    try {
      const res = await axios.post(
        `${API_URL}/api/posts/${postId}/comments/`,
        { content: newComment },
        { headers: { Authorization: `Token ${token}` } }
      );
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...p.comments, res.data] } : p
        )
      );
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (postId) => {
    setActiveCommentSection(activeCommentSection === postId ? null : postId);
  };

  const handleShare = (postId) => {
    const postUrl = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      setShareTooltip(postId);
      setTimeout(() => setShareTooltip(null), 1200);
    });
  };

  const getAttachmentUrl = (attachment) => {
    if (!attachment) return null;
    return attachment.startsWith("http")
      ? attachment
      : `${API_URL}${attachment.startsWith("/") ? attachment : "/" + attachment}`;
  };

  // ------------------- SUGGESTED CONNECTIONS -------------------
  const suggestedConnections = allUsers.filter((user) => !user.is_followed_by_user);

  // ------------------- DYNAMIC PLACEHOLDER -------------------
  const postPlaceholder =
    currentUser?.profile?.role === "recruiter"
      ? "Share a movie update or hiring announcement..."
      : "Share a project update, experience, or new skill...";

  if (loading) return <div className="tpms-dashboard">Loading dashboard...</div>;

  return (
    <div className="tpms-dashboard">
      <div className="dashboard-container">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div className="profile-card">
            {currentUser?.profile?.profile_picture ? (
              <img
                src={`${API_URL}${currentUser.profile.profile_picture}`}
                alt={currentUser.username}
                className="profile-avatar-img1"
              />
            ) : (
              <div className="profile-avatar1">
                {currentUser?.first_name?.[0]?.toUpperCase()+currentUser?.last_name?.[0]?.toUpperCase() ||
                  currentUser?.username?.[0]?.toUpperCase() ||
                  "😊"}
              </div>
            )}

            <h3>
              {currentUser?.first_name || ""} {currentUser?.last_name || ""}
            </h3>
            <p>{(currentUser?.profile?.role || "Member").replace("_", " ")}</p>
          </div>

          <nav className="sidebar-nav">
            <ul>
              <li className="active">
                <a href="#">
                  <span>🏠</span> Feed
                </a>
              </li>
              <li>
                <a href="network">
                  <span>👥</span> My Network
                </a>
              </li>
              <li>
                <a href="profile">
                  <span>💼</span> Portfolio
                </a>
              </li>
              <li>
                <a href="chat">
                  <span>✉️</span> Messages
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* CREATE POST */}
          <div className="create-post">
            <form onSubmit={handlePostSubmit}>
              <div className="post-input">
                {currentUser?.profile?.profile_picture ? (
                  <img
                    src={`${API_URL}${currentUser.profile.profile_picture}`}
                    alt={currentUser.username}
                    className="user-avatar-img"
                  />
                ) : (
                  <div className="user-avatar">
                    {currentUser?.first_name?.[0]?.toUpperCase()+currentUser?.last_name?.[0]?.toUpperCase() || "😊"}
                  </div>
                )}

                <input
                  type="text"
                  placeholder={postPlaceholder}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
              </div>

              {newPostFile && (
                <div className="file-attached">
                  File Attached 📎 : {newPostFile.name}
                </div>
              )}

              <div className="post-actions">
                <label className="media-btn">
                  <ImageIcon size={16} /> Media
                  <input
                    type="file"
                    hidden
                    onChange={(e) => setNewPostFile(e.target.files[0])}
                  />
                </label>
                <button type="submit" className="post-btn">
                  Post
                </button>
              </div>
            </form>
          </div>

          {/* POSTS FEED */}
          <div className="posts-feed">
            {posts.map((post) => {
              const attachmentUrl = getAttachmentUrl(post.attachment);
              const isMyPost = currentUser && post.author === currentUser.id;

              return (
                <div key={post.id} className="post-card">
                  {/* Post Header */}
                  <div className="post-header">
                    <div className="post-user">
                      {post.author_profile_picture ? (
                        <img
                          src={getAttachmentUrl(post.author_profile_picture)}
                          alt={post.author_username}
                          className="user-avatar-img"
                        />
                      ) : (
                        <div className="user-avatar">
                          {post.author_username?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="user-info">
                        <Link
                          to={`/profiles/${post.author_username}`}
                          className="post-username"
                        >
                          {post.author_username}
                        </Link>
                        <p className="post-time">
                          {new Date(post.created_at).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {isMyPost && (
                      <div className="menu-wrapper">
                        <button
                          className="options-btn"
                          onClick={() =>
                            setMenuOpen(menuOpen === post.id ? null : post.id)
                          }
                        >
                          <MoreHorizontal size={18} />
                        </button>
                        {menuOpen === post.id && (
                          <div className="menu-dropdown">
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="delete-btn"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Post Content */}
              {/* Post Content */}
<div className="post-content">
  <p>{post.content}</p>
  {attachmentUrl && (
    <div className="post-media">
      {/\.(mp4|webm|ogg)$/i.test(attachmentUrl) ? (
        <video controls>
          <source src={attachmentUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (
        <img src={attachmentUrl} alt="Post media" />
      )}
    </div>
  )}
</div>


                  {/* Post Stats */}
                  <div className="post-stats">
                    <span>{post.likes_count} likes</span>
                    <span>{post.comments?.length || 0} comments</span>
                  </div>

                  {/* Post Actions */}
                  <div className="post-actions">
                    <button
                      className={`action-btn ${
                        post.is_liked_by_user ? "liked" : ""
                      }`}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart
                        size={18}
                        fill={post.is_liked_by_user ? "red" : "none"}
                      />{" "}
                      Like
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle size={18} /> Comment
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => handleShare(post.id)}
                    >
                      <Share2 size={18} /> Share
                    </button>
                    {shareTooltip === post.id && (
                      <div className="share-tooltip">Copied ✅</div>
                    )}
                    {post.author_role === "recruiter" &&
                      currentUser?.profile?.role === "job_seeker" && (
                        <button
                          className={`action-btn ${
                            post.is_interested_by_user ? "liked" : ""
                          }`}
                          onClick={() => handleInterest(post.id)}
                        >
                          ⭐ Interest
                        </button>
                      )}
                  </div>

                  {/* Comments Section */}
                  {activeCommentSection === post.id && (
                    <div className="comments-section">
                      {post.comments.map((c) => (
                        <div key={c.id} className="comment">
                          <div className="comment-avatar">
                            {c.author_username?.charAt(0)}
                          </div>
                          <div className="comment-content">
                            <div className="comment-header">
                              <h5>{c.author_username}</h5>
                              <span>
                                {new Date(c.created_at).toLocaleString("en-IN", {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                            <p>{c.content}</p>
                          </div>
                        </div>
                      ))}
                      <form
                        onSubmit={(e) => handleCommentSubmit(e, post.id)}
                        className="comment-form"
                      >
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button type="submit">Post</button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          <div className="sidebar-section">
            <h3>Discover People</h3>
            {suggestedConnections.length > 0 ? (
              suggestedConnections.map((user) => (
                <div key={user.id} className="connection-item">
                  <Link
                    to={`/profiles/${user.username}`}
                    className="connection-avatar-link"
                  >
                    {user.profile?.profile_picture ? (
                      <img
                        src={user.profile.profile_picture}
                        alt={user.username}
                        className="connection-avatar-img"
                      />
                    ) : (
                      <div className="connection-avatar">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <div className="connection-info">
                    <Link
                      to={`/profiles/${user.username}`}
                      className="connection-username"
                    >
                      <h4>{user.username}</h4>
                    </Link>
                    <p>{user.profile?.role || "Member"}</p>
                  </div>

                  <button
                    className={`connect-btn ${
                      user.is_followed_by_user ? "following" : ""
                    }`}
                    onClick={() => handleFollowToggle(user)}
                  >
                    {user.is_followed_by_user ? "Following" : "Follow"}
                  </button>
                </div>
              ))
            ) : (
              <p>No new users to suggest</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
