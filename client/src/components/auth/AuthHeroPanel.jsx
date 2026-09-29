import React from 'react';

export const AuthHeroPanel = ({
  title = "Join the movement.",
  subtitle = "Turn surplus into someone's meal. Sign up in under a minute.",
  brandName = "ShareMeal",
  bgGradient,
  badgeText = "1,340 NGOs active partners",
  iconEmoji = "🥗"
}) => {
  return (
    <div className="auth-hero-panel" style={bgGradient ? { background: bgGradient } : {}}>
      <div className="auth-hero-circle-1" />
      <div className="auth-hero-circle-2" />
      <div className="auth-hero-circle-3" />

      <div className="auth-hero-header">
        <div className="auth-logo-badge">🍲</div>
        <h2 className="auth-brand-name">{brandName}</h2>
      </div>

      <div className="auth-hero-center">
        <div className="auth-icon-circles">
          <div className="auth-icon-inner-1">
            <div className="auth-icon-inner-2">
              {iconEmoji}
            </div>
          </div>

          <div className="auth-badge-float-1">
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>482k+ meals</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>rescued to date</div>
          </div>

          <div className="auth-badge-float-2">
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>{badgeText}</div>
          </div>
        </div>

        <h1 className="auth-hero-title">{title}</h1>
        <p className="auth-hero-subtitle">{subtitle}</p>
      </div>

      <div className="auth-hero-footer-pills">
        <div className="auth-pill"><span>🛡️</span> Verified & Safe</div>
        <div className="auth-pill"><span>🤝</span> Free Forever</div>
        <div className="auth-pill"><span>📍</span> 60+ Cities</div>
      </div>
    </div>
  );
};

export default AuthHeroPanel;
