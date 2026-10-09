import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDisplayMode } from '../../context/DisplayModeContext';
import { allStories } from '../../data/storiesData';
import { API_BASE_URL } from '../../utils/constants';
import './Home.css';

export const Stories = () => {
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useDisplayMode();
  const colorSchemeLabel = { navy: 'Navy & white', orange: 'Orange & white', 'navy-green': 'Navy green & white' }[colorScheme] || 'Orange & white';
  const navigate = useNavigate();

  // Active Filter Tab state: 'All' | 'Volunteer' | 'Impact' | 'Donor'
  const [activeFilter, setActiveFilter] = useState('All');

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Newsletter Subscription state
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const [storiesList, setStoriesList] = useState(allStories);

  useEffect(() => {
    fetch(`${API_BASE_URL}/stories`)
      .then(res => res.json())
      .then(data => {
        if (data && data.stories && data.stories.length > 0) {
          const mapped = data.stories.map(s => ({
            ...s,
            tagBg: s.tag_bg || s.tagBg || 'var(--brand-soft)',
            tagColor: s.tag_color || s.tagColor || 'var(--brand-primary-deep)',
            tagIcon: s.tag_icon || s.tagIcon || '🤝',
            readTime: s.read_time || s.readTime || '4 min read',
            authorRole: s.author_role || s.authorRole || 'Community Contributor',
            authorAvatar: s.author_avatar || s.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.author || 'ShareMeal')}&background=ff6b4a&color=fff`,
            featured: s.is_featured ?? s.featured ?? false
          }));
          setStoriesList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
    }
  };

  // Filtered Stories list for the grid
  const filteredStories = activeFilter === 'All'
    ? storiesList
    : storiesList.filter(story => (story.category || '').toLowerCase() === activeFilter.toLowerCase());

  // Two prominent spotlight stories
  const featuredStories = storiesList.filter(s => s.featured || s.is_featured).length > 0
    ? storiesList.filter(s => s.featured || s.is_featured).slice(0, 2)
    : storiesList.slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#2c2320', fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: 'clip' }}>
      
      {/* ========================================================
          1. NAVIGATION BAR (Matching Home Pixel-Perfect Navbar)
      ======================================================== */}
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

          {/* Center Nav Links */}
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
            <Link to="/stories" className="nav-link-item" style={{ textDecoration: 'none', color: 'var(--brand-primary-dark)', fontSize: '14px', fontWeight: 700 }}>
              Stories
            </Link>
          </div>

          {/* Right Action Buttons (Desktop / Tablet) */}
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
              <>
                <Link to="/login" style={{ textDecoration: 'none', color: '#2c2320', fontSize: '14px', fontWeight: 700, padding: '8px 12px' }}>
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary-hover"
                  style={{
                    textDecoration: 'none',
                    background: 'var(--brand-primary)',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '100px',
                    fontSize: '13px',
                    fontWeight: 700,
                    boxShadow: '0 8px 20px rgba(var(--brand-primary-rgb), 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  Get started <span>→</span>
                </Link>
              </>
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
              style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '4px 0' }}
            >
              How it works
            </Link>
            <Link
              to="/find-food"
              className="nav-link-item"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '4px 0' }}
            >
              Find food
            </Link>
            <Link
              to={user ? (user.role === 'donor' ? '/donor/profile' : `/${user.role}/dashboard`) : '/donate'}
              className="nav-link-item"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '4px 0' }}
            >
              Donate
            </Link>
            <Link
              to="/stories"
              className="nav-link-item"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: 'var(--brand-primary-dark)', fontSize: '15px', fontWeight: 700, padding: '4px 0' }}
            >
              Stories
            </Link>
            <div style={{ height: '1px', background: 'rgba(44, 35, 32, 0.08)', margin: '6px 0' }} />
            <button type="button" onClick={toggleColorScheme} aria-label={`Switch color scheme. Current scheme: ${colorSchemeLabel}`} style={{ background: '#ffffff', border: '1px solid var(--brand-primary)', borderRadius: '100px', padding: '10px 14px', color: 'var(--brand-primary)', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
              ◐ {colorSchemeLabel} · change
            </button>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  to={user.role === 'super_admin' ? '/super-admin/dashboard' : `/${user.role}/dashboard`}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textDecoration: 'none', background: 'var(--brand-soft)', color: 'var(--brand-primary-deep)', padding: '10px 16px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}
                >
                  Dashboard ({user.name?.split(' ')[0] || user.role})
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="home-navbar-logout"
                  style={{ background: 'transparent', border: 0, color: '#6b5d56', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textAlign: 'center', padding: '8px 0' }}
                >
                  Log out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textDecoration: 'none', color: '#2c2320', fontSize: '14px', fontWeight: 700, textAlign: 'center', padding: '10px 16px' }}
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary-hover"
                  style={{
                    textDecoration: 'none',
                    background: 'var(--brand-primary)',
                    color: '#ffffff',
                    padding: '12px 20px',
                    borderRadius: '100px',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: '0 8px 20px rgba(var(--brand-primary-rgb), 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  Get started <span>→</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ========================================================
          2. STORIES PAGE HERO HEADER (From Figma Node 8:29407)
      ======================================================== */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '60px 24px 48px', textAlign: 'center' }}>
        
        {/* Ambient Glows */}
        <div style={{ position: 'absolute', top: '-60px', left: '-80px', width: '340px', height: '340px', borderRadius: '50%', background: 'rgba(255, 199, 182, 0.5)', filter: 'blur(75px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: '#fff2d6', filter: 'blur(75px)', opacity: 0.7, pointerEvents: 'none' }} />

        <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
          
          {/* Stories from the field Pill Chip */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--brand-soft)', padding: '6px 16px', borderRadius: '100px', marginBottom: '20px' }}>
            <span style={{ fontSize: '14px' }}>📖</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand-primary-deep)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Stories from the field
            </span>
          </div>

          {/* Heading with styled coral accent */}
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(36px, 5.5vw, 60px)', fontWeight: 800, color: '#2c2320', lineHeight: 1.15, margin: '0 0 18px', letterSpacing: '-1.5px' }}>
            Meals, moments &amp; <br />
            <span style={{ color: 'var(--brand-primary-dark)' }}>the people behind them</span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 18px)', lineHeight: 1.6, color: '#6b5d56', maxWidth: '600px', margin: '0 auto' }}>
            Real accounts from donors, volunteers, and community members building a more generous city — one meal at a time.
          </p>

        </div>
      </section>

      {/* ========================================================
          3. FEATURED SPOTLIGHT STORIES (From Figma Node 8:29421)
      ======================================================== */}
      <section style={{ padding: '0 24px 60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '28px' }}>
            {featuredStories.map((story) => (
              <div
                key={story.id}
                onClick={() => navigate(`/stories/${story.slug || story.id}`)}
                className="story-card"
                style={{
                  background: '#ffffff',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '1px solid rgba(44, 35, 32, 0.06)',
                  boxShadow: '0 8px 24px rgba(44, 35, 32, 0.05)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Image with Tag Overlay */}
                  <div className="story-img-wrapper" style={{ position: 'relative', height: '260px', width: '100%', overflow: 'hidden' }}>
                    <img src={story.image} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(44, 35, 32, 0.65) 0%, rgba(44, 35, 32, 0.1) 50%, transparent 100%)' }} />
                    
                    {/* Badge */}
                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '6px', background: story.tagBg, padding: '4px 12px', borderRadius: '100px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      <span style={{ fontSize: '11px' }}>{story.tagIcon}</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: story.tagColor }}>
                        {story.category}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '24px 24px 12px' }}>
                    <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(20px, 2.5vw, 24px)', fontWeight: 800, color: '#2c2320', lineHeight: 1.35, margin: '0 0 12px' }}>
                      {story.title}
                    </h2>
                    <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#6b5d56', margin: 0 }}>
                      {story.summary}
                    </p>
                  </div>
                </div>

                {/* Author & Read Time Footer */}
                <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #f7f3f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={story.authorAvatar} alt={story.author} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#4a3e39' }}>{story.author}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#8c7e77' }}>
                    <span>📅 {story.date}</span>
                    <span>🕒 {story.readTime}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          4. ALL STORIES FILTERABLE GRID (From Figma Node 8:29487)
      ======================================================== */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Section Title & Filter Tabs Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px', flexWrap: 'wrap', gap: '18px' }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: 800, color: '#2c2320', margin: 0 }}>
              All Stories
            </h2>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['All', 'Volunteer', 'Impact', 'Donor'].map((tab) => {
                const isActive = activeFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveFilter(tab)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: '100px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: isActive ? '1px solid var(--brand-primary)' : '1px solid rgba(44, 35, 32, 0.1)',
                      background: isActive ? 'var(--brand-primary)' : '#ffffff',
                      color: isActive ? '#ffffff' : '#6b5d56',
                      boxShadow: isActive ? '0 4px 14px rgba(var(--brand-primary-rgb), 0.35)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                    }}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Column Responsive Stories Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '24px' }}>
            {filteredStories.map((story) => (
              <div
                key={story.id}
                onClick={() => navigate(`/stories/${story.slug || story.id}`)}
                className="story-card"
                style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '1px solid rgba(44, 35, 32, 0.06)',
                  boxShadow: '0 8px 24px rgba(44, 35, 32, 0.04)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Photo with Tag Badge */}
                  <div className="story-img-wrapper" style={{ position: 'relative', height: '185px', width: '100%', overflow: 'hidden' }}>
                    <img src={story.image} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: '12px', left: '12px', background: story.tagBg, color: story.tagColor, padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                      <span>{story.tagIcon}</span> {story.category}
                    </span>
                  </div>

                  {/* Body Details */}
                  <div style={{ padding: '20px 20px 12px' }}>
                    <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 800, color: '#2c2320', lineHeight: 1.4, margin: '0 0 8px' }}>
                      {story.title}
                    </h3>
                    <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#6b5d56', margin: 0 }}>
                      {story.summary}
                    </p>
                  </div>
                </div>

                {/* Card Bottom Meta */}
                <div style={{ padding: '14px 20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f7f3f0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={story.authorAvatar} alt={story.author} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#4a3e39' }}>{story.author}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#8c7e77', fontWeight: 600 }}>
                    🕒 {story.readTime}
                  </span>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          5. DUAL CTA SECTION (From Figma Node 8:29647)
      ======================================================== */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
          
          {/* Card 1: Give Food */}
          <div
            className="dual-cta-card"
            style={{
              background: '#ffe9e2',
              border: '1.5px solid #ffffff',
              borderRadius: '32px',
              padding: 'clamp(28px, 4vw, 36px)',
              boxShadow: '0 12px 32px rgba(var(--brand-primary-rgb), 0.15)'
            }}
          >
            <div className="cta-icon" style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--brand-primary-light) 0%, var(--brand-primary-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '20px', boxShadow: '0 8px 16px rgba(var(--brand-primary-dark-rgb), 0.35)', color: '#fff' }}>
              🎁
            </div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 800, color: '#2c2320', margin: '0 0 10px' }}>
              I have food to give
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#6b5d56', margin: '0 0 24px' }}>
              Post surplus from your kitchen, restaurant or event in under a minute.
            </p>
            <Link
              to={user ? (user.role === 'donor' ? '/donor/profile' : `/${user.role}/dashboard`) : '/donate'}
              className="btn-secondary-hover"
              style={{
                textDecoration: 'none',
                background: '#2c2320',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '100px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Become a donor <span>→</span>
            </Link>
          </div>

          {/* Card 2: Need Food */}
          <div
            className="dual-cta-card"
            style={{
              background: '#e3f5ea',
              border: '1.5px solid #ffffff',
              borderRadius: '32px',
              padding: 'clamp(28px, 4vw, 36px)',
              boxShadow: '0 12px 32px rgba(47, 156, 102, 0.15)'
            }}
          >
            <div className="cta-icon" style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'linear-gradient(135deg, #5ec98f 0%, #2f9c66 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '20px', boxShadow: '0 8px 16px rgba(47, 156, 102, 0.35)', color: '#fff' }}>
              🍲
            </div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 800, color: '#2c2320', margin: '0 0 10px' }}>
              I need a meal
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#6b5d56', margin: '0 0 24px' }}>
              Find verified food nearby — publicly or fully anonymous. No cost, ever.
            </p>
            <Link
              to="/find-food"
              className="btn-primary-hover"
              style={{
                textDecoration: 'none',
                background: '#2c2320',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '100px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Find food now <span>→</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================
          6. NEWSLETTER / DIGEST (From Figma Node 8:29685)
      ======================================================== */}
      <section style={{ padding: '0 24px 90px' }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          
          <div
            style={{
              background: '#ffffff',
              borderRadius: '32px',
              padding: '48px 32px',
              textAlign: 'center',
              border: '1px solid rgba(44, 35, 32, 0.06)',
              boxShadow: '0 20px 50px rgba(44, 35, 32, 0.06)'
            }}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 18px', color: '#fff', boxShadow: '0 8px 20px rgba(var(--brand-primary-rgb), 0.35)' }}>
              💌
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: '#2c2320', margin: '0 0 10px' }}>
              Get the good-news digest
            </h2>
            <p style={{ fontSize: '15px', color: '#6b5d56', margin: '0 auto 28px', maxWidth: '440px' }}>
              One warm email a month — meals rescued, stories from the field, and drives near you. No spam.
            </p>

            {subscribed ? (
              <div style={{ background: '#dcfce7', color: '#15803d', padding: '14px 24px', borderRadius: '100px', display: 'inline-block', fontSize: '14px', fontWeight: 700 }}>
                🎉 You're on the list! Thank you for reading community stories.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', justifyContent: 'center', gap: '10px', maxWidth: '480px', margin: '0 auto', flexWrap: 'wrap' }}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    padding: '12px 20px',
                    borderRadius: '100px',
                    border: '1.5px solid #ffc7b6',
                    fontSize: '14px',
                    outlineColor: 'var(--brand-primary)'
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary-hover"
                  style={{
                    background: 'var(--brand-primary)',
                    color: '#ffffff',
                    border: 0,
                    padding: '12px 26px',
                    borderRadius: '100px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(var(--brand-primary-rgb), 0.3)'
                  }}
                >
                  Subscribe
                </button>
              </form>
            )}

          </div>

        </div>
      </section>

      {/* ========================================================
          7. 4-COLUMN FOOTER (From Figma Node 8:29703)
      ======================================================== */}
      <footer style={{ background: '#fdf1e9', borderTop: '1px solid var(--brand-soft)', padding: '70px 24px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '48px', marginBottom: '60px' }}>
            
            {/* Col 1: Brand Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--brand-primary-light) 0%, var(--brand-primary-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}>
                  🍲
                </div>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2c2320' }}>
                  ShareMeal
                </span>
              </div>
              <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#6b5d56', margin: '0 0 20px' }}>
                A community food-sharing network on a mission to end avoidable food waste — one shared meal at a time.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {['🕊️', '📘', '📸'].map((icon, idx) => (
                  <div key={idx} className="footer-social-btn" style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'pointer', border: '1px solid #eee5e0' }}>
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

            {/* Col 4: Support */}
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

    </div>
  );
};

export default Stories;
