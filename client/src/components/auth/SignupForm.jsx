import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import authService from '../../services/authService';

export const SignupForm = ({ role, onSubmit, onGoogleSuccess, loading, error }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [nid, setNid] = useState('');
  const [nidPdf, setNidPdf] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(true);

  // Duplicate user detection states
  const [phoneExistsMsg, setPhoneExistsMsg] = useState('');
  const [emailExistsMsg, setEmailExistsMsg] = useState('');
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const roleLabels = {
    donor: 'I want to Donate',
    receiver: 'I want to Find Food',
    ngo: 'I am an NGO / Organization'
  };

  const handlePhoneBlur = async () => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 8) return;
    setCheckingPhone(true);
    try {
      const res = await authService.checkExists({ phone: trimmed });
      if (res.exists && (res.field === 'phone' || res.field === 'identifier')) {
        setPhoneExistsMsg('User already exists with this phone number. Please log in instead.');
      } else {
        setPhoneExistsMsg('');
      }
    } catch (e) {
      // background check silent fail
    } finally {
      setCheckingPhone(false);
    }
  };

  const handleEmailBlur = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) return;
    setCheckingEmail(true);
    try {
      const res = await authService.checkExists({ email: trimmed });
      if (res.exists && (res.field === 'email' || res.field === 'identifier')) {
        setEmailExistsMsg('User already exists with this email address. Please log in instead.');
      } else {
        setEmailExistsMsg('');
      }
    } catch (e) {
      // background check silent fail
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      name,
      phone,
      email,
      address,
      nid,
      nidPdf,
      password,
      role,
      agreed
    });
  };

  const errorMessage = typeof error === 'string' ? error : (error?.message || '');
  const isDuplicateError = (error && typeof error === 'object' && error.userExists) || /already\s+(exist|registered)/i.test(errorMessage);
  const duplicateField = (error && typeof error === 'object' && error.field) || (errorMessage.toLowerCase().includes('email') ? 'email' : (errorMessage.toLowerCase().includes('phone') || errorMessage.toLowerCase().includes('mobile') ? 'phone' : null));

  const hasPhoneDuplicate = Boolean(phoneExistsMsg) || (isDuplicateError && duplicateField === 'phone');
  const hasEmailDuplicate = Boolean(emailExistsMsg) || (isDuplicateError && duplicateField === 'email');
  const hasAnyDuplicate = Boolean(phoneExistsMsg) || Boolean(emailExistsMsg) || isDuplicateError;

  return (
    <div>
      <div className="auth-form-header">
        <h1>Your details</h1>
        <div>
          <span className={`auth-selected-role-pill ${role}`}>
            Signing up as {roleLabels[role]}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14, marginBottom: 14 }}>
        <GoogleLogin
          onSuccess={(credentialResponse) => {
            if (onGoogleSuccess && credentialResponse.credential) {
              onGoogleSuccess(credentialResponse.credential);
            }
          }}
          onError={() => {
            console.error('Google Sign-Up failed');
          }}
          text="signup_with"
          theme="outline"
          shape="pill"
          width="320"
        />
      </div>

      <div className="auth-divider">or</div>

      {hasAnyDuplicate ? (
        <div style={{
          marginBottom: 16,
          padding: '14px 16px',
          background: '#fff7ed',
          border: '1.5px solid #fed7aa',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ fontSize: '20px', lineHeight: 1 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#9a3412', marginBottom: '4px' }}>
                User Already Exists
              </div>
              <div style={{ fontSize: '13px', color: '#c2410c', lineHeight: 1.4, marginBottom: '10px' }}>
                {phoneExistsMsg || emailExistsMsg || errorMessage || 'An account with this phone number or email address already exists. Please log in instead.'}
              </div>
              <Link
                to={`/login?identifier=${encodeURIComponent(phone || email || '')}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#ea580c',
                  color: '#ffffff',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)'
                }}
              >
                Log in to Your Account →
              </Link>
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
          <label>Full Name <span className="required">*</span></label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">👤</span>
            <input
              type="text"
              placeholder="Abdur Rahman"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label>Mobile Number <span className="required">*</span></label>
          <div className="auth-input-wrapper" style={{ borderColor: hasPhoneDuplicate ? '#ef4444' : undefined, background: hasPhoneDuplicate ? '#fffbfb' : undefined }}>
            <span className="auth-input-icon">📞</span>
            <input
              type="text"
              placeholder="01712345678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (phoneExistsMsg) setPhoneExistsMsg('');
              }}
              onBlur={handlePhoneBlur}
              required
            />
            {checkingPhone && <span style={{ fontSize: '11px', color: '#9c8e85', marginRight: '8px' }}>Checking...</span>}
          </div>
          {hasPhoneDuplicate && (
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>⚠️ User already exists with this phone number.</span>
              <Link to={`/login?identifier=${encodeURIComponent(phone)}`} style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'underline' }}>
                Log in instead →
              </Link>
            </div>
          )}
        </div>

        <div className="auth-input-group">
          <label>Email Address <span className="required">*</span></label>
          <div className="auth-input-wrapper" style={{ borderColor: hasEmailDuplicate ? '#ef4444' : undefined, background: hasEmailDuplicate ? '#fffbfb' : undefined }}>
            <span className="auth-input-icon">✉️</span>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailExistsMsg) setEmailExistsMsg('');
              }}
              onBlur={handleEmailBlur}
              required
            />
            {checkingEmail && <span style={{ fontSize: '11px', color: '#9c8e85', marginRight: '8px' }}>Checking...</span>}
          </div>
          {hasEmailDuplicate && (
            <div style={{ marginTop: '6px', fontSize: '12px', color: '#dc2626', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>⚠️ User already exists with this email address.</span>
              <Link to={`/login?identifier=${encodeURIComponent(email)}`} style={{ color: '#ea580c', fontWeight: 700, textDecoration: 'underline' }}>
                Log in instead →
              </Link>
            </div>
          )}
        </div>

        <div className="auth-input-group">
          <label>Address</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">📍</span>
            <input
              type="text"
              placeholder="Street, City, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label>NID / ID Number <span className="required">*</span></label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">🛡️</span>
            <input
              type="text"
              placeholder="1234567890123"
              value={nid}
              onChange={(e) => setNid(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label>NID / ID Document (PDF or Image) <span className="required">*</span></label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon">📤</span>
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setNidPdf(e.target.files[0] || null)}
            />
          </div>
        </div>

        <div className="auth-input-group">
          <label>Password <span className="required">*</span></label>
          <div className="auth-input-wrapper" style={{ position: 'relative' }}>
            <span className="auth-input-icon">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0', fontSize: 12, color: '#6b5d56' }}>
          <input
            type="checkbox"
            id="agreeTerms"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ accentColor: 'var(--brand-primary)' }}
          />
          <label htmlFor="agreeTerms" style={{ textTransform: 'none', fontWeight: 400, margin: 0, cursor: 'pointer' }}>
            I agree to ShareMeal's <span style={{ color: 'var(--brand-primary-dark)', fontWeight: 600 }}>Terms of Service</span> and <span style={{ color: 'var(--brand-primary-dark)', fontWeight: 600 }}>Privacy Policy</span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="auth-primary-btn">
          {loading ? 'Creating Account...' : 'Create Account →'}
        </button>
      </form>

      <p className="auth-switch-text">
        Already have an account?{' '}
        <Link to="/login" className="auth-switch-link">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default SignupForm;
