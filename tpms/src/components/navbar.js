// src/components/navbar/Navbar.js
import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import "./navbar.css";

const API_URL = "http://127.0.0.1:8000";

const Navbar = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("authToken");

  const [query, setQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [allSkills, setAllSkills] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef(null);

  // Build proper image URL
  const getAttachmentUrl = (attachment) => {
    if (!attachment) return null;
    return attachment.startsWith("http")
      ? attachment
      : `${API_URL}${attachment.startsWith("/") ? attachment : "/" + attachment}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  // Fetch all skills
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    axios
      .get(`${API_URL}/api/skills/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((res) => setAllSkills(res.data))
      .catch((err) => console.error("Failed to fetch skills:", err));
  }, []);

  // Search with debounce
  useEffect(() => {
    if (!query.trim() && !selectedSkill) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const token = localStorage.getItem("authToken");
        let searchUrl = `${API_URL}/api/search/users/?`;
        if (query.trim()) searchUrl += `q=${query}&`;
        if (selectedSkill) searchUrl += `skills=${selectedSkill}`;

        const res = await axios.get(searchUrl, {
          headers: { Authorization: `Token ${token}` },
        });

        const currentUserId = parseInt(localStorage.getItem("userId"), 10);
        const filtered = res.data.filter(
          (user) => user.id !== currentUserId && user.id !== 1
        );
        setResults(filtered);
      } catch (err) {
        console.error("Search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, selectedSkill]);

  // Focus on open
  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  // Close on ESC
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e) => e.key === "Escape" && closeSearch();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    setSelectedSkill("");
  };

  return (
    <>
      {searchOpen && <div className="page-overlay" onClick={closeSearch} />}

      <nav className="navbar">
        <NavLink to="/" className="navbar-logo">
          TP<span>MS</span>
        </NavLink>

        <div className="navbar-content">
          {!searchOpen ? (
            <div className="navbar-links">
              {isLoggedIn ? (
                <>
                  <NavLink to="/dash" className="navbar-link">Home</NavLink>
                  <NavLink to="/profile" className="navbar-link">Profile</NavLink>
                  <NavLink to="/int" className="navbar-link">Interest</NavLink>
                  <NavLink to="/chat" className="navbar-link">Message</NavLink>
                  <span onClick={handleLogout} className="navbar-link">Logout</span>

                  <button
                    className="search-icon-btn"
                    onClick={() => setSearchOpen(true)}
                  >
                    🔍
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/" className="navbar-link">Home</NavLink>
                  <NavLink to="/about" className="navbar-link">About</NavLink>
                  <NavLink to="/login" className="navbar-link">Login</NavLink>
                  <NavLink to="/register" className="navbar-link">Register</NavLink>
                </>
              )}
            </div>
          ) : (
            <div className="navbar-search-box">
              <input
                ref={inputRef}
                type="text"
                className="navbar-search-input"
                placeholder="Search users by name or username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />

              <select
                className="search-filter-select"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
              >
                <option value="">All</option>
                {allSkills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>

              <button className="close-search-btn" onClick={closeSearch}>
                ✖
              </button>

              {query || selectedSkill ? (
                <div className="navbar-search-dropdown">
                  {loading && <div className="search-item">Searching...</div>}
                  {!loading && results.length === 0 && (
                    <div className="search-item">No users found.</div>
                  )}
                  {!loading && results.length > 0 && (
                    <ul className="search-list">
                      {results.map((user) => {
                        const pic = getAttachmentUrl(user.profile_picture_url);
                        return (
                          <li key={user.id}>
                            <NavLink
                              to={`/profiles/${user.username}`}
                              className="search-item"
                              onClick={closeSearch}
                            >
                              {pic ? (
                                <img
                                  src={pic}
                                  alt={user.username}
                                  className="search-avatar"
                                />
                              ) : (
                                <div className="search-avatar">
                                  {user.username?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                              )}
                              <div className="search-info">
                                <span>
                                  {user.first_name} {user.last_name}
                                </span>
                                <p>@{user.username}</p>
                              </div>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
