import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/feed" className="navbar-brand">
          LinkedIn Clone
        </Link>
        
        <div className="navbar-menu">
          <Link to="/feed" className="navbar-item">Feed</Link>
          <Link to="/profile" className="navbar-item">Profile</Link>
          
          <div className="navbar-user">
            <span>Hello, {user?.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;