import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Footer = () => {
  const { user } = useAuth();

  return (
    <footer style={{ background: '#ffffff', borderTop: '1px solid #eee5e0', padding: '64px 0 32px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '48px', marginBottom: '48px' }}>
          
          {/* Col 1: Brand */}
          <div style={{ maxWidth: '320px' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', textDecoration: 'none' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff8461 0%, #f04b28 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', boxShadow: '0 4px 12px rgba(240, 75, 40, 0.35)' }}>
                🍲
              </div>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2c2320' }}>
                ShareMeal
              </span>
            </Link>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#6b5d56', margin: '0 0 20px' }}>
              A community food-sharing network on a mission to eliminate food waste and ensure no neighbour goes hungry.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['🕊️', '📘', '📸'].map((icon, idx) => (
                <div key={idx} className="footer-social-btn" style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#faf5f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer', border: '1px solid #eee5e0' }}>
                  {icon}
                </div>
              ))}
            </div>
          </div>

          {/* Col 2: Platform */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#2c2320', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
              Platform
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '13px', color: '#6b5d56' }}>
              <li><Link to="/find-food" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>Find food</Link></li>
              <li>
                <Link
                  to={user ? (user.role === 'donor' ? '/donor/profile' : `/${user.role}/dashboard`) : '/donate'}
                  className="footer-link"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  Donate food
                </Link>
              </li>
              <li><Link to="/ngo/login" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>For NGOs</Link></li>
              <li><Link to="/#how-it-works" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>How it works</Link></li>
            </ul>
          </div>

          {/* Col 3: Company */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#2c2320', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '13px', color: '#6b5d56' }}>
              <li><Link to="/#how-it-works" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>About us</Link></li>
              <li><Link to="/stories" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>Stories</Link></li>
              <li><a href="mailto:contact@sharemeal.org" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>Contact</a></li>
            </ul>
          </div>

          {/* Col 4: Support & Trust */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#2c2320', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
              Support &amp; Trust
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '13px', color: '#6b5d56' }}>
              <li><Link to="/help" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>Help centre</Link></li>
              <li><Link to="/safety" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>Safety protocols</Link></li>
              <li><Link to="/privacy" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy policy</Link></li>
              <li><Link to="/terms" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>Terms of service</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Row */}
        <div style={{ borderTop: '1px solid #f1edeb', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: '#8c7e77' }}>
          <div>
            © 2026 ShareMeal. Made with care for fuller plates.
          </div>
          <div>
            Feeding communities across <strong style={{ color: '#2c2320' }}>60 cities</strong>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
