// src/pages/PostsPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Heart,
  MessageCircle,
  Share2,
  Star,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import "../components/posts.css";

const API_URL = "http://127.0.0.1:8000";

const PostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCommentSection, setActiveCommentSection] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [shareTooltip, setShareTooltip] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const [profileResponse, postsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/profile/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        axios.get(`${API_URL}/api/posts/`, {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);
      setCurrentUser(profileResponse.data);
      setPosts(postsResponse.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  const handleLike = async (postId) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        `${API_URL}/api/posts/${postId}/like/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setPosts(posts.map((p) => (p.id === postId ? response.data : p)));
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handleInterest = async (postId) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.post(
        `${API_URL}/api/posts/${postId}/interest/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
      setPosts(posts.map((p) => (p.id === postId ? response.data : p)));
    } catch (error) {
      console.error("Failed to show interest:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    const token = localStorage.getItem("authToken");
    try {
      await axios.delete(`${API_URL}/api/posts/${postId}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/posts/${postId}/comments/`,
        { content: newComment },
        { headers: { Authorization: `Token ${token}` } }
      );
      const updatedPosts = posts.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, response.data] } : p
      );
      setPosts(updatedPosts);
      setNewComment("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
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

  if (loading) {
    return (
      <div className="posts-page">
        <div>Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="posts-page">
      <div className="posts-container">
        {posts.map((post) => {
          const authorPictureUrl = getAttachmentUrl(post.author_profile_picture);
          const attachmentUrl = getAttachmentUrl(post.attachment);
          const isMyPost = currentUser && post.author === currentUser.id;

          return (
            <div key={post.id} className="post-card">
              {/* Header */}
              <div className="post-header">
                {authorPictureUrl ? (
                  <img
                    src={authorPictureUrl}
                    alt={post.author_username}
                    className="post-avatar-img"
                  />
                ) : (
                  <div className="post-avatar">
                    {post.author_username?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="post-author-info">
                  <h3>{post.author_username}</h3>
                  <p>
                    {new Date(post.created_at).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>

                {isMyPost && (
                  <div className="menu-wrapper">
                    <button
                      className="menu-btn"
                      onClick={() =>
                        setMenuOpen(menuOpen === post.id ? null : post.id)
                      }
                    >
                      <MoreHorizontal size={20} />
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

              {/* Content */}
              <div className="post-content">
                <p>{post.content}</p>
              </div>

              {attachmentUrl && (
                <div className="post-attachment">
                  <img src={attachmentUrl} alt="Post attachment" />
                </div>
              )}

              {/* Actions */}
              <div className="post-actions">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`action-button ${
                    post.is_liked_by_user ? "liked" : ""
                  }`}
                >
                  <Heart
                    size={20}
                    fill={post.is_liked_by_user ? "red" : "none"}
                  />
                  <span>{post.likes_count || 0}</span>
                </button>

                <button
                  onClick={() => toggleComments(post.id)}
                  className="action-button"
                >
                  <MessageCircle size={20} />
                  <span>{post.comments?.length || 0}</span>
                </button>

                <div className="share-wrapper">
                  <button
                    onClick={() => handleShare(post.id)}
                    className="action-button"
                  >
                    <Share2 size={20} />
                  </button>
                  {shareTooltip === post.id && (
                    <div className="share-tooltip">Copied ✅</div>
                  )}
                </div>

                {post.author_role === "recruiter" &&
                  currentUser?.profile?.role === "job_seeker" && (
                    <button
                      onClick={() => handleInterest(post.id)}
                      className={`action-button ${
                        post.is_interested_by_user ? "interested" : ""
                      }`}
                    >
                      <Star
                        size={20}
                        fill={post.is_interested_by_user ? "green" : "none"}
                      />
                      <span>{post.interested_users_count || 0}</span>
                    </button>
                  )}
              </div>

              {/* Comments */}
              {activeCommentSection === post.id && (
                <div className="comment-section">
                  {post.comments?.map((comment) => {
                    const commentAuthorPic = getAttachmentUrl(
                      comment.author_profile_picture
                    );
                    return (
                      <div key={comment.id} className="comment">
                        {commentAuthorPic ? (
                          <img
                            src={commentAuthorPic}
                            alt={comment.author_username}
                            className="comment-avatar-img"
                          />
                        ) : (
                          <div className="comment-avatar">
                            {comment.author_username?.charAt(0)?.toUpperCase() ||
                              "?"}
                          </div>
                        )}
                        <div className="comment-body">
                          <p className="comment-author">
                            {comment.author_username}
                          </p>
                          <p className="comment-content">{comment.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  <form
                    className="comment-form"
                    onSubmit={(e) => handleCommentSubmit(e, post.id)}
                  >
                    <input
                      type="text"
                      className="comment-input"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button type="submit" className="send-btn">
                      ➤
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PostsPage;
