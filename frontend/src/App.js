import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';
import AdminView from './AdminView';
import SwimmerView from './SwimmerView';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [swimmers, setSwimmers] = useState([]);
  const [meets, setMeets] = useState([]);
  const [events, setEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [entries, setEntries] = useState([]);
  
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

  const fetchSwimmers = () => axios.get('http://localhost:5000/swimmers').then(res => setSwimmers(res.data)).catch(() => {});
  const fetchMeets = () => axios.get('http://localhost:5000/meets').then(res => setMeets(res.data)).catch(() => {});
  const fetchEvents = () => axios.get('http://localhost:5000/events').then(res => setEvents(res.data)).catch(() => {});
  const fetchResults = () => axios.get('http://localhost:5000/results').then(res => setResults(res.data)).catch(() => {});
  const fetchEntries = () => axios.get('http://localhost:5000/entries').then(res => setEntries(res.data)).catch(() => {});

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === 'admin') {
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
