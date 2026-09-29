import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/constants';
import '../../App.css';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setTokenError('No password reset token provided. Please use the link sent to your notification panel.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (res.ok && data.valid) {
          setTokenValid(true);
          setUserInfo(data.user);
        } else {
          setTokenValid(false);
          setTokenError(data.message || 'Invalid or expired password reset link.');
        }
      } catch (err) {
        setTokenValid(false);
        setTokenError('Could not verify reset token. Please check your internet connection.');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (newPassword.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-with-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Password reset failed.');

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setSubmitError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #fff9f5 0%, #fef3ec 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 20px 60px rgba(44,35,32,0.08)',
        border: '1px solid rgba(44,35,32,0.06)'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ff6b4a 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(255,107,74,0.35)'
          }}>
            🔑
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 800, color: '#2c2320' }}>
            Set New Password
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b5d56' }}>
            Super Admin Approved Password Reset
          </p>
        </div>

        {verifying ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#6b5d56' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>⏳</div>
            Verifying your secure reset link...
          </div>
        ) : !tokenValid ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '13px',
              marginBottom: '20px',
              border: '1px solid #fecaca',
              lineHeight: 1.5
            }}>
              ⚠️ {tokenError}
            </div>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                background: '#ff6b4a',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              Back to Login
            </Link>
          </div>
        ) : submitSuccess ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{
              background: '#ecfdf5',
              color: '#047857',
              padding: '18px',
              borderRadius: '14px',
              fontSize: '14px',
              marginBottom: '20px',
              border: '1px solid #a7f3d0',
              fontWeight: 700,
              lineHeight: 1.6
            }}>
              🎉 Password Changed Successfully!<br />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>Redirecting to Login page in 3 seconds...</span>
            </div>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                background: '#ff6b4a',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px'
              }}
            >
              Log In Now →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {userInfo && (
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                Account: <strong style={{ color: '#0f172a' }}>{userInfo.name}</strong> ({userInfo.identifier})
              </div>
            )}

            {submitError && (
              <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', border: '1px solid #fecaca' }}>
                {submitError}
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                New Password <span style={{ color: '#ff6b4a' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 44px 0 14px',
                    borderRadius: '12px',
                    border: '1px solid rgba(44,35,32,0.15)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
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
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                Confirm New Password <span style={{ color: '#ff6b4a' }}>*</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '46px',
                  padding: '0 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(44,35,32,0.15)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                height: '48px',
                background: 'linear-gradient(135deg, #ff6b4a 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(255,107,74,0.35)'
              }}
            >
              {submitting ? 'Updating Password...' : 'Save New Password & Continue →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link to="/login" style={{ color: '#6b5d56', fontSize: '13px', textDecoration: 'none' }}>
                Cancel and return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
