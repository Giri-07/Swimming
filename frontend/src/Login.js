import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin, onBackToHome }) {
  // view: 'login' | 'signup' | 'forgot' | 'reset' | 'verify'
  const [view, setView] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forgot / Reset password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sending, setSending] = useState(false);

  // Email verification states
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyOtp, setVerifyOtp] = useState('');

  // Error modal
  const [errorModal, setErrorModal] = useState({ show: false, message: '', redirectEmail: null });
  const showErrorModal = (msg, redirectEmail = null) => setErrorModal({ show: true, message: msg, redirectEmail });
  const closeErrorModal = () => {
    const redirectTo = errorModal.redirectEmail;
    setErrorModal({ show: false, message: '', redirectEmail: null });
    if (redirectTo) {
      setUsername(redirectTo);
      goTo('login');
    }
  };

  // Signup fields
  const [signupData, setSignupData] = useState({
    first_name: '', last_name: '', date_of_birth: '', email: '',
    gender: '', father_name: '', father_mobile: '',
    mother_name: '', mother_mobile: '', ksa_id: '', sfi_id: '', password: ''
  });

  const clearMessages = () => { setError(''); setSuccess(''); };
  const goTo = (v) => { clearMessages(); setView(v); };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        const user = { id: data.id, username: data.username, role: data.role, swimmer_id: data.swimmer_id };
        localStorage.setItem('user', JSON.stringify(user));
        onLogin(user);
      } else {
        setError('Invalid username or password');
      }
    } catch {
      setError('Connection error. Please check if the backend is running.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setSending(true);
    try {
      await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      setSuccess('OTP sent! Check your email (or backend console in dev mode).');
      goTo('reset');
    } catch {
      setError('Connection error. Please check if the backend is running.');
    } finally {
      setSending(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSending(true);
    try {
      const response = await fetch('http://localhost:5000/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: resetOtp, new_password: newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => { setUsername(forgotEmail); goTo('login'); }, 2000);
      } else {
        setError(data.error || 'Reset failed. Please try again.');
      }
    } catch {
      setError('Connection error. Please check if the backend is running.');
    } finally {
      setSending(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });
      if (response.ok) {
        const result = await response.json();
        setSuccess(`Account created! Athlete ID: ${result.athlete_id}. ${result.message}`);
        setVerifyEmail(signupData.email);
        setTimeout(() => { goTo('verify'); }, 2500);
      } else {
        const errorData = await response.json();
        const errMsg = errorData.error || 'Signup failed. Please try again.';
        showErrorModal(errMsg, errorData.redirect_email || null);
      }
    } catch {
      setError('Connection error. Please check if the backend is running.');
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setSending(true);
    try {
      const response = await fetch('http://localhost:5000/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, otp: verifyOtp })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess('Email verified successfully! Redirecting to login...');
        setTimeout(() => { setUsername(verifyEmail); goTo('login'); }, 2000);
      } else {
        setError(data.error || 'Verification failed. Please try again.');
      }
    } catch {
      setError('Connection error. Please check if the backend is running.');
    } finally {
      setSending(false);
    }
  };

  const handleResendVerification = async () => {
    clearMessages();
    setSending(true);
    try {
      const response = await fetch('http://localhost:5000/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Verification OTP sent! Check your email.');
      } else {
        setError(data.error || 'Failed to resend OTP.');
      }
    } catch {
      setError('Connection error. Please check if the backend is running.');
    } finally {
      setSending(false);
    }
  };

  const handleSignupChange = (e) => setSignupData({ ...signupData, [e.target.name]: e.target.value });

  // --- Subtitle & hint per view ---
  const titles = {
    login:  { sub: 'Welcome Back',            hint: 'Sign in to continue to your dashboard' },
    signup: { sub: 'Create Swimmer Account',  hint: null },
    forgot: { sub: 'Forgot Password',         hint: 'Enter your registered email to receive an OTP' },
    reset:  { sub: 'Reset Password',          hint: `OTP sent to ${forgotEmail}` },
    verify: { sub: 'Verify Email',            hint: `OTP sent to ${verifyEmail}` },
  };
  const { sub, hint } = titles[view];

  return (
    <div className="login-container">
      {/* ── ERROR MODAL ── */}
      {errorModal.show && (
        <div className="error-modal-overlay" onClick={closeErrorModal}>
          <div className="error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="error-modal-icon">⚠️</div>
            <h3 className="error-modal-title">Registration Error</h3>
            <p className="error-modal-message">{errorModal.message}</p>
            <button className="error-modal-close-btn" onClick={closeErrorModal}>
              {errorModal.redirectEmail ? 'Go to Login →' : 'OK'}
            </button>
          </div>
        </div>
      )}
      {/* Left branding panel */}
      <div className="login-branding">
        <button onClick={onBackToHome} className="back-to-home-btn">← Back to Home</button>
        <div className="branding-content">
          <div className="brand-logo">🏊</div>
          <h1 className="brand-title">Aquatics</h1>
          <p className="brand-tagline">DIVE INTO EXCELLENCE</p>
          <div className="brand-features">
            <div className="brand-feature"><span>🏆</span> Event Management</div>
            <div className="brand-feature"><span>📊</span> Live Rankings</div>
            <div className="brand-feature"><span>👤</span> Athlete Profiles</div>
            <div className="brand-feature"><span>📝</span> Easy Registration</div>
          </div>
        </div>
        <div className="wave-bottom"/>
      </div>

      {/* Right form panel */}
      <div className={`login-box ${view === 'signup' ? 'signup-mode' : ''}`}>
        <p className="subtitle">{sub}</p>
        {hint && <p className="login-subtitle-hint">{hint}</p>}

        {/* ── LOGIN ── */}
        {view === 'login' && (
          <>
            <form onSubmit={handleLoginSubmit} className="login-form">
              <div className="input-group">
                <span className="input-icon">👤</span>
                <input type="text" placeholder="Username / Email"
                  value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input type="password" placeholder="Password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="forgot-link-row">
                <button type="button" className="forgot-link" onClick={() => goTo('forgot')}>
                  Forgot password?
                </button>
              </div>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <button type="submit" className="login-btn">Login</button>
            </form>
            <div className="toggle-mode">
              <p>New swimmer?
                <button type="button" onClick={() => goTo('signup')} className="link-btn">
                  Create Account
                </button>
              </p>
            </div>
          </>
        )}

        {/* ── FORGOT PASSWORD ── */}
        {view === 'forgot' && (
          <>
            <form onSubmit={handleForgotSubmit} className="login-form">
              <div className="input-group">
                <span className="input-icon">📧</span>
                <input type="email" placeholder="Registered email address"
                  value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
              </div>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <button type="submit" className="login-btn" disabled={sending}>
                {sending ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </form>
            <div className="toggle-mode">
              <p>Remembered it?
                <button type="button" onClick={() => goTo('login')} className="link-btn">Back to Login</button>
              </p>
            </div>
          </>
        )}

        {/* ── RESET PASSWORD ── */}
        {view === 'reset' && (
          <>
            <form onSubmit={handleResetSubmit} className="login-form">
              <input className="otp-input" type="text" placeholder="Enter 6-digit OTP"
                value={resetOtp} onChange={(e) => setResetOtp(e.target.value)}
                maxLength={6} required />
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input type="password" placeholder="New Password (min 6 chars)"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6} required />
              </div>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input type="password" placeholder="Confirm New Password"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6} required />
              </div>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <button type="submit" className="login-btn" disabled={sending}>
                {sending ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
            <div className="toggle-mode">
              <p>Didn't get the OTP?
                <button type="button" onClick={() => goTo('forgot')} className="link-btn">Resend</button>
              </p>
            </div>
          </>
        )}

        {/* ── EMAIL VERIFICATION ── */}
        {view === 'verify' && (
          <>
            <form onSubmit={handleVerifySubmit} className="login-form">
              <input className="otp-input" type="text" placeholder="Enter 6-digit OTP"
                value={verifyOtp} onChange={(e) => setVerifyOtp(e.target.value)}
                maxLength={6} required />
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <button type="submit" className="login-btn" disabled={sending}>
                {sending ? 'Verifying…' : 'Verify Email'}
              </button>
            </form>
            <div className="toggle-mode">
              <p>Didn't get the OTP?
                <button type="button" onClick={handleResendVerification} className="link-btn" disabled={sending}>
                  Resend
                </button>
              </p>
            </div>
          </>
        )}

        {/* ── SIGNUP ── */}
        {view === 'signup' && (
          <>
            <h2 className="signup-title">Swimmer Registration</h2>
            <form onSubmit={handleSignupSubmit} className="signup-form">
              <div className="form-row">
                <input type="text" name="first_name" placeholder="First Name *"
                  value={signupData.first_name} onChange={handleSignupChange} required />
                <input type="text" name="last_name" placeholder="Last Name *"
                  value={signupData.last_name} onChange={handleSignupChange} required />
              </div>
              <input type="date" name="date_of_birth"
                value={signupData.date_of_birth} onChange={handleSignupChange} required />
              <input type="email" name="email" placeholder="Email *"
                value={signupData.email} onChange={handleSignupChange} required />
              <div className="form-section-title">Gender *</div>
              <div className="gender-selection">
                <label className="radio-label">
                  <input type="radio" name="gender" value="Male"
                    checked={signupData.gender === 'Male'} onChange={handleSignupChange} required />
                  <span>Male</span>
                </label>
                <label className="radio-label">
                  <input type="radio" name="gender" value="Female"
                    checked={signupData.gender === 'Female'} onChange={handleSignupChange} />
                  <span>Female</span>
                </label>
              </div>
              <input type="password" name="password" placeholder="Password *"
                value={signupData.password} onChange={handleSignupChange} required minLength="6" />
              <div className="form-section-title">Father's Details (Optional)</div>
              <input type="text" name="father_name" placeholder="Father's Name"
                value={signupData.father_name} onChange={handleSignupChange} />
              <input type="tel" name="father_mobile" placeholder="Father's Mobile"
                value={signupData.father_mobile} onChange={handleSignupChange} />
              <div className="form-section-title">Mother's Details (Optional)</div>
              <input type="text" name="mother_name" placeholder="Mother's Name"
                value={signupData.mother_name} onChange={handleSignupChange} />
              <input type="tel" name="mother_mobile" placeholder="Mother's Mobile"
                value={signupData.mother_mobile} onChange={handleSignupChange} />
              <div className="form-section-title">Registration IDs (Optional)</div>
              <input type="text" name="ksa_id" placeholder="KSA ID"
                value={signupData.ksa_id} onChange={handleSignupChange} />
              <input type="text" name="sfi_id" placeholder="SFI ID"
                value={signupData.sfi_id} onChange={handleSignupChange} />
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <button type="submit" className="login-btn">Create Account</button>
            </form>
            <div className="toggle-mode">
              <p>Already have an account?
                <button type="button" onClick={() => goTo('login')} className="link-btn">Login</button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;

