import React from 'react';
import { Link } from 'react-router-dom';

export const RoleSelector = ({ role, setRole, onContinue }) => {
  return (
    <div>
      <div className="auth-form-header">
        <h1>Create account</h1>
        <p>Who are you joining as?</p>
      </div>

      <div className="auth-role-cards">
        {/* Option 1: Donor */}
        <div
          className={`auth-role-card ${role === 'donor' ? 'selected-donor' : ''}`}
          onClick={() => setRole('donor')}
        >
          <div className="auth-role-left">
            <div className="auth-role-icon donor">🤝</div>
            <div className="auth-role-info">
              <h3>I want to Donate</h3>
              <p>Share surplus food with your community</p>
            </div>
          </div>
          <div className={`auth-role-radio ${role === 'donor' ? 'checked' : ''}`} />
        </div>

        {/* Option 2: Find Food (Receiver) */}
        <div
          className={`auth-role-card ${role === 'receiver' ? 'selected-receiver' : ''}`}
          onClick={() => setRole('receiver')}
        >
          <div className="auth-role-left">
            <div className="auth-role-icon receiver">🔍</div>
            <div className="auth-role-info">
              <h3>I want to Find Food</h3>
              <p>Find meals nearby, stay anonymous if you wish</p>
            </div>
          </div>
          <div className={`auth-role-radio ${role === 'receiver' ? 'checked' : ''}`} />
        </div>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="auth-primary-btn"
      >
        Continue →
      </button>

      <p className="auth-switch-text">
        Already have an account?{' '}
        <Link to="/login" className="auth-switch-link">
          Log in
        </Link>
      </p>
    </div>
  );
};

export default RoleSelector;
