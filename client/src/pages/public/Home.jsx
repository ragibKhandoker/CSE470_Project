import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDisplayMode } from '../../context/DisplayModeContext';
import { API_BASE_URL } from '../../utils/constants';
import PartnersTicker from '../../components/home/PartnersTicker';
import TrendingFoodSection from '../../components/home/TrendingFoodSection';
import ImpactStatsSection from '../../components/home/ImpactStatsSection';
import HomeStoriesSection from '../../components/home/HomeStoriesSection';
import './Home.css';

export const Home = () => {
  const { user, logout } = useAuth();
  const { colorScheme, toggleColorScheme } = useDisplayMode();
  const navigate = useNavigate();

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState(0);

  // Newsletter state
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Anonymous Mode interactive demo toggle in dark card
  const [demoAnonymous, setDemoAnonymous] = useState(true);
  const colorSchemeLabels = {
    navy: 'Navy & white',
    orange: 'Orange & white',
    'navy-green': 'Navy green & white'
  };
  const colorSchemeLabel = colorSchemeLabels[colorScheme];

  // FAQ Data from Figma
  const faqs = [
    {
      q: 'Is the food safe to share?',
      a: 'Every donor sets an expiry window and food type, and verified NGOs perform rapid temperature and condition checks upon collection. All food safety guidelines comply with national food safety standards.'
    },
    {
      q: 'What does Anonymous Mode do?',
      a: 'Anonymous Mode completely masks your name and contact details on public food requests and listings. Donors and community partners see you as "Anonymous Receiver #RX" while maintaining full cryptographic security in our database.'
    },
    {
      q: 'Does it cost anything?',
      a: 'ShareMeal is 100% free for both individuals seeking meals and community partners. Donors contribute surplus food at no charge, and verified NGOs coordinate pickups at zero cost to receivers.'
    },
    {
      q: 'How do you verify NGOs?',
      a: 'NGOs submit government registration documentation and trade licenses during sign-up. Our Super Admin team manually inspects each organization before approving distribution privileges on the network.'
    }
  ];


  // Dynamic Home Page Data loaded from PostgreSQL Database
  const [homeData, setHomeData] = useState({
    trendingPosts: [],
    impactStats: [],
    heroMealsCount: '482,000+ meals rescued & counting',
    partners: []
  });
  const [loadingHomeData, setLoadingHomeData] = useState(true);

  // Dynamic Stories from DB
  const [stories, setStories] = useState([]);
  const [storiesLoading, setStoriesLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch live DB home data (posts, stats, partners)
    fetch(`${API_BASE_URL}/public/home-data`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setHomeData({
            trendingPosts: data.trendingPosts || [],
            impactStats: data.impactStats || [],
            heroMealsCount: data.heroMealsCount ? `${data.heroMealsCount} meals rescued & counting` : '482,000+ meals rescued & counting',
            partners: data.partners || []
          });
        }
      })
      .catch(err => console.error('Error fetching home data from DB:', err))
      .finally(() => setLoadingHomeData(false));

    // 2. Fetch live DB stories
    fetch(`${API_BASE_URL}/stories`)
      .then(res => res.json())
      .then(data => {
        if (data && data.stories && data.stories.length > 0) {
          const mapped = data.stories.slice(0, 3).map(s => ({
            id: s.id,
            slug: s.slug,
            tag: s.category || 'Story',
            tagColor: s.tag_color || 'var(--brand-primary-deep)',
            tagBg: s.tag_bg || 'var(--brand-soft)',
            readTime: s.read_time || '4 min read',
            title: s.title,
            image: s.image || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80'
          }));
          setStories(mapped);
        }
      })
      .catch(err => console.error('Error fetching stories:', err))
      .finally(() => setStoriesLoading(false));
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
    }
  };


  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#2c2320', fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: 'hidden' }}>
      
      {/* ========================================================
          1. NAVIGATION BAR (From Figma Node 8:22362)
      ======================================================== */}
      <nav style={{ width: '100%', background: 'rgba(255, 249, 245, 0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 1000, borderBottom: '1px solid rgba(44, 35, 32, 0.06)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Brand Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--brand-primary-light) 0%, var(--brand-primary-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px', boxShadow: '0 4px 12px rgba(var(--brand-primary-dark-rgb), 0.35)' }}>
              🍲
            </div>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', letterSpacing: '-0.5px' }}>
              ShareMeal
            </span>
          </Link>

          {/* Center Nav Links */}
          <div className="nav-desktop-links">
            <a href="#how-it-works" className="nav-link-item" style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '14px', fontWeight: 600 }}>
              How it works
            </a>
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

          {/* Right Action Buttons (Desktop / Tablet) */}
          <div className="nav-desktop-actions">
            <button
              type="button"
              onClick={toggleColorScheme}
              aria-label={`Switch color scheme. Current scheme: ${colorSchemeLabel}`}
              style={{
                background: '#ffffff',
                border: '1px solid var(--brand-primary)',
                borderRadius: '100px',
                padding: '9px 14px',
                color: 'var(--brand-primary)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              ◐ {colorSchemeLabel} · change
            </button>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link
                  to={user.role === 'super_admin' ? '/super-admin/dashboard' : `/${user.role}/dashboard`}
                  style={{ textDecoration: 'none', background: 'var(--brand-soft)', color: 'var(--brand-primary-deep)', padding: '8px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: 700 }}
                >
                  Dashboard ({user.name?.split(' ')[0]})
                </Link>
                <button
                  onClick={logout}
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
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '4px 0' }}
            >
              How it works
            </a>
            <Link
              to="/find-food"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '4px 0' }}
            >
              Find food
            </Link>
            <Link
              to={user ? (user.role === 'donor' ? '/donor/profile' : `/${user.role}/dashboard`) : '/donate'}
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '4px 0' }}
            >
              Donate
            </Link>
            <Link
              to="/stories"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: 'var(--brand-primary-dark)', fontSize: '15px', fontWeight: 700, padding: '4px 0' }}
            >
              Stories
            </Link>
            <div style={{ height: '1px', background: 'rgba(44, 35, 32, 0.08)', margin: '6px 0' }} />
            <button
              type="button"
              onClick={toggleColorScheme}
              aria-label={`Switch color scheme. Current scheme: ${colorSchemeLabel}`}
              style={{
                background: '#ffffff',
                border: '1px solid var(--brand-primary)',
                borderRadius: '100px',
                padding: '10px 14px',
                color: 'var(--brand-primary)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ◐ {colorSchemeLabel}
            </button>
            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  to={user.role === 'super_admin' ? '/super-admin/dashboard' : `/${user.role}/dashboard`}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ textDecoration: 'none', background: 'var(--brand-soft)', color: 'var(--brand-primary-deep)', padding: '10px 16px', borderRadius: '100px', fontSize: '14px', fontWeight: 700, textAlign: 'center' }}
                >
                  Dashboard ({user.name?.split(' ')[0]})
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
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
          2. HERO SECTION (From Figma Node 8:22390)
      ======================================================== */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '60px 24px 80px' }}>
        
        {/* Ambient Glow Orbs */}
        <div style={{ position: 'absolute', top: '-60px', left: '-100px', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(255, 199, 182, 0.45)', filter: 'blur(70px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '100px', right: '-80px', width: '380px', height: '380px', borderRadius: '50%', background: 'rgba(255, 242, 214, 0.65)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20px', left: '40%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(227, 245, 234, 0.55)', filter: 'blur(75px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '48px', alignItems: 'center', position: 'relative', zIndex: 10 }}>
          
          {/* Left Column: Copy & CTAs */}
          <div>
            
            {/* Pill Chip */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--brand-soft)', padding: '6px 14px', borderRadius: '100px', marginBottom: '20px' }}>
              <span style={{ fontSize: '13px' }}>✨</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary-deep)', letterSpacing: '0.2px' }}>
                {homeData.heroMealsCount || '482,000+ meals rescued & counting'}
              </span>
            </div>

            {/* Main Editorial Headline with Curved Underline */}
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(40px, 5vw, 62px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-1.5px', margin: '0 0 24px', color: '#2c2320' }}>
              Turn today's surplus into{' '}
              <span style={{ position: 'relative', display: 'inline-block', color: 'var(--brand-primary-dark)' }}>
                someone's meal
              </span>
            </h1>

            <p style={{ fontSize: '18px', lineHeight: 1.6, color: '#6b5d56', margin: '0 0 32px', maxWidth: '480px' }}>
              ShareMeal connects restaurants, homes and events with nearby NGOs and neighbours — so good food finds a plate instead of a bin.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
              <Link
                to={user ? (user.role === 'donor' ? '/donor/profile' : `/${user.role}/dashboard`) : '/donate'}
                className="btn-primary-hover"
                style={{
                  textDecoration: 'none',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: '100px',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 12px 28px rgba(var(--brand-primary-rgb), 0.4)'
                }}
              >
                <span>🎁</span> Donate food
              </Link>
              <Link
                to="/find-food"
                className="btn-secondary-hover"
                style={{
                  textDecoration: 'none',
                  background: 'rgba(255, 255, 255, 0.7)',
                  color: 'var(--brand-primary-deep)',
                  border: '1.5px solid #ffa286',
                  padding: '14px 28px',
                  borderRadius: '100px',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🔍</span> Find a meal
              </Link>
            </div>

            {/* NGO Community Trust Avatars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {['var(--brand-primary-light)', '#f5c14e', '#5ec98f', '#6aa6ee'].map((bg, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: bg,
                      border: '2px solid #f8fafc',
                      marginLeft: idx > 0 ? '-10px' : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800
                    }}
                  >
                    👤
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b5d56' }}>
                <strong style={{ color: '#2c2320', fontWeight: 800 }}>1,340 NGOs</strong> collecting daily across 60 cities
              </p>
            </div>

          </div>

          {/* Right Column: Hero Image with Floating Glassmorphic Badges */}
          <div className="hero-visual" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            
            {/* Main Picture Frame */}
            <div
              className="hero-image-frame"
              style={{
                width: '100%',
                maxWidth: '460px',
                height: '430px',
                borderRadius: '32px',
                background: '#ffe9e2',
                border: '5px solid #ffffff',
                boxShadow: '0 20px 50px -10px rgba(var(--brand-primary-rgb), 0.25), 0 40px 90px -30px rgba(44, 35, 32, 0.2)'
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1200&q=80"
                alt="Fresh prepared meal boxes ready to share"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Top-Left Floating Glass Card: "Live now • 3,235 posts" */}
            <div
              className="floating-badge"
              style={{
                position: 'absolute',
                top: '28px',
                left: '-20px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                padding: '14px 18px',
                borderRadius: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 16px 36px rgba(44, 35, 32, 0.12)'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'linear-gradient(145deg, #5ec98f 0%, #2f9c66 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '20px',
                  boxShadow: '0 8px 16px rgba(47, 156, 102, 0.35)'
                }}
              >
                🛡️
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#6b5d56', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Live now
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 800, color: '#2c2320' }}>
                  3,235 posts
                </div>
              </div>
            </div>

            {/* Bottom-Right Floating Glass Card: "Meal #4821 • Received • Delivered to Asha Shelter" */}
            <div
              className="floating-badge"
              style={{
                position: 'absolute',
                bottom: '-20px',
                right: '-10px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                padding: '16px 20px',
                borderRadius: '18px',
                boxShadow: '0 16px 40px rgba(44, 35, 32, 0.12)',
                minWidth: '220px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#2c2320' }}>Meal #4821</span>
                <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="pulse-green-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }}></span> Received
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#6b5d56', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span>🚲</span> Delivered to Asha Shelter
              </div>
              {/* Mini progress bar */}
              <div style={{ width: '100%', height: '5px', background: '#f3f4f6', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)' }}></div>
              </div>
            </div>

          </div>


        </div>
      </section>

      {/* ========================================================
          3. CATEGORIES BAR (From Figma Node 8:22482)
      ======================================================== */}
      <section style={{ padding: '0 24px 60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
          
          {[
            { title: 'Cooked Meals', count: '1,240 live', icon: '🍲', iconBg: '#ffedd5', border: '#fed7aa', link: '/find-food?type=Cooked' },
            { title: 'Fresh Produce', count: '860 live', icon: '🥬', iconBg: '#dcfce7', border: '#bbf7d0', link: '/find-food?type=Veg' },
            { title: 'Bakery & Bread', count: '430 live', icon: '🥖', iconBg: '#fef3c7', border: '#fde68a', link: '/find-food?type=Bakery' },
            { title: 'Packaged Goods', count: '705 live', icon: '🥫', iconBg: '#e0f2fe', border: '#bae6fd', link: '/find-food?type=Packaged' }
          ].map((cat, idx) => (
            <Link
              key={idx}
              to={cat.link}
              className="category-card"
              style={{
                textDecoration: 'none',
                background: '#ffffff',
                border: `1px solid ${cat.border}`,
                borderRadius: '20px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                boxShadow: '0 4px 16px rgba(44, 35, 32, 0.04)'
              }}
            >
              <div className="cat-icon" style={{ width: '52px', height: '52px', borderRadius: '16px', background: cat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                {cat.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320', marginBottom: '2px' }}>
                  {cat.title}
                </div>
                <div style={{ fontSize: '13px', color: '#6b5d56' }}>
                  {cat.count}
                </div>
              </div>
              <span className="cat-arrow" style={{ color: 'var(--brand-primary)', fontSize: '18px', fontWeight: 800, display: 'inline-block' }}>→</span>
            </Link>
          ))}

        </div>
      </section>

      {/* ========================================================
          4. PARTNER LOGO TICKER (From Figma Node 8:22560)
      ======================================================== */}
      <PartnersTicker partners={homeData.partners} />

      {/* ========================================================
          5. HOW IT WORKS / 4 STEPS (From Figma Node 8:22711)
      ======================================================== */}
      <section id="how-it-works" style={{ padding: '90px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary-dark)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '10px' }}>
              <span style={{ width: '24px', height: '2px', background: 'var(--brand-primary-dark)' }}></span> HOW IT WORKS
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, color: '#2c2320', margin: 0, letterSpacing: '-1px' }}>
              From surplus to shared in four gentle steps
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '24px' }}>
            
            {[
              { num: '1', title: 'Post surplus', text: 'Snap a photo, set quantity and pickup window. Live in under 60 seconds.', icon: '📸', color: '#ffedd5', badgeColor: '#c2410c' },
              { num: '2', title: 'Get matched', text: 'Nearby verified NGOs and receivers are notified through smart radius alerts.', icon: '🔔', color: '#fef3c7', badgeColor: '#b45309' },
              { num: '3', title: 'Collect safely', text: 'A volunteer picks it up or routes it to a safe neighborhood collection point.', icon: '🛡️', color: '#dcfce7', badgeColor: '#15803d' },
              { num: '4', title: 'Someone eats', text: 'Track every meal to its plate with proof of receipt and community impact.', icon: '🍲', color: '#e0f2fe', badgeColor: '#0369a1' }
            ].map((step, idx) => (
              <div
                key={idx}
                className="step-card"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(44, 35, 32, 0.06)',
                  borderRadius: '24px',
                  padding: '30px 24px',
                  position: 'relative',
                  boxShadow: '0 8px 24px rgba(44, 35, 32, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div className="step-icon-tile" style={{ width: '52px', height: '52px', borderRadius: '16px', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      {step.icon}
                    </div>
                    <span className="step-number" style={{ fontFamily: "'Fraunces', serif", fontSize: '36px', fontWeight: 800, color: '#f1e8e2' }}>
                      {step.num}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#2c2320', margin: '0 0 10px' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#6b5d56', margin: 0 }}>
                    {step.text}
                  </p>
                </div>
              </div>
            ))}

          </div>

        </div>
      </section>


      {/* ========================================================
          6. TRENDING FOOD POSTS (From Figma Node 8:22782)
      ======================================================== */}
      <TrendingFoodSection posts={homeData.trendingPosts} loading={loadingHomeData} />

      {/* ========================================================
          7. ANONYMOUS RECEIVER SPOTLIGHT (From Figma Node 8:22899)
      ======================================================== */}
      <section style={{ padding: '60px 24px 90px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div
            style={{
              background: '#1d1917',
              borderRadius: '32px',
              padding: 'clamp(32px, 6vw, 64px)',
              color: '#ffffff',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '48px',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)'
            }}
          >
            {/* Ambient Background Glows */}
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(var(--brand-primary-dark-rgb), 0.2)', filter: 'blur(70px)' }} />
            <div style={{ position: 'absolute', bottom: '-60px', left: '10%', width: '260px', height: '260px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', filter: 'blur(70px)' }} />

            {/* Left Column: Copy & Checklist */}
            <div style={{ position: 'relative', zIndex: 5 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)', padding: '6px 14px', borderRadius: '100px', fontSize: '12px', fontWeight: 700, color: '#fba58f', marginBottom: '18px' }}>
                <span>🔒</span> 100% PRIVATE OPTION
              </div>

              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, lineHeight: 1.15, margin: '0 0 20px', letterSpacing: '-1px' }}>
                Find a meal with <span style={{ color: 'var(--brand-primary-dark)' }}>no judgment, no trace</span>
              </h2>

              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#a89d97', margin: '0 0 32px', maxWidth: '440px' }}>
                Anonymous Mode hides your name from donors and NGOs. Pick up food with a private secure 6-digit code without ever revealing who you are.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: '14px' }}>
                {[
                  'Name stays hidden',
                  'Verified for safety',
                  'Turn on/off anytime',
                  'Encrypted database'
                ].map((perk, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: '#e5ded9' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(var(--brand-primary-dark-rgb), 0.25)', color: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>
                      ✓
                    </span>
                    {perk}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Interactive Anonymous Card Simulation */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 5 }}>
              <div
                className="anonymous-showcase-card"
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '24px',
                  padding: '24px',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.4)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--brand-primary-light) 0%, var(--brand-primary-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      🕵️
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>Verified Receiver</div>
                      <div style={{ fontSize: '12px', color: '#9c8e87' }}>#RX-2048</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '20px' }}>🛡️</span>
                </div>

                {/* Simulated Mode Box */}
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#9c8e87', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                    Identity Status
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: demoAnonymous ? '#34d399' : '#ffffff' }}>
                      {demoAnonymous ? '🕵️ Anonymous Mode Enabled' : 'Public Profile'}
                    </span>
                    {/* Toggle Button */}
                    <button
                      onClick={() => setDemoAnonymous(!demoAnonymous)}
                      style={{
                        width: '48px',
                        height: '26px',
                        borderRadius: '100px',
                        background: demoAnonymous ? 'var(--brand-primary)' : '#4b5563',
                        border: 0,
                        padding: '3px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: demoAnonymous ? 'flex-end' : 'flex-start',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ffffff', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }} />
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: '12px', color: '#a89d97' }}>
                  🔒 Your identity is safe with us. End-to-end encrypted.
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ========================================================
          9. STATS BANNER / PROOF OF IMPACT (From Figma Node 8:23030)
      ======================================================== */}
      <ImpactStatsSection stats={homeData.impactStats} />

      {/* ========================================================
          10. LATEST STORIES (From Figma Node 8:23083)
      ======================================================== */}
      <HomeStoriesSection stories={stories} loading={storiesLoading} />

      {/* ========================================================
          11. FAQ ACCORDION (From Figma Node 8:23137)
      ======================================================== */}
      <section style={{ padding: '0 24px 90px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '48px' }}>
          
          {/* Left Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary-dark)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px' }}>
              <span style={{ width: '24px', height: '2px', background: 'var(--brand-primary-dark)' }}></span> GOOD TO KNOW
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, color: '#2c2320', margin: '0 0 16px', letterSpacing: '-1px' }}>
              Questions, answered
            </h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#6b5d56', margin: '0 0 24px', maxWidth: '380px' }}>
              Still wondering about something? Our support team and community champions reply promptly.
            </p>
            <a href="mailto:support@sharemeal.org" style={{ textDecoration: 'none', color: 'var(--brand-primary-dark)', fontWeight: 700, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              Visit the help centre <span>→</span>
            </a>
          </div>

          {/* Right Column: Accordion Items */}
          <div style={{ display: 'grid', gap: '14px' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="faq-item"
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(44, 35, 32, 0.08)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(44, 35, 32, 0.02)'
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    background: 'transparent',
                    border: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320' }}>
                    {faq.q}
                  </span>
                  <span className="faq-badge" style={{ width: '28px', height: '28px', borderRadius: '50%', background: openFaq === idx ? 'var(--brand-soft)' : '#f3f4f6', color: openFaq === idx ? 'var(--brand-primary-deep)' : '#6b5d56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold' }}>
                    {openFaq === idx ? '−' : '+'}
                  </span>
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 24px 20px', fontSize: '14px', lineHeight: 1.6, color: '#6b5d56', borderTop: '1px solid #f7f3f0' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          12. DUAL CTA SECTION (From Figma Node 8:23189)
      ======================================================== */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
          
          {/* Card 1: Give Food */}
          <div
            className="dual-cta-card"
            style={{
              background: '#ffffff',
              border: '1.5px solid #fed7aa',
              borderRadius: '28px',
              padding: '36px',
              boxShadow: '0 8px 24px rgba(var(--brand-primary-dark-rgb), 0.06)'
            }}
          >
            <div className="cta-icon" style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '20px' }}>
              🎁
            </div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 800, color: '#2c2320', margin: '0 0 10px' }}>
              I have food to give
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#6b5d56', margin: '0 0 24px' }}>
              Post surplus from your kitchen, restaurant or event. Local verified groups pick it up fast.
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
                gap: '8px',
                border: '1px solid transparent'
              }}
            >
              Become a donor <span>→</span>
            </Link>
          </div>

          {/* Card 2: Need Food */}
          <div
            className="dual-cta-card"
            style={{
              background: '#ffffff',
              border: '1.5px solid #bbf7d0',
              borderRadius: '28px',
              padding: '36px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.06)'
            }}
          >
            <div className="cta-icon" style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '20px' }}>
              🍲
            </div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '24px', fontWeight: 800, color: '#2c2320', margin: '0 0 10px' }}>
              I need a meal
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#6b5d56', margin: '0 0 24px' }}>
              Find verified food nearby — publicly or fully anonymous. Free, confidential and reliable.
            </p>
            <Link
              to="/find-food"
              className="btn-primary-hover"
              style={{
                textDecoration: 'none',
                background: '#15803d',
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
          13. NEWSLETTER / DIGEST (From Figma Node 8:23227)
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
            <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: '#fff0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 18px' }}>
              💌
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, color: '#2c2320', margin: '0 0 10px' }}>
              Get the good-news digest
            </h2>
            <p style={{ fontSize: '15px', color: '#6b5d56', margin: '0 auto 28px', maxWidth: '440px' }}>
              One warm email a month — meals rescued, stories from neighbours, and new collection hubs near you.
            </p>

            {subscribed ? (
              <div style={{ background: '#dcfce7', color: '#15803d', padding: '14px 24px', borderRadius: '100px', display: 'inline-block', fontSize: '14px', fontWeight: 700 }}>
                🎉 You're on the list! Thank you for supporting the movement.
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
                    border: '1.5px solid #e5ded9',
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
          14. FOOTER (From Figma Node 8:23245)
      ======================================================== */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid #eee5e0', padding: '70px 24px 40px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '48px', marginBottom: '60px' }}>
            
            {/* Col 1: Brand Info */}
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--brand-primary-light) 0%, var(--brand-primary-dark) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '18px' }}>
                  🍲
                </div>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2c2320' }}>
                  ShareMeal
                </span>
              </div>
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
                <li><a href="#how-it-works" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>How it works</a></li>
              </ul>
            </div>

            {/* Col 3: Company */}
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#2c2320', textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 16px' }}>
                Company
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px', fontSize: '13px', color: '#6b5d56' }}>
                <li><a href="#how-it-works" className="footer-link" style={{ textDecoration: 'none', color: 'inherit' }}>About us</a></li>
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

export default Home;
