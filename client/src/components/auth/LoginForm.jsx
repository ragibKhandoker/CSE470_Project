import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { API_BASE_URL } from '../../utils/constants';

export const LoginForm = ({ onSubmit, onGoogleSuccess, loading, error, title = "Log in", subtitle = "Good to see you again." }) => {
  const [searchParams] = useSearchParams();
  const initialIdentifier = searchParams.get('identifier') || searchParams.get('phone') || searchParams.get('email') || '';
  const [phone, setPhone] = useState(initialIdentifier);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot Password Request Modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState(initialIdentifier);
  const [forgotReason, setForgotReason] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    setForgotLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: forgotIdentifier,
          reason: forgotReason
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Request failed');

      setForgotSuccessMsg(data.message);
    } catch (err) {
      setForgotErrorMsg(err.message || 'Failed to submit request');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ phone: phone, email: phone, password });
  };

  const errorMessage = typeof error === 'string' ? error : (error?.message || '');
  const isNotFound = (error && typeof error === 'object' && error.notFound) || /no\s+account|not\s+found/i.test(errorMessage);
  const isWrongPassword = (error && typeof error === 'object' && error.userExists) || /incorrect password/i.test(errorMessage);

  return (
    <div>
      <div className="auth-form-header">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (onGoogleSuccess && credentialResponse.credential) {
              onGoogleSuccess(credentialResponse.credential);
            }
          }}
          onError={() => {
            console.error('Google Sign-In failed');
          }}
          text="continue_with"
          theme="outline"
          shape="pill"
          width="320"
        />
      </div>

      <div className="auth-divider">or</div>

      {isNotFound ? (
        <div style={{
          marginBottom: 16,
          padding: '14px 16px',
          background: '#eff6ff',
          border: '1.5px solid #bfdbfe',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>👤</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e40af', marginBottom: '4px' }}>
                No Account Found
              </div>
              <div style={{ fontSize: '13px', color: '#1d4ed8', lineHeight: 1.4, marginBottom: '10px' }}>
                {errorMessage || 'No account was found with this phone number or email. You can create a new account in under a minute.'}
              </div>
              <Link
                to={`/signup`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                }}
              >
                Sign Up Free →
              </Link>
            </div>
          </div>
        </div>
      ) : isWrongPassword ? (
        <div style={{
          marginBottom: 16,
          padding: '14px 16px',
          background: '#fff1f2',
          border: '1.5px solid #fecdd3',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>🔒</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#9f1239', marginBottom: '4px' }}>
                Incorrect Password
              </div>
              <div style={{ fontSize: '13px', color: '#be123c', lineHeight: 1.4, marginBottom: '10px' }}>
                {errorMessage || 'Account exists for this user, but the password entered was incorrect.'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setForgotIdentifier(phone);
                  setShowForgotModal(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#e11d48',
                  color: '#ffffff',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 0,
                  cursor: 'pointer'
                }}
              >
                🔑 Reset Password →
              </button>
            </div>
          </div>
        </div>
      ) : errorMessage ? (
        <div style={{ marginBottom: 12, padding: 10, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13, borderRadius: 10 }}>
          {errorMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <div className="auth-input-group">
          <label>Phone Number or Email Address <span className="required">*</span></label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">📞</span>
            <input
              type="text"
              placeholder="01712345678 or name@email.com"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label>Password <span className="required">*</span></label>
          <div className="auth-input-wrapper" style={{ position: 'relative' }}>
            <span className="auth-input-icon">🔒</span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 0,
                fontSize: '16px',
                cursor: 'pointer',
                opacity: 0.8
              }}
              title={showPassword ? "Hide Password" : "Show Password"}
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '12px 0', fontSize: 13, color: '#6b5d56' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" style={{ accentColor: '#f04b28' }} />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => {
              setShowForgotModal(true);
              setForgotErrorMsg('');
              setForgotSuccessMsg('');
            }}
            style={{
              background: 'transparent',
              border: 0,
              padding: 0,
              color: '#f04b28',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Forgot password?
          </button>
        </div>

        <button type="submit" disabled={loading} className="auth-primary-btn">
          {loading ? 'Logging In...' : 'Log In →'}
        </button>
      </form>

      <p className="auth-switch-text">
        Don't have an account?{' '}
        <Link to="/signup" className="auth-switch-link">
          Sign up free
        </Link>
      </p>

      {/* Forgot Password Super Admin Request Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 4000
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            border: '1px solid rgba(44,35,32,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2c2320', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔑</span> Request Password Reset Link
              </h3>
              <button
                onClick={() => setShowForgotModal(false)}
                style={{ background: 'transparent', border: 0, fontSize: '20px', cursor: 'pointer', color: '#888' }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b5d56', lineHeight: 1.5 }}>
              Request Super Admin to approve your password reset link. Once approved, you will receive a secure reset link in your in-app notification panel.
            </p>

            {forgotErrorMsg && (
              <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px', border: '1px solid #fecaca' }}>
                {forgotErrorMsg}
              </div>
            )}

            {forgotSuccessMsg ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ background: '#ecfdf5', color: '#047857', padding: '16px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px', border: '1px solid #a7f3d0', fontWeight: 600, lineHeight: 1.5 }}>
                  🎉 {forgotSuccessMsg}
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  style={{
                    background: '#ff6b4a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 24px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close &amp; Check Notification
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                    Registered Phone or Email <span style={{ color: '#ff6b4a' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="01712345678 or name@email.com"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,35,32,0.15)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                    Reason or Note for Admin (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Forgot my login password, need reset link..."
                    value={forgotReason}
                    onChange={(e) => setForgotReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(44,35,32,0.15)',
                      fontSize: '13px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    style={{
                      background: '#f1f5f9',
                      color: '#475569',
                      border: 0,
                      borderRadius: '10px',
                      padding: '10px 18px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      background: 'linear-gradient(135deg, #ff6b4a 0%, #ea580c 100%)',
                      color: '#ffffff',
                      border: 0,
                      borderRadius: '10px',
                      padding: '10px 22px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255,107,74,0.3)'
                    }}
                  >
                    {forgotLoading ? 'Submitting...' : 'Submit Request to Admin →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
