// src/components/SkillsModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

const SkillsModal = ({ isOpen, onClose, onSkillAdded }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const debounceTimer = setTimeout(() => {
            const token = localStorage.getItem('authToken');
            axios.get(`${API_URL}/skills/?search=${query}`, {
                headers: { 'Authorization': `Token ${token}` }
            })
            .then(response => setResults(response.data))
            .catch(error => console.error("Search failed:", error));
        }, 300); // 300ms debounce delay

        return () => clearTimeout(debounceTimer);
    }, [query, isOpen]);

    const handleAddSkill = async (skillId) => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await axios.post(`${API_URL}/profile/skills/${skillId}/`, {}, {
                headers: { 'Authorization': `Token ${token}` }
            });
            onSkillAdded(response.data); // Notify parent component of the update
        } catch (error) {
            console.error("Failed to add skill", error);
            alert("Failed to add skill.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>Add Skills</h2>
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search for skills..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
                <ul className="skill-search-results">
                    {results.map(skill => (
                        <li key={skill.id} onClick={() => handleAddSkill(skill.id)}>
                            {skill.name}
                        </li>
                    ))}
                </ul>
                <div className="modal-actions">
                    <button onClick={onClose} className="btn btn-secondary">Done</button>
                </div>
            </div>
        </div>
    );
};

export default SkillsModal;