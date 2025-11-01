import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Signup from './components/Signup';
import Feed from './components/Feed';
import Navbar from './components/Navbar';
import Profile from './components/Profile';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

// Axios default configuration
axios.defaults.baseURL = 'http://localhost:5000/api';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/feed" />} 
        />
        <Route 
          path="/signup" 
          element={!user ? <Signup /> : <Navigate to="/feed" />} 
        />
        <Route 
          path="/feed" 
          element={user ? <Feed /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Profile /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/feed" : "/login"} />} 
        />
      </Routes>
    </>
  );
}

export default App;