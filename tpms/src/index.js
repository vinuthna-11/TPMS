import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavbarComponent from './components/navbar';
import Home from './pages/home';
import About from './pages/about';
import Dash from './pages/dashboard';
import PostsPage from './pages/postpage';
import Login from './pages/login';
import Register from './pages/register';
import Forgotpass from './pages/forgot-password';
import Profile from './pages/profile';
import Footer from './components/footer';
import SinglePostPage from './pages/singlepostpage';

// Import your route protection components
import PrivateRoute from './components/privateroute';
import PublicRoute from './components/publicroute';
import UserProfilePage from './pages/userprofilepage';
import ChatPage from './pages/chatpage';

import InterestedPage from './pages/intrestedpage';

import SearchPage from './pages/searchpage';
import NetworkPage from './pages/network';

const App = () => (
  <>
    <NavbarComponent />
    <main>
      <Routes>
        {/* --- Routes anyone can see --- */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />

        {/* --- Routes only for LOGGED-OUT users --- */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><Forgotpass /></PublicRoute>} />


        {/* --- Routes only for LOGGED-IN users --- */}
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/profiles/:username" element={<PrivateRoute><UserProfilePage /></PrivateRoute>} />
        <Route path="/posts" element={<PrivateRoute><PostsPage /></PrivateRoute>} /> {/* 2. Add the new route */}
        <Route path="/posts/:postId" element={<PrivateRoute><SinglePostPage /></PrivateRoute>} />
        <Route path="/dash" element={<PrivateRoute><Dash /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/int" element={<PrivateRoute><InterestedPage /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
        <Route path="/network" element={<PrivateRoute><NetworkPage /></PrivateRoute>} />


        {/* Fallback route to redirect unknown paths to home */}
        <Route path="*" element={<Navigate to="/" replace />} />


      </Routes>
      <Footer />
    </main>
  </>
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);