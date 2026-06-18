import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../components/search.css';

const API_URL = 'http://127.0.0.1:8000';

const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // Skill filter states
    const [allSkills, setAllSkills] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState('');

    const navigate = useNavigate();

    // Ensure user is authenticated and fetch skills
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) { navigate('/login'); return; }

        axios.get(`${API_URL}/api/skills/`, {
            headers: { 'Authorization': `Token ${token}` }
        })
        .then(res => setAllSkills(res.data))
        .catch(err => console.error("Failed to fetch skills:", err));
    }, [navigate]);

    // Build proper URL for images
    const getAttachmentUrl = (attachment) => {
        if (!attachment) return null;
        return attachment.startsWith('http')
            ? attachment
            : `${API_URL}${attachment.startsWith('/') ? attachment : '/' + attachment}`;
    };

    // Debounced search
    useEffect(() => {
        if (!query.trim() && !selectedSkill) {
            setResults([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setSearched(true);

        const debounceTimer = setTimeout(() => {
            const token = localStorage.getItem('authToken');
            let searchUrl = `${API_URL}/api/search/users/?`;

            if (query.trim()) searchUrl += `q=${query}&`;
            if (selectedSkill) searchUrl += `skills=${selectedSkill}`;

            axios.get(searchUrl, {
                headers: { 'Authorization': `Token ${token}` }
            })
            .then(res => setResults(res.data))
            .catch(err => {
                console.error("Search failed:", err);
                setResults([]);
            })
            .finally(() => setLoading(false));
        }, 400);

        return () => clearTimeout(debounceTimer);
    }, [query, selectedSkill]);

    return (
        <div className="search-page">
            <h1>Search for Users</h1>

            <div className="search-bar">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by username, first name, or last name..."
                    autoComplete="off"
                />

                <div className="filter-container">
                    <select
                        value={selectedSkill}
                        onChange={(e) => setSelectedSkill(e.target.value)}
                    >
                        <option value="">Filter by Skill...</option>
                        {allSkills.map(skill => (
                            <option key={skill.id} value={skill.id}>{skill.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="search-results-container">
                {loading && <p>Searching...</p>}

                {!loading && searched && results.length === 0 && (
                    <p>No users found matching your criteria.</p>
                )}

                {!loading && results.length > 0 && (
                    <ul className="user-list">
                        {results.map(user => {
                            const profilePicUrl = getAttachmentUrl(user.profile_picture_url);
                            return (
                                <li key={user.id} className="user-list-item">
                                    {profilePicUrl ? (
                                        <img
                                            src={profilePicUrl}
                                            alt={user.username}
                                            className="user-list-avatar"
                                        />
                                    ) : (
                                        <div className="user-list-avatar">
                                            {user.username?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <div className="user-list-info">
                                        <Link to={`/profiles/${user.username}`}>
                                            {user.first_name} {user.last_name}
                                        </Link>
                                        <p>@{user.username}</p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SearchPage;
