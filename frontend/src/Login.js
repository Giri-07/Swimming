import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [loginType, setLoginType] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const user = await response.json();
        if (user.role === loginType) {
          onLogin(user);
        } else {
          setError(`This account is not registered as ${loginType}`);
        }
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Connection error. Please check if the backend is running.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🏊 Para Swimming</h1>
        <p className="subtitle">Data Management System</p>
        
        <div className="login-type-selector">
          <button 
            className={loginType === 'admin' ? 'type-btn active' : 'type-btn'}
            onClick={() => setLoginType('admin')}
          >
            Admin Login
          </button>
          <button 
            className={loginType === 'swimmer' ? 'type-btn active' : 'type-btn'}
            onClick={() => setLoginType('swimmer')}
          >
            Swimmer Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-btn">
            Login as {loginType === 'admin' ? 'Admin' : 'Swimmer'}
          </button>
        </form>

        <div className="login-info">
          <p><strong>Default Admin:</strong> username: admin, password: admin123</p>
          <p><small>Contact admin to create swimmer accounts</small></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
