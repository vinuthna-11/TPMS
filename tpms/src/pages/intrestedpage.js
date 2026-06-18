import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../components/intrested.css'; // Make sure this path is correct

const API_URL = 'http://127.0.0.1:8000';

const InterestedPage = () => {
    const [posts, setPosts] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalData, setModalData] = useState({ isOpen: false, users: [] });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) { navigate('/login'); return; }

        const fetchData = async () => {
            try {
                const profileRes = await axios.get(`${API_URL}/api/profile/`, { headers: { Authorization: `Token ${token}` } });
                setCurrentUser(profileRes.data);

                const endpoint = profileRes.data.profile.role === 'recruiter' ? '/api/recruiter-posts/' : '/api/interested-posts/';
                const postsRes = await axios.get(`${API_URL}${endpoint}`, { headers: { Authorization: `Token ${token}` } });
                setPosts(postsRes.data);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    // --- THIS IS THE FIX ---
    // We add a fallback to an empty array to prevent crashes
    const openInterestedModal = (users = []) => {
        setModalData({ isOpen: true, users: users });
    };

    const closeModal = () => setModalData({ isOpen: false, users: [] });

    if (loading) {
        return <div className="interested-page"><div>Loading...</div></div>;
    }

    const isRecruiter = currentUser?.profile?.role === 'recruiter';

    return (
        <div className="interested-page">
            <div className="interested-container">
                <h1>{isRecruiter ? "Interested Candidates" : "Posts You're Interested In"}</h1>

                {posts.length === 0 && <p>No activity to show yet.</p>}

                {posts.map(post => (
                    <div key={post.id} className="post-interest-card">
                        <h3>{post.content.substring(0, 80)}{post.content.length > 80 ? '...' : ''}</h3>
                        {isRecruiter ? (
                            <>
                                <p>{post.interested_users_count} candidate(s) are interested.</p>
                                <button className="btn btn-primary" onClick={() => openInterestedModal(post.interested_users)}>
                                    See Interested People
                                </button>
                            </>
                        ) : (
                            <p>Posted by: <Link to={`/profiles/${post.author_username}`}>{post.author_username}</Link></p>
                        )}
                    </div>
                ))}
            </div>

            {modalData.isOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>Interested Candidates</h2>
                        <ul className="user-list">
                            {/* We also add optional chaining here for extra safety */}
                            {modalData.users?.length > 0 ? modalData.users.map(user => (
                                <li key={user.id} className="user-list-item">
                                    <img src={user.profile_picture_url ? `${API_URL}${user.profile_picture_url}` : 'https://via.placeholder.com/40'} alt={user.username} className="user-list-avatar" />
                                    <div className="user-list-info">
                                        <Link to={`/profiles/${user.username}`} onClick={closeModal}>{user.first_name} {user.last_name}</Link>
                                        <p>@{user.username}</p>
                                    </div>
                                </li>
                            )) : <p>No one has shown interest in this post yet.</p>}
                        </ul>
                        <div className="modal-actions">
                            <button onClick={closeModal} className="btn btn-secondary">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterestedPage;