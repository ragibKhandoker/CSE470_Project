import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/constants';

/**
 * CaptchaWidget: Self-contained, cryptographic SVG CAPTCHA component
 * Prevents automated bot submissions on Signups and Requests
 */
export const CaptchaWidget = ({ onCaptchaChange, label = 'Security Verification (Anti-Bot)', compact = false }) => {
  const [captchaId, setCaptchaId] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const fetchCaptcha = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setUserAnswer('');
    if (onCaptchaChange) {
      onCaptchaChange({ captchaId: '', captchaAnswer: '', isValid: false });
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/captcha`);
      const data = await res.json();
      if (res.ok && data.data) {
        setCaptchaId(data.data.captchaId);
        setCaptchaSvg(data.data.svg);
      } else {
        setFetchError('Failed to load security challenge.');
      }
    } catch (err) {
      console.error('Failed to load captcha:', err);
      setFetchError('Network error loading CAPTCHA.');
    } finally {
      setLoading(false);
    }
  }, [onCaptchaChange]);

  useEffect(() => {
    fetchCaptcha();
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value.toUpperCase().slice(0, 6);
    setUserAnswer(val);
    const isValid = val.trim().length >= 4;
    if (onCaptchaChange) {
      onCaptchaChange({
        captchaId,
        captchaAnswer: val.trim(),
        isValid
      });
    }
  };

  return (
    <div
      style={{
        background: '#faf7f5',
        border: '1.5px solid rgba(44, 35, 32, 0.12)',
        borderRadius: compact ? '12px' : '16px',
        padding: compact ? '10px 12px' : '14px 16px',
        marginBottom: compact ? '0' : '16px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: compact ? '11px' : '12px', fontWeight: 800, color: '#2c2320', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <span>🛡️</span>
          <span>{label}</span>
        </div>
        <span style={{ fontSize: '11px', color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
          Bot Shield Active
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '8px' : '12px', flexWrap: 'wrap', marginBottom: compact ? '7px' : '10px' }}>
        {/* CAPTCHA Visual Canvas */}
        <div
          style={{
            minWidth: compact ? '140px' : '160px',
            height: compact ? '40px' : '48px',
            background: '#ffffff',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'hidden'
          }}
        >
          {loading ? (
            <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>Loading code...</span>
          ) : fetchError ? (
            <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600 }}>{fetchError}</span>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: captchaSvg }}
              style={{ display: 'inline-block', lineHeight: 0 }}
              title="Visual security code"
            />
          )}
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={fetchCaptcha}
          disabled={loading}
          title="Click to generate a new CAPTCHA code"
          style={{
            background: '#ffffff',
            border: '1.5px solid #d1d5db',
            borderRadius: '10px',
            padding: compact ? '6px 9px' : '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#374151',
            cursor: loading ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Input Field */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            placeholder="Type characters above..."
            value={userAnswer}
            onChange={handleInputChange}
            maxLength={6}
            autoComplete="off"
            spellCheck="false"
            style={{
              flex: 1,
              padding: compact ? '7px 10px' : '9px 12px',
              borderRadius: '10px',
              border: '1.5px solid #d1d5db',
              fontSize: '14px',
              fontWeight: 800,
              fontFamily: "'Courier New', monospace",
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              background: '#ffffff',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {userAnswer.length >= 4 && (
            <span style={{ color: '#059669', fontSize: '16px', fontWeight: 900 }}>✓</span>
          )}
        </div>
        <p style={{ margin: '4px 0 0', fontSize: compact ? '10px' : '11px', color: '#786d66' }}>
          Enter the 5 characters shown in the box above to verify you are human.
        </p>
      </div>
    </div>
  );
};

export default CaptchaWidget;

