import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  const [loginType, setLoginType] = useState('admin');
  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Signup fields
  const [signupData, setSignupData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    email: '',
    gender: '',
    father_name: '',
    father_mobile: '',
    mother_name: '',
    mother_mobile: '',
    ksa_id: '',
    sfi_id: '',
    password: ''
  });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

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

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Account created successfully! Your Athlete ID: ${result.athlete_id}. Please login with your email.`);
        setTimeout(() => {
          setIsSignup(false);
          setUsername(signupData.email);
          setLoginType('swimmer');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please check if the backend is running.');
    }
  };

  const handleSignupChange = (e) => {
    setSignupData({
      ...signupData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-container">
      <div className={`login-box ${isSignup ? 'signup-mode' : ''}`}>
        <h1>🏊 Para Swimming</h1>
        <p className="subtitle">Data Management System</p>
        
        {!isSignup && (
          <>
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

            <form onSubmit={handleLoginSubmit} className="login-form">
              <input
                type="text"
                placeholder="Username / Email"
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
              {success && <div className="success-message">{success}</div>}
              <button type="submit" className="login-btn">
                Login as {loginType === 'admin' ? 'Admin' : 'Swimmer'}
              </button>
            </form>

            {loginType === 'swimmer' && (
              <div className="toggle-mode">
                <p>Don't have an account? 
                  <button type="button" onClick={() => setIsSignup(true)} className="link-btn">
                    Sign Up
                  </button>
                </p>
              </div>
            )}

            <div className="login-info">
              <p><strong>Default Admin:</strong> username: admin, password: admin123</p>
            </div>
          </>
        )}

        {isSignup && (
          <>
            <h2 className="signup-title">Swimmer Registration</h2>
            <form onSubmit={handleSignupSubmit} className="signup-form">
              <div className="form-row">
                <input
                  type="text"
                  name="first_name"
                  placeholder="First Name *"
                  value={signupData.first_name}
                  onChange={handleSignupChange}
                  required
                />
                <input
                  type="text"
                  name="last_name"
                  placeholder="Last Name *"
                  value={signupData.last_name}
                  onChange={handleSignupChange}
                  required
                />
              </div>
              
              <input
                type="date"
                name="date_of_birth"
                placeholder="Date of Birth *"
                value={signupData.date_of_birth}
                onChange={handleSignupChange}
                required
              />
              
              <input
                type="email"
                name="email"
                placeholder="Email *"
                value={signupData.email}
                onChange={handleSignupChange}
                required
              />
              
              <div className="form-section-title">Gender *</div>
              <div className="gender-selection">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="Male"
                    checked={signupData.gender === 'Male'}
                    onChange={handleSignupChange}
                    required
                  />
                  <span>Male</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="gender"
                    value="Female"
                    checked={signupData.gender === 'Female'}
                    onChange={handleSignupChange}
                    required
                  />
                  <span>Female</span>
                </label>
              </div>
              
              <input
                type="password"
                name="password"
                placeholder="Password *"
                value={signupData.password}
                onChange={handleSignupChange}
                required
                minLength="6"
              />
              
              <div className="form-section-title">Father's Details</div>
              <input
                type="text"
                name="father_name"
                placeholder="Father's Name *"
                value={signupData.father_name}
                onChange={handleSignupChange}
                required
              />
              <input
                type="tel"
                name="father_mobile"
                placeholder="Father's Mobile Number *"
                value={signupData.father_mobile}
                onChange={handleSignupChange}
                required
              />
              
              <div className="form-section-title">Mother's Details</div>
              <input
                type="text"
                name="mother_name"
                placeholder="Mother's Name *"
                value={signupData.mother_name}
                onChange={handleSignupChange}
                required
              />
              <input
                type="tel"
                name="mother_mobile"
                placeholder="Mother's Mobile Number *"
                value={signupData.mother_mobile}
                onChange={handleSignupChange}
                required
              />
              
              <div className="form-section-title">Registration IDs</div>
              <input
                type="text"
                name="ksa_id"
                placeholder="KSA ID *"
                value={signupData.ksa_id}
                onChange={handleSignupChange}
                required
              />
              <input
                type="text"
                name="sfi_id"
                placeholder="SFI ID *"
                value={signupData.sfi_id}
                onChange={handleSignupChange}
                required
              />
              
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <button type="submit" className="login-btn">
                Create Account
              </button>
            </form>

            <div className="toggle-mode">
              <p>Already have an account? 
                <button type="button" onClick={() => setIsSignup(false)} className="link-btn">
                  Login
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
