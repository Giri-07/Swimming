import React, { useState, useEffect } from 'react';
import axiosInstance from './axiosConfig';
import Home from './Home';
import Login from './Login';
import AdminView from './AdminView';
import SwimmerView from './SwimmerView';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [swimmers, setSwimmers] = useState([]);
  const [meets, setMeets] = useState([]);
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [entries, setEntries] = useState([]);
  
  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);
  
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = () => {
    fetchSwimmers();
    fetchMeets();
    fetchEvents();
    fetchResults();
    fetchEntries();
  };

  const fetchSwimmers = () => axiosInstance.get('/swimmers').then(res => setSwimmers(res.data)).catch(() => {});
  const fetchMeets = () => axiosInstance.get('/meets').then(res => setMeets(res.data)).catch(() => {});
  const fetchEvents = () => axiosInstance.get('/events').then(res => setEvents(res.data)).catch(() => {});
  const fetchResults = () => axiosInstance.get('/results').then(res => setResults(res.data)).catch(() => {});
  const fetchEntries = () => axiosInstance.get('/entries').then(res => setEntries(res.data)).catch(() => {});

  const handleLogin = (userData) => {
    setUser(userData);
    setShowLogin(false);
  };

  const handleLogout = () => {
    // Clear tokens and user data from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setShowLogin(false);
  };

  const handleNavigateToLogin = () => {
    setShowLogin(true);
  };

  const handleBackToHome = () => {
    setShowLogin(false);
  };

  // Show Home page by default
  if (!user && !showLogin) {
    return <Home onNavigateToLogin={handleNavigateToLogin} />;
  }

  // Show Login page
  if (!user && showLogin) {
    return <Login onLogin={handleLogin} onBackToHome={handleBackToHome} />;
  }

  // Show Admin or Swimmer dashboard after login
  if (user && user.role === 'admin') {
    return (
      <AdminView 
        swimmers={swimmers}
        meets={meets}
        events={events}
        results={results}
        entries={entries}
        onRefresh={fetchAllData}
        onLogout={handleLogout}
        user={user}
      />
    );
  }

  return (
    <SwimmerView 
      swimmers={swimmers}
      meets={meets}
      events={events}
      results={results}
      entries={entries}
      onRefresh={fetchAllData}
      onLogout={handleLogout}
      user={user}
    />
  );
}

export default App;
