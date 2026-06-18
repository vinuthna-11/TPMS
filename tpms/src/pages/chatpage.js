// src/pages/ChatPage.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../components/chat.css";

const API_URL = "http://127.0.0.1:8000";
const WEBSOCKET_URL = "ws://127.0.0.1:8000";

const ChatPage = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // --------------------- HELPERS ---------------------
  const getProfilePictureUrl = (user) => {
    if (!user || !user.profile) return null;
    if (user.profile.profile_picture) {
      return user.profile.profile_picture.startsWith("http")
        ? user.profile.profile_picture
        : `${API_URL}${user.profile.profile_picture}`;
    }
    return null;
  };

  const getInitialLetter = (user) => {
    if (!user) return "?";
    return (user.first_name?.[0] || user.username?.[0] || "?").toUpperCase();
  };

  const formatTime = (ts) => {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
  };

  const formatDate = (ts) => {
    const date = new Date(ts);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === now.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  // --------------------- FETCH INITIAL DATA ---------------------
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) { navigate("/login"); return; }

    const fetchInitialData = async () => {
      try {
        const [profileRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/api/profile/`, { headers: { Authorization: `Token ${token}` } }),
          axios.get(`${API_URL}/api/users/`, { headers: { Authorization: `Token ${token}` } })
        ]);

        setCurrentUser(profileRes.data);

        const usersWithProfile = usersRes.data
          .filter(user => user.id !== profileRes.data.id&& user.id !== 1)
          .map(user => ({ ...user, profile: user.profile || {} }));

        setAllUsers(usersWithProfile);
        setFilteredUsers(usersWithProfile);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchInitialData();

    // --------------------- WEBSOCKET ---------------------
    socket.current = new WebSocket(`${WEBSOCKET_URL}/ws/chat/?token=${token}`);
    socket.current.onopen = () => console.log("WebSocket connected");
    socket.current.onclose = () => console.log("WebSocket disconnected");

    return () => { if (socket.current) socket.current.close(); };
  }, [navigate]);

  // --------------------- WEBSOCKET MESSAGE HANDLING ---------------------
  useEffect(() => {
    if (!socket.current) return;
    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.sender === activeChatUser?.id || data.sender === currentUser?.id) {
        setMessages(prev => [...prev, data]);
      }
    };
  }, [activeChatUser, currentUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // --------------------- SEND MESSAGE ---------------------
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatUser) return;

    const timestamp = new Date().toISOString();

    socket.current.send(JSON.stringify({
      message: newMessage,
      receiver_id: activeChatUser.id,
      timestamp
    }));

    const sentMessage = {
      message: newMessage,
      sender: currentUser.id,
      receiver: activeChatUser.id,
      timestamp
    };
    setMessages(prev => [...prev, sentMessage]);
    setNewMessage("");
  };

  // --------------------- SELECT CHAT ---------------------
  const selectChat = async (user) => {
    setActiveChatUser(user);
    const token = localStorage.getItem("authToken");
    try {
      const response = await axios.get(`${API_URL}/api/chat/history/${user.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch message history", error);
      setMessages([]);
    }
  };

  // --------------------- SEARCH FILTER ---------------------
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(allUsers);
    } else {
      const queryLower = searchQuery.toLowerCase();
      setFilteredUsers(
        allUsers.filter(user =>
          (user.first_name + " " + user.last_name).toLowerCase().includes(queryLower) ||
          (user.username?.toLowerCase().includes(queryLower))
        )
      );
    }
  }, [searchQuery, allUsers]);

  // --------------------- GROUP MESSAGES BY DATE ---------------------
  const groupedMessages = [];
  let lastDate = null;
  messages.forEach(msg => {
    const msgDate = formatDate(msg.timestamp);
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: "divider", date: msgDate });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: "message", data: msg });
  });

  // --------------------- JSX ---------------------
  return (
    <div className="chat-container">
      {/* Contacts Panel */}
      <div className="contacts-panel">
        <h3>Contacts</h3>
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="contacts-search-input"
        />
        <div className="contacts-list">
          {filteredUsers.map(user => {
            const profileUrl = getProfilePictureUrl(user);
            return (
              <div
                key={user.id}
                className={`contact-item ${activeChatUser?.id === user.id ? 'active':''}`}
                onClick={() => selectChat(user)}
              >
                {profileUrl ? (
                  <img src={profileUrl} alt={user.username} className="contact-avatar" />
                ) : (
                  <div className="contact-avatar placeholder">{getInitialLetter(user)}</div>
                )}
                <span className="contact-name">{user.first_name} {user.last_name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {activeChatUser ? (
          <>
            <div className="chat-header">
              {getProfilePictureUrl(activeChatUser) ? (
                <img src={getProfilePictureUrl(activeChatUser)} alt="avatar" className="header-avatar" />
              ) : (
                <div className="header-avatar placeholder">{getInitialLetter(activeChatUser)}</div>
              )}
              <span className="header-name">{activeChatUser.first_name} {activeChatUser.last_name}</span>
            </div>

            <div className="messages-area">
              {groupedMessages.map((item, index) => {
                if (item.type === "divider") {
                  return <div key={index} className="date-divider">{item.date}</div>;
                }
                const msg = item.data;
                const isSent = msg.sender === currentUser?.id;
                const userObj = isSent ? currentUser : activeChatUser;
                const profileUrl = getProfilePictureUrl(userObj);
                return (
                  <div key={index} className={`message-row ${isSent?'sent':'received'}`}>
                    {!isSent && (
                      profileUrl ? 
                      <img src={profileUrl} alt="avatar" className="message-avatar"/> :
                      <div className="message-avatar placeholder">{getInitialLetter(userObj)}</div>
                    )}
                    <div className={`message-bubble ${isSent?'sent':'received'}`}>
                      <p>{msg.message}</p>
                      {msg.timestamp && <span className="message-time">{formatTime(msg.timestamp)}</span>}
                    </div>
                    {isSent && (
                      profileUrl ? 
                      <img src={profileUrl} alt="avatar" className="message-avatar"/> :
                      <div className="message-avatar placeholder">{getInitialLetter(userObj)}</div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef}/>
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                placeholder="Type a message..."
                onChange={e=>setNewMessage(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : <div className="no-chat">Select a contact to start chatting</div>}
      </div>
    </div>
  );
};

export default ChatPage;
