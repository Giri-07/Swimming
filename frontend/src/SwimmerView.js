import React, { useState } from 'react';
import axios from 'axios';
import './SwimmerView.css';

function SwimmerView({ swimmers, meets, events, results, entries, onRefresh, onLogout, user }) {
  const [selectedMeet, setSelectedMeet] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [activeTab, setActiveTab] = useState('results');
  const [entryForm, setEntryForm] = useState({ meet_id: '', event_id: '', entry_time: '' });
  const [entryMessage, setEntryMessage] = useState('');

  // Get swimmer's entries
  const myEntries = entries.filter(e => e.swimmer_id === user.swimmer_id);

  // Filter results
  const filteredResults = results.filter(r => {
    if (selectedMeet !== 'all' && r.meet_id !== parseInt(selectedMeet)) return false;
    if (selectedEvent !== 'all' && r.event_id !== parseInt(selectedEvent)) return false;
    return true;
  }).sort((a, b) => (a.rank || 999) - (b.rank || 999));

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setEntryMessage('');
    
    try {
      await axios.post('http://localhost:5000/entries', {
        swimmer_id: user.swimmer_id,
        meet_id: parseInt(entryForm.meet_id),
        event_id: parseInt(entryForm.event_id),
        entry_time: entryForm.entry_time ? parseFloat(entryForm.entry_time) : null
      });
      setEntryMessage('✅ Registration successful! Waiting for admin approval.');
      setEntryForm({ meet_id: '', event_id: '', entry_time: '' });
      onRefresh();
    } catch (error) {
      setEntryMessage('❌ ' + (error.response?.data?.error || 'Registration failed'));
    }
  };

  const handleWithdrawEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to withdraw from this event?')) {
      try {
        await axios.delete(`http://localhost:5000/entries/${entryId}`);
        setEntryMessage('✅ Entry withdrawn successfully');
        onRefresh();
      } catch (error) {
        setEntryMessage('❌ Failed to withdraw entry');
      }
    }
  };

  return (
    <div className="swimmer-view">
      <header className="swimmer-header">
        <div>
          <h1>🏊 Para Swimming</h1>
          <p>Welcome, {user.username}</p>
        </div>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      <div className="tabs">
        <button className={activeTab === 'results' ? 'tab active' : 'tab'} onClick={() => setActiveTab('results')}>Results</button>
        <button className={activeTab === 'register' ? 'tab active' : 'tab'} onClick={() => setActiveTab('register')}>Register for Events</button>
        <button className={activeTab === 'myEntries' ? 'tab active' : 'tab'} onClick={() => setActiveTab('myEntries')}>My Entries</button>
      </div>

      <div className="swimmer-content">
        {activeTab === 'register' && (
          <div className="register-section">
            <h2>Register for Event</h2>
            <form onSubmit={handleEntrySubmit} className="entry-form">
              <div className="form-group">
                <label>Select Meet:</label>
                <select 
                  value={entryForm.meet_id} 
                  onChange={e => setEntryForm({...entryForm, meet_id: e.target.value})}
                  required
                >
                  <option value="">Choose a meet...</option>
                  {meets.map(m => (
                    <option key={m.id} value={m.id}>{m.name} - {m.date}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Select Event:</label>
                <select 
                  value={entryForm.event_id} 
                  onChange={e => setEntryForm({...entryForm, event_id: e.target.value})}
                  required
                >
                  <option value="">Choose an event...</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.distance}m {e.stroke})</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Entry/Seed Time (optional):</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={entryForm.entry_time}
                  onChange={e => setEntryForm({...entryForm, entry_time: e.target.value})}
                  placeholder="Your best time in seconds"
                />
                <small>Enter your previous best time for this event (if available)</small>
              </div>
              
              <button type="submit" className="submit-btn">Submit Registration</button>
            </form>
            
            {entryMessage && (
              <div className={`entry-message ${entryMessage.includes('✅') ? 'success' : 'error'}`}>
                {entryMessage}
              </div>
            )}
          </div>
        )}

        {activeTab === 'myEntries' && (
          <div className="my-entries-section">
            <h2>My Event Entries</h2>
            {myEntries.length === 0 ? (
              <div className="no-entries">You haven't registered for any events yet.</div>
            ) : (
              <div className="entries-grid">
                {myEntries.map(entry => (
                  <div key={entry.id} className={`entry-card status-${entry.status}`}>
                    <div className="entry-header">
                      <h3>{entry.event_name}</h3>
                      <span className={`badge status-${entry.status}`}>{entry.status}</span>
                    </div>
                    <div className="entry-details">
                      <p><strong>Meet:</strong> {entry.meet_name}</p>
                      <p><strong>Entry Date:</strong> {entry.entry_date}</p>
                      {entry.entry_time && <p><strong>Entry Time:</strong> {entry.entry_time}s</p>}
                      {entry.heat && <p><strong>Heat:</strong> {entry.heat}, Lane: {entry.lane}</p>}
                    </div>
                    {entry.status === 'pending' || entry.status === 'approved' ? (
                      <button 
                        onClick={() => handleWithdrawEntry(entry.id)}
                        className="withdraw-btn"
                      >
                        Withdraw
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <>
            <div className="filters">
              <h2>Filter Results</h2>
              <div className="filter-group">
                <label>Meet:</label>
                <select value={selectedMeet} onChange={e => setSelectedMeet(e.target.value)}>
                  <option value="all">All Meets</option>
                  {meets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Event:</label>
                <select value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
                  <option value="all">All Events</option>
                  {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
            </div>

            <div className="results-section">
              <h2>Race Results</h2>
              {filteredResults.length === 0 ? (
                <div className="no-results">No results available</div>
              ) : (
                <div className="results-grid">
                  {filteredResults.map(r => {
                    const swimmer = swimmers.find(s => s.id === r.swimmer_id);
                    const event = events.find(e => e.id === r.event_id);
                    const meet = meets.find(m => m.id === r.meet_id);
                    
                    return (
                      <div key={r.id} className={`result-card ${r.rank === 1 ? 'gold' : r.rank === 2 ? 'silver' : r.rank === 3 ? 'bronze' : ''}`}>
                        <div className="rank-badge">
                          {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `#${r.rank || 'N/A'}`}
                        </div>
                        <div className="result-info">
                          <h3>{swimmer?.name || 'Unknown'}</h3>
                          <p className="event-name">{event?.name || 'Unknown Event'}</p>
                          <p className="meet-name">{meet?.name || 'Unknown Meet'}</p>
                          <p className="timing">{r.timing}s</p>
                          {swimmer?.classification && (
                            <span className="classification">{swimmer.classification}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SwimmerView;
