import React from 'react';
import './Home.css';

function Home({ onNavigateToLogin }) {
  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo-section">
          <div className="logo-circle">
            <div className="logo-placeholder">🏊</div>
          </div>
          <div className="logo-text">
            <h1 className="main-title">Aquatics</h1>
            <p className="tagline">DIVE INTO EXCELLENCE</p>
          </div>
        </div>
        <p className="company-name">Swimming Management System</p>
      </header>

      <nav className="navigation">
        <ul className="nav-menu">
          <li><a href="#about">About Us</a></li>
          <li className="dropdown">
            <a href="#disciplines">DISCIPLINES ▼</a>
          </li>
          <li className="dropdown">
            <a href="#latest">LATEST ▼</a>
          </li>
          <li><a href="#results">RESULTS</a></li>
          <li><a href="#science">SPORTS SCIENCE</a></li>
          <li><a href="#video">VIDEO ANALYSIS</a></li>
          <li><a href="#events">EVENTS</a></li>
          <li>
            <button className="login-signup-btn" onClick={onNavigateToLogin}>
              LOGIN / SIGN UP
            </button>
          </li>
        </ul>
      </nav>

      <main className="home-content">
        <section className="welcome-section">
          <div className="welcome-banner">
            <h2>Welcome to Aquatics</h2>
            <p>Your comprehensive swimming management system</p>
          </div>
        </section>

        <section className="events-section">
          <h2 className="section-title">Category: Event</h2>
          
          <div className="events-grid">
            <div className="event-card">
              <div className="event-image">
                <img src="https://via.placeholder.com/400x250/0066cc/ffffff?text=Swimming+Event" alt="Event" />
              </div>
              <div className="event-details">
                <h3>15th Edition of Treamis Interschool Aquatic Championship</h3>
                <p className="event-date">October 8, 2025</p>
                <p className="event-meta">Event, News, Results, Swimming</p>
                <button className="read-more-btn">READ MORE</button>
              </div>
            </div>

            <div className="event-card">
              <div className="event-image">
                <img src="https://via.placeholder.com/400x250/764ba2/ffffff?text=Championship" alt="Event" />
              </div>
              <div className="event-details">
                <h3>Asian Open Schools Invitational (AOSI) Long Course (50m) Swimming Championships Bangkok 2026</h3>
                <p className="event-date">September 26, 2025</p>
                <p className="event-meta">Event, News, Results, Swimming</p>
                <button className="read-more-btn">READ MORE</button>
              </div>
            </div>

            <div className="event-card">
              <div className="event-image">
                <img src="https://via.placeholder.com/400x250/667eea/ffffff?text=Training" alt="Event" />
              </div>
              <div className="event-details">
                <h3>Maximizing Performance with Altitude Training</h3>
                <p className="event-date">August 13, 2025</p>
                <p className="event-meta">Event, News, Swimming</p>
                <button className="read-more-btn">READ MORE</button>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Event Management</h3>
              <p>Create and manage swimming competitions with ease</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Results & Rankings</h3>
              <p>Track performance and view real-time rankings</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Swimmer Database</h3>
              <p>Comprehensive swimmer profiles and records</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Easy Registration</h3>
              <p>Simple event registration for swimmers</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>&copy; 2026 Swimming Management System</p>
        <p>DIVE INTO EXCELLENCE</p>
      </footer>
    </div>
  );
}

export default Home;
