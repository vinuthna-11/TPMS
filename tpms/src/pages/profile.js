// src/pages/Profile.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import SkillsModal from '../components/skillsmodal';
import '../components/profile.css';

const API_URL = 'http://127.0.0.1:8000';

const Profile = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [userData, setUserData] = useState(location.state?.userData || null);
    const [originalUserData, setOriginalUserData] = useState(null);
    const [loading, setLoading] = useState(!location.state?.userData);
    const [editMode, setEditMode] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Profile Picture
    const fileInputRef = useRef(null);

    // Skills modal
    const [showSkillsModal, setShowSkillsModal] = useState(false);

    // ========================= FETCH USER DATA =========================
    useEffect(() => {
        const fetchUserProfile = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await axios.get(`${API_URL}/api/profile/`, {
                    headers: { 'Authorization': `Token ${token}` }
                });
                setUserData(response.data);
                setOriginalUserData(JSON.parse(JSON.stringify(response.data)));
            } catch (error) {
                console.error('Failed to fetch user profile:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        if (!userData) {
            fetchUserProfile();
        } else {
            setOriginalUserData(JSON.parse(JSON.stringify(userData)));
        }
    }, [navigate]);

    // Cleanup preview URL
    useEffect(() => {
        return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
    }, [previewUrl]);

    // ========================= LOGOUT =========================
    const handleLogout = async () => {
        const token = localStorage.getItem('authToken');
        try {
            await axios.post(`${API_URL}/api/logout/`, {}, {
                headers: { 'Authorization': `Token ${token}` }
            });
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            localStorage.removeItem('authToken');
            navigate('/login');
        }
    };

    // ========================= PROFILE HANDLERS =========================
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (['phone_number', 'address', 'dob', 'skills'].includes(name)) {
            setUserData(prev => ({ ...prev, profile: { ...prev.profile, [name]: value } }));
        } else {
            setUserData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const updatedData = new FormData();
        updatedData.append('first_name', userData.first_name);
        updatedData.append('last_name', userData.last_name);
        updatedData.append('profile.phone_number', userData.profile.phone_number || '');
        updatedData.append('profile.address', userData.profile.address || '');
        updatedData.append('profile.dob', userData.profile.dob || '');
        if (selectedFile) {
            updatedData.append('profile.profile_picture', selectedFile);
        }

        try {
            const response = await axios.patch(`${API_URL}/api/profile/`, updatedData, {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });
            setUserData(response.data);
            setOriginalUserData(JSON.parse(JSON.stringify(response.data)));
            setSelectedFile(null);
            setPreviewUrl(null);
            setEditMode(false);
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Failed to update profile.');
            console.error(error.response?.data);
        }
    };

    const handleCancelEdit = () => {
        setUserData(originalUserData);
        setEditMode(false);
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleRemovePicture = async () => {
        const token = localStorage.getItem('authToken');
        const removeData = new FormData();
        removeData.append('profile.profile_picture', '');

        try {
            const response = await axios.patch(`${API_URL}/api/profile/`, removeData, {
                headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            setUserData(response.data);
            setOriginalUserData(JSON.parse(JSON.stringify(response.data)));
            alert('Profile picture removed.');
        } catch (error) {
            alert('Failed to remove profile picture.');
        }
    };

    const handleDeleteAccount = async () => {
        const token = localStorage.getItem('authToken');
        try {
            await axios.delete(`${API_URL}/api/profile/delete/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            alert('Your account has been successfully deleted.');
            handleLogout();
        } catch (error) {
            alert('Failed to delete account. Please try again.');
            setShowDeleteConfirm(false);
        }
    };

    // ========================= SKILLS HANDLERS =========================
    const handleRemoveSkill = async (skillId) => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await axios.delete(`${API_URL}/api/profile/skills/${skillId}/`, {
                headers: { 'Authorization': `Token ${token}` }
            });
            setUserData(response.data);
            setOriginalUserData(JSON.parse(JSON.stringify(response.data)));
        } catch (error) {
            console.error("Failed to remove skill", error);
            alert("Failed to remove skill.");
        }
    };

    const onSkillAdded = (newUserData) => {
        setUserData(newUserData);
        setOriginalUserData(JSON.parse(JSON.stringify(newUserData)));
    };

    // ========================= UI HELPERS =========================
    const getInitials = (firstName, lastName) => {
        if (!firstName && !lastName) return '';
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    };

    if (loading || !userData) {
        return <div className="profile-page"><div>Loading...</div></div>;
    }

    const profilePictureUrl = userData.profile?.profile_picture ? `${API_URL}${userData.profile.profile_picture}` : null;
    const isJobSeeker = userData.profile?.role === 'job_seeker';

    // ========================= RETURN JSX =========================
    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar-container">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="profile-avatar-imgprofile" />
                        ) : profilePictureUrl ? (
                            <img src={profilePictureUrl} alt="Profile" className="profile-avatar-imgprofile" />
                        ) : (
                            <div className="profile-avatarprofile">{getInitials(userData.first_name, userData.last_name)}</div>
                        )}
                        {editMode && (
                            <button className="change-pic-btn" type="button" onClick={() => fileInputRef.current.click()}>
                                ✏️
                            </button>
                        )}
                    </div>
                    <div className="profile-info1">
                        <h1 className="profile-nameprofile1" style={{ color: '#000' }}>
                            {userData.first_name} {userData.last_name}
                        </h1>
                        <p className="profile-role">{(userData.profile?.role || '').replace('_', ' ')}</p>
                    </div>
                </div>

                {editMode ? (
                    <form className="profile-details" onSubmit={handleUpdateProfile}>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                        <h2>Edit Your Details</h2>
                        {profilePictureUrl && (
                            <div className="form-group-edit">
                                <button type="button" onClick={handleRemovePicture} className="btn btn-secondary">Remove Picture</button>
                            </div>
                        )}
                        <div className="form-group-edit"><label>First Name</label><input type="text" name="first_name" value={userData.first_name} onChange={handleChange} className="form-control" /></div>
                        <div className="form-group-edit"><label>Last Name</label><input type="text" name="last_name" value={userData.last_name} onChange={handleChange} className="form-control" /></div>
                        <div className="form-group-edit"><label>Phone Number</label><input type="tel" name="phone_number" value={userData.profile?.phone_number || ''} onChange={handleChange} className="form-control" /></div>
                        <div className="form-group-edit"><label>Address</label><input type="text" name="address" value={userData.profile?.address || ''} onChange={handleChange} className="form-control" /></div>
                        <div className="form-group-edit"><label>Date of Birth</label><input type="date" name="dob" value={userData.profile?.dob || ''} onChange={handleChange} className="form-control" /></div>
                        
                        {isJobSeeker && (
                            <div className="form-group-edit">
                                <label>Your Skills</label>
                                <ul className="skills-list">
                                    {userData.profile.skills?.map(skill => (
                                        <li key={skill.id} className="skill-tag">
                                            {skill.name}
                                            <button type="button" onClick={() => handleRemoveSkill(skill.id)} className="remove-skill-btn">×</button>
                                        </li>
                                    ))}
                                </ul>
                                <button type="button" onClick={() => setShowSkillsModal(true)} className="btn btn-outline" style={{marginTop: '1rem'}}>
                                    + Add Skill
                                </button>
                            </div>
                        )}

                        <div className="profile-actions">
                            <button type="submit" className="btn btn-primary">Save Changes</button>
                            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">Cancel</button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-details">
                        <h2>Your Details</h2>
                        <div className="detail-item"><strong>Username:</strong><span>{userData.username}</span></div>
                        <div className="detail-item"><strong>Email:</strong><span>{userData.email}</span></div>
                        <div className="detail-item"><strong>Phone Number:</strong><span>{userData.profile?.phone_number || 'Not provided'}</span></div>
                        <div className="detail-item"><strong>Address:</strong><span>{userData.profile?.address || 'Not provided'}</span></div>
                        <div className="detail-item"><strong>Date of Birth:</strong><span>{userData.profile?.dob || 'Not provided'}</span></div>
                        <div className="detail-item"><strong>Gender:</strong><span>{userData.profile?.gender || 'Not provided'}</span></div>

                        {isJobSeeker && (
                            <div className="skills-section">
                                <h3>Skills</h3>
                                {userData.profile.skills?.length > 0 ? (
                                    <ul className="skills-list">
                                        {userData.profile.skills.map(skill => (
                                            <li key={skill.id} className="skill-tag">{skill.name}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No skills added yet.</p>
                                )}
                            </div>
                        )}

                        <div className="profile-actions">
                            <button onClick={() => setEditMode(true)} className="btn btn-primary">Edit Profile</button>
                            <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
                            <button 
                                onClick={() => navigate(`/profiles/${userData.username}`)} 
                                className="btn btn-outline"
                            >
                                View Public Profile
                            </button>
                        </div>
                        <hr style={{ margin: '2rem 0' }} />
                        <div className="danger-zone">
                            <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger">Delete Account</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Account Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Are you sure?</h2>
                        <p>This action is irreversible and will permanently delete your account and all associated data.</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowDeleteConfirm(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleDeleteAccount} className="btn btn-danger">Yes, Delete My Account</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skills Modal */}
            <SkillsModal 
                isOpen={showSkillsModal} 
                onClose={() => setShowSkillsModal(false)}
                onSkillAdded={onSkillAdded}
            />
        </div>
    );
};

export default Profile;
