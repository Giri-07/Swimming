import React, { useState } from 'react';
import axios from 'axios';
import './AdminView.css';

function AdminView({ swimmers, meets, events, results, entries, onRefresh, onLogout, user }) {
  const [activeTab, setActiveTab] = useState('swimmers');
  const [swimmerForm, setSwimmerForm] = useState({ athlete_id: '', name: '', age: '', gender: '', classification: '', country: '', club: '' });
  const [meetForm, setMeetForm] = useState({ name: '', date: '', location: '' });
  const [eventForm, setEventForm] = useState({ name: '', distance: '', stroke: '' });
  const [resultForm, setResultForm] = useState({ swimmer_id: '', event_id: '', meet_id: '', timing: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [rankings, setRankings] = useState({});
  const [selectedEventForRanking, setSelectedEventForRanking] = useState('');

  const handleSwimmerSubmit = e => {
    e.preventDefault();
    axios.post('http://localhost:5000/swimmers', swimmerForm).then(() => {
      onRefresh();
      setSwimmerForm({ athlete_id: '', name: '', age: '', gender: '', classification: '', country: '', club: '' });
    });
  };

  const handleMeetSubmit = e => {
    e.preventDefault();
    axios.post('http://localhost:5000/meets', meetForm).then(() => {
      onRefresh();
      setMeetForm({ name: '', date: '', location: '' });
    });
  };

  const handleEventSubmit = e => {
    e.preventDefault();
    axios.post('http://localhost:5000/events', eventForm).then(() => {
      onRefresh();
      setEventForm({ name: '', distance: '', stroke: '' });
    });
  };

  const handleResultSubmit = e => {
    e.preventDefault();
    axios.post('http://localhost:5000/results', resultForm).then(() => {
      onRefresh();
      setResultForm({ swimmer_id: '', event_id: '', meet_id: '', timing: '' });
    });
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadMessage('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await axios.post('http://localhost:5000/upload-results', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadMessage(response.data.message);
      setUploadFile(null);
      onRefresh();
    } catch (error) {
      setUploadMessage('Upload failed: ' + (error.response?.data?.error || 'Unknown error'));
    }
  };

  const fetchRankings = async (eventId) => {
    try {
      const response = await axios.get(`http://localhost:5000/rankings/${eventId}`);
      setRankings(response.data);
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    }
  };

  const handleEventRankingChange = (eventId) => {
    setSelectedEventForRanking(eventId);
    if (eventId) {
      fetchRankings(eventId);
    }
  };

  const handleEntryStatusChange = async (entryId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/entries/${entryId}`, { status: newStatus });
      onRefresh();
    } catch (error) {
      console.error('Failed to update entry:', error);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`http://localhost:5000/entries/${entryId}`);
        onRefresh();
      } catch (error) {
        console.error('Failed to delete entry:', error);
      }
    }
  };

  return (
    <div className="admin-view">
      <header className="admin-header">
        <div>
          <h1>🏊 Admin Dashboard</h1>
          <p>Welcome, {user.username}</p>
        </div>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      <div className="tabs">
        <button className={activeTab === 'swimmers' ? 'tab active' : 'tab'} onClick={() => setActiveTab('swimmers')}>Swimmers</button>
        <button className={activeTab === 'meets' ? 'tab active' : 'tab'} onClick={() => setActiveTab('meets')}>Meets</button>
        <button className={activeTab === 'events' ? 'tab active' : 'tab'} onClick={() => setActiveTab('events')}>Events</button>
        <button className={activeTab === 'entries' ? 'tab active' : 'tab'} onClick={() => setActiveTab('entries')}>Entries</button>
        <button className={activeTab === 'results' ? 'tab active' : 'tab'} onClick={() => setActiveTab('results')}>Results</button>
        <button className={activeTab === 'rankings' ? 'tab active' : 'tab'} onClick={() => setActiveTab('rankings')}>Rankings</button>
        <button className={activeTab === 'upload' ? 'tab active' : 'tab'} onClick={() => setActiveTab('upload')}>Upload CSV</button>
      </div>

      <div className="admin-content">
        {activeTab === 'swimmers' && (
          <div className="section">
            <h2>Add Swimmer</h2>
            <form onSubmit={handleSwimmerSubmit} className="form">
              <input name="athlete_id" value={swimmerForm.athlete_id} onChange={e => setSwimmerForm({...swimmerForm, athlete_id: e.target.value})} placeholder="Athlete ID (auto-generated if empty)" />
              <input name="name" value={swimmerForm.name} onChange={e => setSwimmerForm({...swimmerForm, name: e.target.value})} placeholder="Name" required />
              <input name="age" value={swimmerForm.age} onChange={e => setSwimmerForm({...swimmerForm, age: e.target.value})} placeholder="Age" type="number" required />
              <select name="gender" value={swimmerForm.gender} onChange={e => setSwimmerForm({...swimmerForm, gender: e.target.value})} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <input name="classification" value={swimmerForm.classification} onChange={e => setSwimmerForm({...swimmerForm, classification: e.target.value})} placeholder="Classification (e.g., S10)" />
              <input name="country" value={swimmerForm.country} onChange={e => setSwimmerForm({...swimmerForm, country: e.target.value})} placeholder="Country" />
              <input name="club" value={swimmerForm.club} onChange={e => setSwimmerForm({...swimmerForm, club: e.target.value})} placeholder="Club/Team" />
              <button type="submit">Add Swimmer</button>
            </form>
            <h2>Swimmers List</h2>
            <table className="table">
              <thead>
                <tr><th>Athlete ID</th><th>Name</th><th>Age</th><th>Gender</th><th>Classification</th><th>Country</th><th>Club</th></tr>
              </thead>
              <tbody>
                {swimmers.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.athlete_id}</strong></td><td>{s.name}</td><td>{s.age}</td><td>{s.gender}</td><td>{s.classification || 'N/A'}</td><td>{s.country || 'N/A'}</td><td>{s.club || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'meets' && (
          <div className="section">
            <h2>Add Meet</h2>
            <form onSubmit={handleMeetSubmit} className="form">
              <input name="name" value={meetForm.name} onChange={e => setMeetForm({...meetForm, name: e.target.value})} placeholder="Meet Name" required />
              <input name="date" value={meetForm.date} onChange={e => setMeetForm({...meetForm, date: e.target.value})} type="date" required />
              <input name="location" value={meetForm.location} onChange={e => setMeetForm({...meetForm, location: e.target.value})} placeholder="Location" />
              <button type="submit">Add Meet</button>
            </form>
            <h2>Meets List</h2>
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Date</th><th>Location</th></tr>
              </thead>
              <tbody>
                {meets.map(m => (
                  <tr key={m.id}>
                    <td>{m.id}</td><td>{m.name}</td><td>{m.date}</td><td>{m.location || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="section">
            <h2>Add Event</h2>
            <form onSubmit={handleEventSubmit} className="form">
              <input name="name" value={eventForm.name} onChange={e => setEventForm({...eventForm, name: e.target.value})} placeholder="Event Name" required />
              <input name="distance" value={eventForm.distance} onChange={e => setEventForm({...eventForm, distance: e.target.value})} placeholder="Distance (m)" type="number" required />
              <select name="stroke" value={eventForm.stroke} onChange={e => setEventForm({...eventForm, stroke: e.target.value})} required>
                <option value="">Select Stroke</option>
                <option value="Freestyle">Freestyle</option>
                <option value="Backstroke">Backstroke</option>
                <option value="Breaststroke">Breaststroke</option>
                <option value="Butterfly">Butterfly</option>
                <option value="IM">Individual Medley</option>
              </select>
              <button type="submit">Add Event</button>
            </form>
            <h2>Events List</h2>
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Name</th><th>Distance (m)</th><th>Stroke</th></tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id}>
                    <td>{e.id}</td><td>{e.name}</td><td>{e.distance}</td><td>{e.stroke}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="section">
            <h2>Add Result</h2>
            <form onSubmit={handleResultSubmit} className="form">
              <select name="swimmer_id" value={resultForm.swimmer_id} onChange={e => setResultForm({...resultForm, swimmer_id: e.target.value})} required>
                <option value="">Select Swimmer</option>
                {swimmers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select name="event_id" value={resultForm.event_id} onChange={e => setResultForm({...resultForm, event_id: e.target.value})} required>
                <option value="">Select Event</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <select name="meet_id" value={resultForm.meet_id} onChange={e => setResultForm({...resultForm, meet_id: e.target.value})} required>
                <option value="">Select Meet</option>
                {meets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input name="timing" value={resultForm.timing} onChange={e => setResultForm({...resultForm, timing: e.target.value})} placeholder="Timing (seconds)" type="number" step="0.01" required />
              <button type="submit">Add Result</button>
            </form>
            <h2>Results List</h2>
            <table className="table">
              <thead>
                <tr><th>Rank</th><th>Swimmer</th><th>Event</th><th>Meet</th><th>Timing (s)</th></tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.rank || 'N/A'}</strong></td>
                    <td>{swimmers.find(s => s.id === r.swimmer_id)?.name || r.swimmer_id}</td>
                    <td>{events.find(e => e.id === r.event_id)?.name || r.event_id}</td>
                    <td>{meets.find(m => m.id === r.meet_id)?.name || r.meet_id}</td>
                    <td>{r.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'entries' && (
          <div className="section">
            <h2>Event Entries Management</h2>
            <p className="info-text">Manage swimmer registrations for events</p>
            
            {entries.length === 0 ? (
              <div className="no-data">No entries yet</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Athlete ID</th>
                    <th>Swimmer</th>
                    <th>Event</th>
                    <th>Meet</th>
                    <th>Entry Time</th>
                    <th>Status</th>
                    <th>Entry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id} className={`entry-row ${entry.status}`}>
                      <td><strong>{entry.athlete_id}</strong></td>
                      <td>{entry.swimmer_name}</td>
                      <td>{entry.event_name}</td>
                      <td>{entry.meet_name}</td>
                      <td>{entry.entry_time ? `${entry.entry_time}s` : 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${entry.status}`}>
                          {entry.status}
                        </span>
                      </td>
                      <td>{entry.entry_date}</td>
                      <td>
                        <div className="action-buttons">
                          {entry.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleEntryStatusChange(entry.id, 'approved')}
                                className="btn-approve"
                              >
                                ✓ Approve
                              </button>
                              <button 
                                onClick={() => handleEntryStatusChange(entry.id, 'rejected')}
                                className="btn-reject"
                              >
                                ✗ Reject
                              </button>
                            </>
                          )}
                          {entry.status === 'approved' && (
                            <button 
                              onClick={() => handleEntryStatusChange(entry.id, 'pending')}
                              className="btn-pending"
                            >
                              ↺ Pending
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="btn-delete"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            <div className="entry-stats">
              <div className="stat-card">
                <h3>{entries.filter(e => e.status === 'pending').length}</h3>
                <p>Pending</p>
              </div>
              <div className="stat-card">
                <h3>{entries.filter(e => e.status === 'approved').length}</h3>
                <p>Approved</p>
              </div>
              <div className="stat-card">
                <h3>{entries.filter(e => e.status === 'rejected').length}</h3>
                <p>Rejected</p>
              </div>
              <div className="stat-card">
                <h3>{entries.length}</h3>
                <p>Total</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="section">
            <h2>Upload MeetManager Results (CSV)</h2>
            <div className="upload-info">
              <p>CSV file should contain columns: <strong>swimmer_name, event_name, meet_name, timing</strong></p>
              <p>Swimmers, events, and meets must already exist in the database.</p>
            </div>
            <form onSubmit={handleFileUpload} className="upload-form">
              <input 
                type="file" 
                accept=".csv" 
                onChange={e => setUploadFile(e.target.files[0])}
                className="file-input"
              />
              <button type="submit" className="upload-btn">Upload CSV</button>
            </form>
            {uploadMessage && <div className="upload-message">{uploadMessage}</div>}
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="section">
            <h2>Event Rankings by Classification</h2>
            <div className="ranking-selector">
              <label>Select Event:</label>
              <select value={selectedEventForRanking} onChange={e => handleEventRankingChange(e.target.value)}>
                <option value="">Choose an event</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.name} - {e.distance}m {e.stroke}</option>)}
              </select>
            </div>
            
            {Object.keys(rankings).length > 0 && (
              <div className="rankings-container">
                {Object.entries(rankings).map(([classification, classRankings]) => (
                  <div key={classification} className="classification-rankings">
                    <h3>Classification: {classification}</h3>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Athlete ID</th>
                          <th>Name</th>
                          <th>Best Time</th>
                          <th>Country</th>
                          <th>Club</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classRankings.map(r => (
                          <tr key={r.athlete_id} className={r.rank === 1 ? 'gold-row' : r.rank === 2 ? 'silver-row' : r.rank === 3 ? 'bronze-row' : ''}>
                            <td><strong>{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</strong></td>
                            <td>{r.athlete_id}</td>
                            <td>{r.name}</td>
                            <td><strong>{r.best_time}s</strong></td>
                            <td>{r.country || 'N/A'}</td>
                            <td>{r.club || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminView;
