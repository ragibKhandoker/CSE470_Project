import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { allStories, getStoryById } from '../../data/storiesData';
import { API_BASE_URL } from '../../utils/constants';
import './Home.css';

export const StoryDetail = () => {
  const { user, logout } = useAuth();
  const { id } = useParams();

  // Load current story based on URL param with API sync and fallback
  const fallbackStory = getStoryById(id);
  const [story, setStory] = useState(fallbackStory);
  const [loading, setLoading] = useState(!fallbackStory);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(!fallbackStory);
    setNotFound(false);

    fetch(`${API_BASE_URL}/stories/${id}`)
      .then(res => {
        if (!res.ok) {
          if (!fallbackStory) setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (!isMounted) return;
        if (data && data.story) {
          const s = data.story;
          // Update URL in browser if accessed by numeric ID or alias so the blog slug is displayed
          if (s.slug && id !== s.slug) {
            window.history.replaceState(null, '', `/stories/${s.slug}`);
          }
          const parasBefore = Array.isArray(s.paragraphs_before_quote) && s.paragraphs_before_quote.length > 0
            ? s.paragraphs_before_quote
            : (s.content ? s.content.split('\n\n').slice(0, 2) : (fallbackStory?.paragraphsBeforeQuote || []));

          setStory({
            id: s.id,
            slug: s.slug,
            title: s.title,
            summary: s.summary || fallbackStory?.summary || '',
            bannerImage: s.banner_image || s.image || fallbackStory?.bannerImage || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1600&q=80',
            cardImage: s.image || fallbackStory?.cardImage || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80',
            image: s.image || fallbackStory?.image || 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80',
            tagBg: s.tag_bg || fallbackStory?.tagBg || 'var(--brand-soft)',
            tagColor: s.tag_color || fallbackStory?.tagColor || 'var(--brand-primary-deep)',
            tagIcon: s.tag_icon || fallbackStory?.tagIcon || '🤝',
            category: s.category || fallbackStory?.category || 'Story',
            readTime: s.read_time || fallbackStory?.readTime || '4 min read',
            author: s.author || fallbackStory?.author || 'ShareMeal Contributor',
            authorRole: s.author_role || fallbackStory?.authorRole || 'Community Contributor',
            authorAvatar: s.author_avatar || fallbackStory?.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.author || 'ShareMeal')}&background=ff6b4a&color=fff`,
            date: s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (fallbackStory?.date || 'Recently'),
            initialLikes: fallbackStory?.initialLikes || 52,
            paragraphsBeforeQuote: parasBefore,
            quote: s.quote || (fallbackStory ? fallbackStory.quote : ''),
            contentHtml: s.content_html || '',
            paragraphsAfterQuote: !s.content_html && s.content ? s.content.split('\n\n').slice(2) : (fallbackStory?.paragraphsAfterQuote || [])
          });
          setNotFound(false);
        } else if (!fallbackStory) {
          setNotFound(true);
        }
      })
      .catch(() => {
        if (!fallbackStory) setNotFound(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [id]);

  // Mobile menu drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Like interaction state
  const [likes, setLikes] = useState(story?.initialLikes || 41);
  const [hasLiked, setHasLiked] = useState(false);

  // Share interaction state (Toast notification)
  const [showShareToast, setShowShareToast] = useState(false);

  // Newsletter state
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Reset likes and scroll to top when story changes
  useEffect(() => {
    if (story) {
      setLikes(story.initialLikes || 41);
      setHasLiked(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [id, story?.id]);

  const handleLike = () => {
    if (hasLiked) {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setShowShareToast(true);
    setTimeout(() => {
      setShowShareToast(false);
    }, 3000);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput('');
    }
  };

  // 2 related stories for the "More stories" section
  const moreStories = allStories.filter(s => s.id !== story?.id).slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#2c2320', fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: 'clip' }}>
      
      {/* ========================================================
          1. NAVIGATION BAR (Matching Home & Stories)
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

          {/* Center Nav Links (Desktop) */}
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
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: '#6b5d56', fontSize: '15px', fontWeight: 600, padding: '4px 0' }}
            >
              How it works
            </Link>
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

      {/* Loading State */}
      {loading && !story ? (
        <div style={{ maxWidth: '800px', margin: '100px auto', textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>🍲</div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#2c2320' }}>Loading story...</h2>
        </div>
      ) : notFound && !story ? (
        <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '48px 32px', background: '#ffffff', borderRadius: '24px', border: '1px solid rgba(44,35,32,0.08)', boxShadow: '0 8px 30px rgba(44,35,32,0.04)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📖</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#2c2320', marginBottom: '8px' }}>Story Not Found</h2>
          <p style={{ color: '#6b5d56', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            The story you are looking for may have been moved, updated, or does not exist.
          </p>
          <Link
            to="/stories"
            style={{
              display: 'inline-block',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: '100px',
              fontWeight: 700,
              fontSize: '13px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(var(--brand-primary-rgb), 0.35)'
            }}
          >
            ← Back to All Stories
          </Link>
        </div>
      ) : story && (
        <>
          {/* ========================================================
              2. HERO PHOTOGRAPHY BANNER (From Figma Node 8:29807)
          ======================================================== */}
          <section style={{ position: 'relative', width: '100%', height: 'clamp(320px, 42vw, 440px)', overflow: 'hidden', background: '#fdf1e9' }}>
            <img
              src={story.bannerImage || story.cardImage}
              alt={story.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

        {/* Ambient Gradient Overlay Fading into Warm Background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(to top, #f8fafc 0%, rgba(255, 249, 245, 0.85) 12%, rgba(255, 249, 245, 0.4) 30%, rgba(44, 35, 32, 0.35) 60%, rgba(44, 35, 32, 0.15) 100%)',
            pointerEvents: 'none'
          }}
        />

        {/* Tag Pill in Top Left of Hero Image */}
        <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: story.tagBg || '#f0e9fb',
              padding: '6px 14px',
              borderRadius: '100px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
            }}
          >
            <span style={{ fontSize: '13px' }}>{story.tagIcon || '🤝'}</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: story.tagColor || '#6b46c1' }}>
              {story.category}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. OVERLAPPING ARTICLE HEADER CARD (From Figma Node 8:29816)
      ======================================================== */}
      <div style={{ maxWidth: '720px', margin: '-72px auto 0', padding: '0 20px', position: 'relative', zIndex: 20 }}>
        
        {/* Floating White Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(8px)',
            borderRadius: '24px',
            padding: 'clamp(24px, 4vw, 36px)',
            border: '1px solid rgba(44, 35, 32, 0.08)',
            boxShadow: '0 10px 30px rgba(var(--brand-primary-rgb), 0.14), 0 24px 60px rgba(44, 35, 32, 0.1)'
          }}
        >
          {/* Main Fraunces Headline */}
          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(26px, 4vw, 38px)',
              fontWeight: 800,
              color: '#2c2320',
              lineHeight: 1.25,
              margin: '0 0 12px',
              letterSpacing: '-0.8px'
            }}
          >
            {story.title}
          </h1>

          {/* Subtitle */}
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#6b5d56', margin: '0 0 24px' }}>
            {story.summary}
          </p>

          {/* Author Metadata & Actions Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(44, 35, 32, 0.08)',
              paddingTop: '20px',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            {/* Author Avatar & Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={story.authorAvatar}
                alt={story.author}
                style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-soft)' }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2c2320' }}>
                  {story.author}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#6b5d56', marginTop: '2px' }}>
                  <span>📅 {story.date}</span>
                  <span>⏱️ {story.readTime}</span>
                </div>
              </div>
            </div>

            {/* Like & Share Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Like Button */}
              <button
                onClick={handleLike}
                aria-label="Like story"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: hasLiked ? 'var(--brand-soft)' : 'rgba(44, 35, 32, 0.05)',
                  border: hasLiked ? '1px solid var(--brand-primary)' : '1px solid transparent',
                  padding: '8px 16px',
                  borderRadius: '100px',
                  color: hasLiked ? 'var(--brand-primary-deep)' : '#6b5d56',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              >
                <span>{hasLiked ? '❤️' : '🤍'}</span>
                <span>{likes}</span>
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                aria-label="Share story"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(44, 35, 32, 0.05)',
                  border: '1px solid transparent',
                  padding: '8px 16px',
                  borderRadius: '100px',
                  color: '#6b5d56',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              >
                <span>🔗</span>
                <span>Share</span>
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Share Toast Notification */}
      {showShareToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#2c2320',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '100px',
            fontSize: '14px',
            fontWeight: 700,
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>✓</span> Link copied to clipboard!
        </div>
      )}

      {/* ========================================================
          4. ARTICLE BODY NARRATIVE (From Figma Node 8:29856)
      ======================================================== */}
      <article style={{ maxWidth: '680px', margin: '36px auto 0', padding: '0 20px' }}>
        
        {/* Typography styles for rich blog content */}
        <style>{`
          .story-rich-content h1, .story-narrative-paragraph h1 { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 800; color: #2c2320; margin: 32px 0 14px; line-height: 1.25; }
          .story-rich-content h2, .story-narrative-paragraph h2 { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 800; color: #2c2320; margin: 28px 0 12px; line-height: 1.3; }
          .story-rich-content h3, .story-narrative-paragraph h3 { font-family: 'Fraunces', serif; font-size: 21px; font-weight: 700; color: #2c2320; margin: 24px 0 10px; line-height: 1.35; }
          .story-rich-content h4, .story-narrative-paragraph h4 { font-size: 18px; font-weight: 700; color: #2c2320; margin: 20px 0 8px; }
          .story-rich-content h5, .story-narrative-paragraph h5 { font-size: 16px; font-weight: 700; color: #2c2320; margin: 18px 0 6px; }
          .story-rich-content h6, .story-narrative-paragraph h6 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #6b5d56; margin: 16px 0 6px; }
          .story-rich-content p, .story-narrative-paragraph p { font-size: 16px; line-height: 1.8; color: #2c2320; margin: 0 0 20px; }
          .story-rich-content a, .story-narrative-paragraph a { color: var(--brand-primary); text-decoration: underline; font-weight: 600; }
          .story-rich-content strong, .story-rich-content b, .story-narrative-paragraph strong, .story-narrative-paragraph b { font-weight: 700; color: #2c2320; }
          .story-rich-content em, .story-rich-content i, .story-narrative-paragraph em, .story-narrative-paragraph i { font-style: italic; }
          .story-rich-content u, .story-narrative-paragraph u { text-decoration: underline; }
        `}</style>

        {/* Paragraphs Before Quote */}
        {story.paragraphsBeforeQuote?.map((para, index) => (
          <div
            key={index}
            className="story-narrative-paragraph"
            style={{
              fontSize: '16px',
              lineHeight: 1.8,
              color: '#2c2320',
              margin: '0 0 20px'
            }}
            dangerouslySetInnerHTML={{ __html: para }}
          />
        ))}

        {/* Highlight Pullquote Card */}
        {story.quote && (
          <div
            style={{
              position: 'relative',
              background: '#ffffff',
              borderLeft: '4px solid var(--brand-primary-light)',
              borderRadius: '18px',
              padding: '24px 28px 24px 36px',
              margin: '36px 0',
              boxShadow: '0 4px 12px rgba(44, 35, 32, 0.04), 0 16px 36px rgba(var(--brand-primary-rgb), 0.12)'
            }}
          >
            {/* Large Decorative Quote Glyph */}
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                left: '12px',
                fontFamily: "'Fraunces', serif",
                fontSize: '52px',
                fontWeight: 800,
                color: '#ffc7b6',
                lineHeight: 1,
                pointerEvents: 'none',
                userSelect: 'none'
              }}
            >
              “
            </div>

            <p
              style={{
                fontFamily: "'Fraunces', serif",
                fontStyle: 'italic',
                fontWeight: 600,
                fontSize: '18px',
                lineHeight: 1.55,
                color: '#2c2320',
                margin: 0
              }}
            >
              "{story.quote}"
            </p>
          </div>
        )}

        {/* Content Below Quote: RichText Content */}
        {story.contentHtml ? (
          <div
            className="story-rich-content"
            style={{
              fontSize: '16px',
              lineHeight: 1.8,
              color: '#2c2320'
            }}
            dangerouslySetInnerHTML={{ __html: story.contentHtml }}
          />
        ) : (
          <>
            {/* Subheading fallback */}
            {story.subheading && (
              <h2
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#2c2320',
                  margin: '36px 0 14px',
                  lineHeight: 1.3
                }}
              >
                {story.subheading}
              </h2>
            )}

            {/* Paragraphs After Quote fallback */}
            {story.paragraphsAfterQuote?.map((para, index) => (
              <div
                key={index}
                className="story-narrative-paragraph"
                style={{
                  fontSize: '16px',
                  lineHeight: 1.8,
                  color: '#2c2320',
                  margin: '0 0 20px'
                }}
                dangerouslySetInnerHTML={{ __html: para }}
              />
            ))}
          </>
        )}

        {/* Bottom Author Signoff & Interaction Bar */}
        <div
          style={{
            borderTop: '1px solid rgba(44, 35, 32, 0.08)',
            padding: '28px 0',
            marginTop: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={story.authorAvatar}
              alt={story.author}
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#2c2320' }}>
                {story.author}
              </div>
              <div style={{ fontSize: '12px', color: '#6b5d56' }}>
                {story.authorRole || 'ShareMeal contributor'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLike}
            style={{
              background: hasLiked ? 'var(--brand-soft)' : '#ffffff',
              border: hasLiked ? '1px solid var(--brand-primary)' : '1px solid rgba(44, 35, 32, 0.12)',
              borderRadius: '100px',
              padding: '8px 20px',
              fontSize: '14px',
              fontWeight: 700,
              color: hasLiked ? 'var(--brand-primary-deep)' : '#6b5d56',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.25s ease'
            }}
          >
            <span>{hasLiked ? '❤️' : '🤍'}</span>
            <span>{hasLiked ? 'Liked' : 'Like this story'}</span>
          </button>
        </div>

        {/* ========================================================
            5. MORE STORIES SECTION (From Figma Node 8:29886)
        ======================================================== */}
        <div style={{ paddingTop: '56px', paddingBottom: '60px' }}>
          <h3
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: '24px',
              fontWeight: 800,
              color: '#2c2320',
              margin: '0 0 24px'
            }}
          >
            More stories
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}
          >
            {moreStories.map(s => (
              <Link
                key={s.id}
                to={`/stories/${s.slug || s.id}`}
                className="story-card"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  background: '#ffffff',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  border: '1px solid rgba(44, 35, 32, 0.06)',
                  boxShadow: '0 6px 20px rgba(44, 35, 32, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ height: '150px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={s.cardImage}
                      alt={s.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', background: s.tagBg, color: s.tagColor, padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{s.tagIcon}</span> {s.category}
                    </div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <h4
                      style={{
                        fontFamily: "'Fraunces', serif",
                        fontSize: '16px',
                        fontWeight: 800,
                        color: '#2c2320',
                        lineHeight: 1.4,
                        margin: '0 0 10px'
                      }}
                    >
                      {s.title}
                    </h4>
                  </div>
                </div>

                <div style={{ padding: '0 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#6b5d56' }}>
                  <span>⏱️ {s.readTime}</span>
                  <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>Read →</span>
                </div>
              </Link>
            ))}
          </div>

          {/* All Stories Button */}
          <Link
            to="/stories"
            className="btn-secondary-hover"
            style={{
              textDecoration: 'none',
              background: '#ffffff',
              border: '1.5px solid #ffc7b6',
              color: 'var(--brand-primary-deep)',
              padding: '10px 22px',
              borderRadius: '100px',
              fontSize: '14px',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>←</span> All stories
          </Link>
        </div>

      </article>

      {/* ========================================================
          6. DUAL CTA SECTION (From Figma Node 8:29914)
      ======================================================== */}
      <section style={{ padding: '0 24px 80px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px' }}>
          
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
          7. NEWSLETTER / DIGEST (From Figma Node 8:29952)
      ======================================================== */}
      <section style={{ padding: '0 24px 90px' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
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
        </>
      )}

      {/* ========================================================
          8. 4-COLUMN FOOTER (From Figma Node 8:29970)
      ======================================================== */}
      <footer style={{ background: '#fdf1e9', borderTop: '1px solid var(--brand-soft)', padding: '70px 24px 40px' }}>
        <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
          
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
                Support
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

export default StoryDetail;
