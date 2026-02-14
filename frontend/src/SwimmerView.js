import React, { useState } from 'react';
import './SwimmerView.css';

function SwimmerView({ swimmers, meets, events, results, onLogout, user }) {
  const [selectedMeet, setSelectedMeet] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState('all');

  // Filter results
  const filteredResults = results.filter(r => {
    if (selectedMeet !== 'all' && r.meet_id !== parseInt(selectedMeet)) return false;
    if (selectedEvent !== 'all' && r.event_id !== parseInt(selectedEvent)) return false;
    return true;
  }).sort((a, b) => (a.rank || 999) - (b.rank || 999));

  return (
    <div className="swimmer-view">
      <header className="swimmer-header">
        <div>
          <h1>🏊 Para Swimming Results</h1>
          <p>Welcome, {user.username}</p>
        </div>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      <div className="swimmer-content">
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

        <div className="swimmers-list-section">
          <h2>All Swimmers</h2>
          <div className="swimmers-grid">
            {swimmers.map(s => (
              <div key={s.id} className="swimmer-card">
                <h3>{s.name}</h3>
                <p>Age: {s.age} | Gender: {s.gender}</p>
                {s.classification && <p className="classification-tag">{s.classification}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SwimmerView;
