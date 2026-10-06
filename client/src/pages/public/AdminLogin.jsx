import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';
import '../../App.css';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot Password / OTP State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [otpStep, setOtpStep] = useState(1); // 1 = enter email, 2 = enter OTP & new pass
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpMsg, setOtpMsg] = useState('');
  const [otpErr, setOtpErr] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login({ email, password });
      if (data.user?.role === 'admin') {
        navigate('/admin/users');
      } else {
        setError('Access denied: Account does not have Super Admin privileges.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Super Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setOtpErr('');
    setOtpMsg('');
    setOtpLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP code');

      setOtpCode('');
      setOtpMsg(`✉️ 6-digit OTP code sent to ${recoveryEmail}. Please check your email inbox!`);
      setOtpStep(2);
    } catch (err) {
      setOtpErr(err.message || 'Error requesting OTP code');
    } finally {
      setOtpLoading(false);
    }
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setOtpErr('');
    setOtpMsg('');
    setOtpLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, otp: otpCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      setShowForgotModal(false);
      setShowSuccessModal(true);
      setOtpStep(1);
      setPassword(newPassword);
    } catch (err) {
      setOtpErr(err.message || 'Error resetting password');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#181311', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#241c19', borderRadius: '24px', padding: '36px', border: '1px solid #3a2e29', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', color: '#fff' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 54, height: 54, borderRadius: 16, background: 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-deep) 100%)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 8px 20px rgba(var(--brand-primary-rgb), 0.3)' }}>
            👑
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>Super Admin Portal</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            Restricted access for system management &amp; user verification
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', padding: '12px', borderRadius: 12, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAdminLogin} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
              SUPER ADMIN EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', background: '#1a1412', border: '1px solid #3d312a', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 14, outline: 'none' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                PASSWORD
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                style={{ background: 'transparent', border: 0, color: 'var(--brand-primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', background: '#1a1412', border: '1px solid #3d312a', borderRadius: 12, padding: '12px 42px 12px 14px', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 0, fontSize: '16px', cursor: 'pointer', opacity: 0.8 }}
                title={showPassword ? "Hide Password" : "Show Password"}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: 'var(--brand-primary)', color: '#fff', border: 0, borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 8, boxShadow: '0 6px 16px rgba(var(--brand-primary-rgb), 0.3)' }}
          >
            {loading ? 'Authenticating...' : 'Access Admin Panel →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link to="/login" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>
            ← Back to Public User Login
          </Link>
        </div>
      </div>

      {/* Password Recovery OTP Modal */}
      {showForgotModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: 400, background: '#241c19', borderRadius: 20, padding: 28, border: '1px solid #3d312a', color: '#fff' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>🔑 Password Recovery via OTP</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: '0 0 16px' }}>
              Reset your Super Admin password using email verification code
            </p>

            {otpMsg && <div style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{otpMsg}</div>}
            {otpErr && <div style={{ background: 'rgba(220,38,38,0.15)', color: '#fca5a5', padding: 10, borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{otpErr}</div>}

            {otpStep === 1 ? (
              <form onSubmit={handleSendOtp} style={{ display: 'grid', gap: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Your Email Address</label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  style={{ width: '100%', background: '#1a1412', border: '1px solid #3d312a', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13 }}
                />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setShowForgotModal(false)} style={{ flex: 1, background: '#332924', color: '#ccc', border: 0, borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={otpLoading} style={{ flex: 2, background: 'var(--brand-primary)', color: '#fff', border: 0, borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {otpLoading ? 'Sending...' : 'Send OTP Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600 }}>6-Digit OTP Code</label>
                <input
                  type="text"
                  placeholder="e.g. 482915"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  style={{ width: '100%', background: '#1a1412', border: '1px solid #3d312a', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 14, letterSpacing: 2, textAlign: 'center' }}
                />

                <label style={{ fontSize: 12, fontWeight: 600 }}>New Password</label>
                <input
                  type="password"
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{ width: '100%', background: '#1a1412', border: '1px solid #3d312a', borderRadius: 10, padding: '10px 12px', color: '#fff', fontSize: 13 }}
                />

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <button type="button" onClick={() => setOtpStep(1)} style={{ flex: 1, background: '#332924', color: '#ccc', border: 0, borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>← Back</button>
                  <button type="submit" disabled={otpLoading} style={{ flex: 2, background: '#059669', color: '#fff', border: 0, borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {otpLoading ? 'Resetting...' : 'Reset Password →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Password Changed Success Popup Modal */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 3000 }}>
          <div style={{ width: '100%', maxWidth: '420px', background: '#241c19', borderRadius: '24px', padding: '32px 28px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', border: '1px solid #3d312a', color: '#fff' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: 32, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 8px 20px rgba(16,185,129,0.2)' }}>
              ✓
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 800, color: '#ffffff' }}>Password Changed!</h3>
            <p style={{ margin: '0 0 24px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '20px' }}>
              Your Super Admin password has been updated successfully. You can now log into your account using your new password.
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessModal(false)}
              style={{ width: '100%', background: '#10b981', color: '#ffffff', border: 0, borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
            >
              Great, Log In Now →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
