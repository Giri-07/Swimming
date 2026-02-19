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
        <div className="nav-inner">
          <ul className="nav-menu">
            <li><a href="#home">🏠 Home</a></li>
            <li><a href="#swimming">🏊 Swimming</a></li>
            <li><a href="#para-swimming">♿ Para Swimming</a></li>
            <li><a href="#events">📅 Events</a></li>
            <li><a href="#rankings">🏆 Rankings</a></li>
            <li><a href="#athletes">👤 Athletes</a></li>
            <li><a href="#results">📊 Results</a></li>
          </ul>
          <button className="login-signup-btn" onClick={onNavigateToLogin}>
            🔐 Login / Sign Up
          </button>
        </div>
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
        <div className="footer-inner">
          <div className="footer-col">
            <div className="footer-logo">
              <span className="footer-logo-icon">🏊</span>
              <span className="footer-logo-name">Aquatics</span>
            </div>
            <p className="footer-tagline">DIVE INTO EXCELLENCE</p>
            <p className="footer-desc">Your comprehensive platform for swimming event management, athlete tracking, and performance rankings.</p>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#swimming">🏊 Swimming</a></li>
              <li><a href="#para-swimming">♿ Para Swimming</a></li>
              <li><a href="#events">📅 Upcoming Events</a></li>
              <li><a href="#rankings">🏆 Rankings</a></li>
              <li><a href="#results">📊 Results</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Disciplines</h4>
            <ul className="footer-links">
              <li><a href="#freestyle">🌊 Freestyle</a></li>
              <li><a href="#backstroke">🔄 Backstroke</a></li>
              <li><a href="#breaststroke">🐸 Breaststroke</a></li>
              <li><a href="#butterfly">🦋 Butterfly</a></li>
              <li><a href="#medley">🔀 Individual Medley</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-links">
              <li>📧 info@swimming.com</li>
              <li>📞 +91 00000 00000</li>
              <li>📍 India</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Aquatics Swimming Management System. All rights reserved.</p>
          <p className="footer-sub">Built with 💙 for the love of swimming</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
