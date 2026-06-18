// src/pages/Network.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "../components/network.css";
import "../components/dashboard.css";

const API_URL = "http://127.0.0.1:8000";

const Network = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("followers");
  const [loading, setLoading] = useState(true);

  // Modal state
  const [unfollowModalOpen, setUnfollowModalOpen] = useState(false);
  const [userToUnfollow, setUserToUnfollow] = useState(null);

  const navigate = useNavigate();

  // ------------------- FETCH DATA -------------------
  const fetchNetwork = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return navigate("/login");

    try {
      // Logged-in user
      const meRes = await axios.get(`${API_URL}/api/profile/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setCurrentUser(meRes.data);

      // Followers
      const followersRes = await axios.get(
        `${API_URL}/api/users/${meRes.data.id}/followers/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setFollowers(followersRes.data);

      // Following
      const followingRes = await axios.get(
        `${API_URL}/api/users/${meRes.data.id}/following/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setFollowing(followingRes.data);

      // Suggested users with follow status
      const usersRes = await axios.get(`${API_URL}/api/users/`, {
        headers: { Authorization: `Token ${token}` },
      });

      const usersWithFollowStatus = await Promise.all(
        usersRes.data
          .filter((u) => u.id !== meRes.data.id && u.id !== 1)
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
      console.error("Failed to fetch network data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, [navigate]);

  // ------------------- FOLLOW/UNFOLLOW -------------------
  const handleFollowToggle = async (user) => {
    const token = localStorage.getItem("authToken");
    if (!token) return navigate("/login");

    try {
      if (user.is_followed_by_user) {
        await axios.delete(`${API_URL}/api/users/${user.id}/follow/`, {
          headers: { Authorization: `Token ${token}` },
        });
      } else {
        await axios.post(`${API_URL}/api/users/${user.id}/follow/`, {}, {
          headers: { Authorization: `Token ${token}` },
        });
      }

      // Update state
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_followed_by_user: !u.is_followed_by_user } : u
        )
      );

      // Refresh followers/following lists
      const followersRes = await axios.get(
        `${API_URL}/api/users/${currentUser.id}/followers/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setFollowers(followersRes.data);

      const followingRes = await axios.get(
        `${API_URL}/api/users/${currentUser.id}/following/`,
        { headers: { Authorization: `Token ${token}` } }
      );
      setFollowing(followingRes.data);

    } catch (err) {
      console.error("Follow/unfollow failed", err);
    }
  };

  // ------------------- UNFOLLOW MODAL -------------------
  const openUnfollowModal = (user) => {
    setUserToUnfollow(user);
    setUnfollowModalOpen(true);
  };

  const closeUnfollowModal = () => {
    setUserToUnfollow(null);
    setUnfollowModalOpen(false);
  };

  const confirmUnfollow = async () => {
    if (!userToUnfollow) return;
    const token = localStorage.getItem("authToken");
    if (!token) return navigate("/login");

    try {
      await axios.delete(`${API_URL}/api/users/${userToUnfollow.id}/follow/`, {
        headers: { Authorization: `Token ${token}` },
      });

      // Update following & allUsers states
      setFollowing((prev) => prev.filter((u) => u.id !== userToUnfollow.id));
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === userToUnfollow.id ? { ...u, is_followed_by_user: false } : u
        )
      );
    } catch (err) {
      console.error("Unfollow failed", err);
    } finally {
      closeUnfollowModal();
    }
  };

  // ------------------- RENDER USERS -------------------
  const renderUsers = (users) => {
    if (!users.length) return <p>No users found.</p>;

    return (
      <ul className="user-list">
        {users.map((user) => (
          <li key={user.id} className="user-list-item">
            <Link to={`/profiles/${user.username}`} className="user-list-avatar-link">
              {user.profile_picture_url ? (
                <img
                  src={`${API_URL}${user.profile_picture_url}`}
                  alt={user.username}
                  className="user-list-avatar"
                />
              ) : (
                <div className="user-list-avatar-placeholder">
                  {user.first_name?.[0] || user.username[0]}
                </div>
              )}
            </Link>
            <div className="user-list-info">
              <Link to={`/profiles/${user.username}`} className="user-list-name">
                {user.first_name} {user.last_name}
              </Link>
              <p className="user-list-username">@{user.username}</p>
            </div>

            {/* Show unfollow button if activeTab is "following" */}
            {activeTab === "following" && (
              <button
                className="unfollow"
                onClick={() => openUnfollowModal(user)}
              >
                Unfollow
              </button>
            )}
          </li>
        ))}
      </ul>
    );
  };

  const suggestedConnections = allUsers.filter((u) => !u.is_followed_by_user);

  if (loading) return <div className="network-page">Loading network...</div>;

  return (
    <div className="network-page">
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
              <li>
                <a href="dash">
                  <span>🏠</span> Feed
                </a>
              </li>
              <li className="active">
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
                <a href="#">
                  <span>✉️</span> Messages
                </a>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Center Content */}
        <main className="network-main">
          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === "followers" ? "active" : ""}`}
              onClick={() => setActiveTab("followers")}
            >
              Followers ({followers.length})
            </button>
            <button
              className={`tab-btn ${activeTab === "following" ? "active" : ""}`}
              onClick={() => setActiveTab("following")}
            >
              Following ({following.length})
            </button>
          </div>

          {/* List */}
          <div className="tab-content">
            {activeTab === "followers" ? renderUsers(followers) : renderUsers(following)}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          <div className="sidebar-section">
            <h3>Discover People</h3>
            {suggestedConnections.length > 0 ? (
              suggestedConnections.map((user) => (
                <div key={user.id} className="connection-item">
                  <Link to={`/profiles/${user.username}`} className="connection-avatar-link">
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
                    <Link to={`/profiles/${user.username}`} className="connection-username">
                      <h4>{user.username}</h4>
                    </Link>
                    <p>{user.profile?.role || "Member"}</p>
                  </div>

                  <button
                    className={`connect-btn ${user.is_followed_by_user ? "following" : ""}`}
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

      {/* ----------------- UNFOLLOW CONFIRMATION MODAL ----------------- */}
      {unfollowModalOpen && (
        <div className="modal-overlay" onClick={closeUnfollowModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Unfollow</h2>
            <p>Are you sure you want to unfollow <strong>{userToUnfollow.username}</strong>?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={closeUnfollowModal}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={confirmUnfollow}>
                Unfollow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Network;
