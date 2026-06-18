// src/pages/SinglePostPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../components/posts.css';

const API_URL = 'http://127.0.0.1:8000';

const SinglePostPage = () => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const { postId } = useParams();
    const navigate = useNavigate();

    // ✅ Helper: build correct media URL
    const getAttachmentUrl = (attachment) => {
        if (!attachment) return null;
        return attachment.startsWith('http')
            ? attachment
            : `${API_URL}${attachment.startsWith('/') ? attachment : '/' + attachment}`;
    };

    // ✅ Fetch post + user
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const [profileResponse, postResponse] = await Promise.all([
                    axios.get(`${API_URL}/api/profile/`, {
                        headers: { Authorization: `Token ${token}` }
                    }),
                    axios.get(`${API_URL}/api/posts/${postId}/`, {
                        headers: { Authorization: `Token ${token}` }
                    })
                ]);
                setCurrentUser(profileResponse.data);
                setPost(postResponse.data);
            } catch (error) {
                console.error('Failed to fetch post:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [postId, navigate]);

    // ✅ Handle Like
    const handleLike = async () => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await axios.post(
                `${API_URL}/api/posts/${postId}/like/`,
                {},
                { headers: { Authorization: `Token ${token}` } }
            );
            setPost(response.data); // API returns updated post
        } catch (error) {
            console.error('Failed to like post:', error);
        }
    };

    // ✅ Handle Share
    const handleShare = () => {
        const postUrl = `${window.location.origin}/posts/${postId}`;
        navigator.clipboard.writeText(postUrl)
            .then(() => alert('Link copied to clipboard!'))
            .catch((err) => console.error('Failed to copy link:', err));
    };

    // ✅ Handle Comment Submit
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        if (!newComment.trim()) return;

        try {
            const response = await axios.post(
                `${API_URL}/api/posts/${postId}/comments/`,
                { content: newComment },
                { headers: { Authorization: `Token ${token}` } }
            );
            setPost({ ...post, comments: [...post.comments, response.data] });
            setNewComment('');
        } catch (error) {
            console.error('Failed to submit comment:', error);
        }
    };

    if (loading) {
        return <div className="posts-page"><div>Loading post...</div></div>;
    }

    if (!post) {
        return <div className="posts-page"><div>Post not found.</div></div>;
    }

    const authorPictureUrl = getAttachmentUrl(post.author_profile_picture);
    const attachmentUrl = getAttachmentUrl(post.attachment);
    const isMyPost = currentUser && post.author === currentUser.id;

    return (
        <div className="posts-page">
            <div className="posts-container">
                <div className="post-card">
                    {/* --- Header --- */}
                    <div className="post-header">
                        {authorPictureUrl ? (
                            <img src={authorPictureUrl} alt={post.author_username} className="post-avatar-img" />
                        ) : (
                            <div className="post-avatar">{post.author_username.charAt(0).toUpperCase()}</div>
                        )}
                        <div className="post-author-info">
                            <h3>{post.author_username}</h3>
                            <p>{new Date(post.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                    </div>

                    {/* --- Content --- */}
                    <div className="post-content">
                        <p>{post.content}</p>
                    </div>

                    {/* --- Attachment --- */}
                    {attachmentUrl && (
                        <div className="post-attachment">
                            {['.jpg', '.jpeg', '.png', '.gif'].some((ext) =>
                                attachmentUrl.toLowerCase().endsWith(ext)
                            ) ? (
                                <img src={attachmentUrl} alt="Post attachment" />
                            ) : (
                                <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                                    View Attachment
                                </a>
                            )}
                        </div>
                    )}

                    {/* --- Actions --- */}
                    <div className="post-actions">
                        {!isMyPost ? (
                            <button
                                onClick={handleLike}
                                className={`action-button ${post.is_liked_by_user ? 'liked' : ''}`}
                            >
                                Like ({post.likes_count})
                            </button>
                        ) : (
                            <span className="like-count">Likes: {post.likes_count}</span>
                        )}
                        <button onClick={handleShare} className="action-button">Share</button>
                    </div>

                    {/* --- Comments --- */}
                    <div className="comment-section">
                        {post.comments && post.comments.length > 0 ? (
                            post.comments.map((comment) => {
                                const commentAuthorPic = getAttachmentUrl(comment.author_profile_picture);
                                return (
                                    <div key={comment.id} className="comment">
                                        {commentAuthorPic ? (
                                            <img
                                                src={commentAuthorPic}
                                                alt={comment.author_username}
                                                className="comment-avatar-img"
                                            />
                                        ) : (
                                            <div className="comment-avatar">{comment.author_username.charAt(0).toUpperCase()}</div>
                                        )}
                                        <div className="comment-body">
                                            <p className="comment-author">{comment.author_username}</p>
                                            <p className="comment-content">{comment.content}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="no-comments">No comments yet.</p>
                        )}

                        <form className="comment-form" onSubmit={handleCommentSubmit}>
                            <input
                                type="text"
                                className="comment-input"
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button type="submit" className="btn btn-primary">Post</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SinglePostPage;
