import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDisplayMode } from '../../context/DisplayModeContext';

/**
 * Top Navigation Bar Component (Responsive)
 */
export const Navbar = () => {
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useDisplayMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const colorSchemeLabels = { navy: 'Navy & white', orange: 'Orange & white', 'navy-green': 'Navy green & white' };
  const colorSchemeLabel = colorSchemeLabels[colorScheme] || 'Orange & white';

  return (
    <nav className="home-navbar" style={{ width: 'calc(100% - 12px)', margin: '12px 6px 0', background: '#ffffff', position: 'sticky', top: 0, zIndex: 1000, border: '1px solid #e8e1db', borderRadius: '22px', boxShadow: '0 4px 14px rgba(75, 46, 36, 0.09)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--brand-primary-light) 0%, var(--brand-primary-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', boxShadow: '0 4px 12px rgba(var(--brand-primary-dark-rgb), 0.35)' }}>
            🍲
          </div>
          <span className="home-navbar-brand" style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', letterSpacing: '-0.5px' }}>
            ShareMeal
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="nav-desktop-links">
          <Link to="/#how-it-works" className="nav-link-item" style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '14px', fontWeight: 600 }}>
            How it works
          </Link>
          <Link to="/find-food" className="nav-link-item" style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '14px', fontWeight: 600 }}>
            Find food
          </Link>
          <Link
            to={user ? (user.role === 'donor' ? '/donor/profile' : `/${user.role}/dashboard`) : '/donate'}
            className="nav-link-item"
            style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '14px', fontWeight: 600 }}
          >
            Donate
          </Link>
          <Link to="/stories" className="nav-link-item" style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '14px', fontWeight: 600 }}>
            Stories
          </Link>
        </div>

        {/* Desktop Auth / Action Links */}
        <div className="nav-desktop-actions">
          <button type="button" onClick={toggleColorScheme} aria-label={`Switch color scheme. Current scheme: ${colorSchemeLabel}`} style={{ background: '#ffffff', border: '1px solid var(--brand-primary)', borderRadius: '100px', padding: '9px 14px', color: 'var(--brand-primary)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            ◐ {colorSchemeLabel} · change
          </button>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link
                to={user.role === 'super_admin' ? '/super-admin/dashboard' : `/${user.role}/dashboard`}
                style={{ textDecoration: 'none', background: 'var(--brand-soft)', color: 'var(--brand-primary-deep)', padding: '8px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 700 }}
              >
                Dashboard ({user.name?.split(' ')[0] || user.role})
              </Link>
              <button
                onClick={logout}
                className="home-navbar-logout"
                style={{ background: 'transparent', border: 0, color: '#6b5d56', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Log out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/login" style={{ textDecoration: 'none', color: '#2c2320', fontSize: '14px', fontWeight: 700, padding: '8px 12px' }}>
                Log in
              </Link>
              <Link
                to="/signup"
            style={{
                  textDecoration: 'none',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  padding: '10px 20px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxShadow: '0 8px 20px rgba(var(--brand-primary-rgb), 0.35)'
                }}
              >
                Get started →
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="nav-mobile-toggle"
          aria-label="Toggle Navigation Menu"
          style={{
            background: 'transparent',
            border: '1px solid rgba(44, 35, 32, 0.15)',
            borderRadius: '10px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '18px',
            color: '#2c2320'
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div
          className="nav-mobile-drawer"
          style={{
            borderTop: '1px solid rgba(44, 35, 32, 0.08)',
            background: '#f8fafc',
            padding: '16px 24px 24px',
            gap: '12px'
          }}
        >
          <Link
            to="/#how-it-works"
            className="nav-link-item"
            onClick={() => setMobileMenuOpen(false)}
            style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '6px 0' }}
          >
            How it works
          </Link>
          <Link
            to="/find-food"
            className="nav-link-item"
            onClick={() => setMobileMenuOpen(false)}
            style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '6px 0' }}
          >
            Find food
          </Link>
          <Link
            to={user ? (user.role === 'donor' ? '/donor/profile' : `/${user.role}/dashboard`) : '/donate'}
            className="nav-link-item"
            onClick={() => setMobileMenuOpen(false)}
            style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '6px 0' }}
          >
            Donate
          </Link>
          <Link
            to="/stories"
            className="nav-link-item"
            onClick={() => setMobileMenuOpen(false)}
            style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '6px 0' }}
          >
            Stories
          </Link>

          <div style={{ height: '1px', background: 'rgba(44, 35, 32, 0.08)', margin: '8px 0' }} />

          <button type="button" onClick={toggleColorScheme} aria-label={`Switch color scheme. Current scheme: ${colorSchemeLabel}`} style={{ background: '#ffffff', border: '1px solid var(--brand-primary)', borderRadius: '100px', padding: '10px 14px', color: 'var(--brand-primary)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
            ◐ {colorSchemeLabel} · change
          </button>

          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to={user.role === 'super_admin' ? '/super-admin/dashboard' : `/${user.role}/dashboard`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ textDecoration: 'none', background: 'var(--brand-soft)', color: 'var(--brand-primary-deep)', padding: '10px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 700, textAlign: 'center' }}
              >
                Dashboard ({user.name?.split(' ')[0] || user.role})
              </Link>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="home-navbar-logout"
                style={{ background: 'transparent', border: '1px solid rgba(44, 35, 32, 0.15)', borderRadius: '100px', padding: '10px', color: '#6b5d56', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Log out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{ textDecoration: 'none', textAlign: 'center', border: '1px solid rgba(44, 35, 32, 0.15)', borderRadius: '100px', padding: '10px', color: '#2c2320', fontSize: '14px', fontWeight: 700 }}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                style={{ textDecoration: 'none', textAlign: 'center', background: 'var(--brand-primary)', color: '#ffffff', borderRadius: '100px', padding: '11px', fontSize: '14px', fontWeight: 700, boxShadow: '0 4px 12px rgba(var(--brand-primary-rgb), 0.3)' }}
              >
                Get started →
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
