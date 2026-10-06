import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const VerificationBanner = () => {
  const { user } = useAuth();

  // If user is verified or not logged in, don't show the banner
  if (!user || user.verification_status === 'verified') {
    return null;
  }

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)',
        borderBottom: '1px solid #fed7aa',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#9a3412',
        fontSize: '13px',
        fontWeight: 500,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span>
          <strong>Profile Verification Required:</strong> Your account is currently pending verification. You cannot post food donations until your NID profile is completed and verified by our team.
        </span>
      </div>

      <Link
        to="/donor/profile"
        style={{
          background: '#ea580c',
          color: '#ffffff',
          padding: '5px 12px',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '12px',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)'
        }}
      >
        Complete Profile →
      </Link>
    </div>
  );
};

export default VerificationBanner;
