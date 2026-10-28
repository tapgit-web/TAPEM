import React, { useState } from 'react';
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  BadgeCheck, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import FirebaseGuideModal from '../components/FirebaseGuideModal';
import '../styles/auth.css';

export default function Login() {
  const { 
    login, 
    register, 
    loginWithGoogle, 
    resetPassword, 
    loginAsDemo, 
    configured 
  } = useAuth();

  // 'signin' | 'signup' | 'forgot'
  const [authMode, setAuthMode] = useState('signin');
  
  // Form input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Clear errors when switching modes
  const switchMode = (mode) => {
    setAuthMode(mode);
    setError('');
    setSuccessMsg('');
  };

  // Sign In handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up handler
  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!displayName || !displayName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!employeeId || !employeeId.trim()) {
      setError('Please enter your Employee ID (e.g. EMP001, EMP-104).');
      return;
    }

    if (employeeId.trim().length < 2 || !/^[A-Za-z0-9_-]+$/.test(employeeId.trim())) {
      setError('Employee ID should contain letters, numbers, or hyphens (e.g. EMP001).');
      return;
    }

    if (!email || !password) {
      setError('Please provide email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, displayName, employeeId);
      setSuccessMsg('Account registered successfully! Redirecting...');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMsg('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message || 'Google sign-in was not completed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please enter your email address to receive password reset instructions.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg(`Password reset link sent to ${email}. Check your inbox!`);
    } catch (err) {
      setError(err.message || 'Could not send reset link.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login
  const handleDemoLogin = (role) => {
    setError('');
    loginAsDemo(role);
  };

  return (
    <div className="auth-page-wrapper">
      {/* Background ambient lighting */}
      <div className="auth-grid-overlay" />
      <div className="auth-glow-orb-1" />
      <div className="auth-glow-orb-2" />

      <div className="auth-container">
        <div className="auth-card">
          {/* Brand & Title */}
          <div className="auth-brand">
            <div className="auth-brand-icon-box">
              <Building2 size={30} />
            </div>
            <div className="auth-company-tag">Apex Industrial Technologies</div>
            <h1 className="auth-app-title">WorkLog Enterprise</h1>
            <p className="auth-app-subtitle">
              Industrial Employee Work Details Management System
            </p>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert auth-alert-success" role="status">
              <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Segmented Mode Switcher (Sign In vs Register) */}
          {authMode !== 'forgot' && (
            <div className="auth-tabs-pill">
              <button
                type="button"
                className={`auth-tab-btn ${authMode === 'signin' ? 'active' : ''}`}
                onClick={() => switchMode('signin')}
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authMode === 'signup' ? 'active' : ''}`}
                onClick={() => switchMode('signup')}
              >
                <UserPlus size={15} />
                <span>Create Account</span>
              </button>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="auth-form" noValidate>
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="login-email">
                  <span>Work Email Address</span>
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    className="auth-input no-trailing"
                    placeholder="engineer@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="auth-label">
                  <label htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => switchMode('forgot')}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>Sign In to Workspace</span>
                  </>
                )}
              </button>

              <div className="auth-divider">or continue with</div>

              {/* Google Sign In */}
              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
              >
                {googleLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <svg className="auth-google-icon" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>
            </form>
          )}

          {/* 2. CREATE ACCOUNT FORM */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="auth-form" noValidate>
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="register-name">
                  <span>Full Name *</span>
                </label>
                <div className="auth-input-wrapper">
                  <User size={18} className="auth-input-icon" />
                  <input
                    id="register-name"
                    type="text"
                    className="auth-input no-trailing"
                    placeholder="e.g. Ramesh Patel"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label" htmlFor="register-empid">
                  <span>Employee ID * (Required)</span>
                </label>
                <div className="auth-input-wrapper">
                  <BadgeCheck size={18} className="auth-input-icon" />
                  <input
                    id="register-empid"
                    type="text"
                    className="auth-input no-trailing"
                    placeholder="e.g. EMP001, EMP-104"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label" htmlFor="register-email">
                  <span>Email Address *</span>
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="register-email"
                    type="email"
                    className="auth-input no-trailing"
                    placeholder="ramesh@apex-industrial.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label" htmlFor="register-password">
                  <span>Create Password * (min 6 chars)</span>
                </label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label" htmlFor="register-confirm-password">
                  <span>Confirm Password *</span>
                </label>
                <div className="auth-input-wrapper">
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    <span>Register New Account</span>
                  </>
                )}
              </button>

              <div className="auth-divider">or continue with</div>

              <button
                type="button"
                className="auth-google-btn"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
              >
                <svg className="auth-google-icon" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="auth-form" noValidate>
              <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                <div style={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  background: 'rgba(2, 132, 199, 0.2)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 0.75rem',
                  color: '#38bdf8' 
                }}>
                  <KeyRound size={22} />
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Reset Your Password</h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                  Enter your registered work email and we will send you instructions to reset your password.
                </p>
              </div>

              <div className="auth-input-group">
                <label className="auth-label" htmlFor="reset-email">
                  <span>Registered Email</span>
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={18} className="auth-input-icon" />
                  <input
                    id="reset-email"
                    type="email"
                    className="auth-input no-trailing"
                    placeholder="engineer@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Sending Reset Link...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={18} />
                    <span>Send Password Reset Email</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => switchMode('signin')}
                style={{ color: '#94a3b8', gap: '0.4rem', justifyContent: 'center' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Sign In</span>
              </button>
            </form>
          )}

          {/* Quick Demo Access Box (Guarantees immediate testing) */}
          <div className="auth-demo-box">
            <div className="auth-demo-header">
              <div className="auth-demo-title">
                <Sparkles size={14} />
                <span>Quick Test / Evaluation Access</span>
              </div>
              <span className="auth-demo-badge">One-Click</span>
            </div>
            <div className="auth-demo-buttons">
              <button
                type="button"
                className="auth-demo-role-btn"
                onClick={() => handleDemoLogin('engineer')}
                title="Log in as Senior Automation Engineer"
              >
                <span>Ravi Kumar</span>
                <span>Senior Engineer (EMP-104)</span>
              </button>
              <button
                type="button"
                className="auth-demo-role-btn"
                onClick={() => handleDemoLogin('supervisor')}
                title="Log in as Site Operations Lead"
              >
                <span>Priya Sharma</span>
                <span>Operations Lead (EMP-088)</span>
              </button>
            </div>
          </div>

          {/* Firebase Connection Notice / Setup Guide Modal Trigger */}
          <div className="auth-config-notice">
            <ShieldCheck size={14} style={{ color: configured ? '#10b981' : '#f59e0b' }} />
            <span>
              Firebase Auth: {configured ? 'Configured & Active' : 'Keys not yet configured in .env'}
            </span>
            <button
              type="button"
              className="auth-config-link"
              onClick={() => setShowGuideModal(true)}
            >
              (Setup Guide)
            </button>
          </div>
        </div>
      </div>

      {/* Firebase Setup Instructions Modal */}
      <FirebaseGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onConfigSaved={() => window.location.reload()}
      />
    </div>
  );
}
