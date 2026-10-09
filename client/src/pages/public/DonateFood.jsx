import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';

export const DonateFood = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If user is registered and logged in, direct take him to his profile
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'donor') {
        navigate('/donor/profile');
      } else {
        navigate(`/${user.role}/dashboard`);
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🍲</div>
          <div style={{ color: '#6b5d56', fontWeight: 600, fontSize: '15px' }}>Loading ShareMeal...</div>
        </div>
      </div>
    );
  }

  // If NOT registered / logged in: Ask for signup as a donor
  return (
    <div style={{ minHeight: '100%', background: '#f8fafc', color: '#2c2320', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>

      <Navbar />

      <main style={{ flex: 1, padding: '40px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient Glows */}
        <div style={{ position: 'absolute', top: '-40px', left: '-60px', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(255, 180, 160, 0.35)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '100px', right: '-40px', width: '380px', height: '380px', borderRadius: '50%', background: 'rgba(255, 230, 180, 0.45)', filter: 'blur(90px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '820px', margin: '0 auto', position: 'relative', zIndex: 5, textAlign: 'center' }}>
          
          {/* Top Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--brand-soft)', color: 'var(--brand-primary-deep)', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '20px' }}>
            <span>🎁</span> DONOR COMMUNITY
          </div>

          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: '#2c2320', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.15 }}>
            Donate surplus food, <br /><span style={{ color: 'var(--brand-primary-dark)' }}>nourish your community</span>
          </h1>

          <p style={{ fontSize: '17px', lineHeight: 1.6, color: '#6b5d56', maxWidth: '580px', margin: '0 auto 40px' }}>
            Connect with local verified NGOs and volunteer networks. Put surplus meals from your restaurant, grocery, or kitchen into hungry hands instead of the landfill.
          </p>

          {/* Registration Prompt Card */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '28px',
              padding: 'clamp(32px, 5vw, 48px)',
              border: '1.5px solid #fed7aa',
              boxShadow: '0 20px 50px rgba(var(--brand-primary-dark-rgb), 0.08)',
              marginBottom: '48px',
              textAlign: 'center'
            }}
          >
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px', boxShadow: '0 8px 20px rgba(var(--brand-primary-dark-rgb), 0.15)' }}>
              🍲
            </div>

            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 800, color: '#2c2320', margin: '0 0 10px' }}>
              Sign up as a Donor to get started
            </h2>

            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#6b5d56', maxWidth: '480px', margin: '0 auto 32px' }}>
              Please create a free Donor profile to list surplus food, schedule safe pickups, and view your verified impact history.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
              <Link
                to="/signup?role=donor&step=2"
                style={{
                  textDecoration: 'none',
                  background: 'var(--brand-primary)',
                  color: '#ffffff',
                  padding: '14px 32px',
                  borderRadius: '100px',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 12px 28px rgba(var(--brand-primary-rgb), 0.35)',
                  transition: 'transform 0.2s ease, background 0.2s ease'
                }}
              >
                <span>✨</span> Sign up to Donate <span>→</span>
              </Link>

              <Link
                to="/login?redirect=/donor/profile"
                style={{
                  textDecoration: 'none',
                  background: '#ffffff',
                  color: '#2c2320',
                  border: '1.5px solid #e5ded9',
                  padding: '14px 28px',
                  borderRadius: '100px',
                  fontSize: '15px',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Already registered? Log in
              </Link>
            </div>

            <div style={{ fontSize: '13px', color: '#8c7e77' }}>
              Free forever for donors · Takes less than 60 seconds
            </div>
          </div>

          {/* Three Perks of Donating */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', textAlign: 'left' }}>
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid rgba(44, 35, 32, 0.06)' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>⚡</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320', margin: '0 0 6px' }}>Instant 60s Posting</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#6b5d56', margin: 0 }}>
                Snap a photo, enter portion count, and set your pickup window right from your phone.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid rgba(44, 35, 32, 0.06)' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>🛡️</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320', margin: '0 0 6px' }}>Verified NGO Pickups</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#6b5d56', margin: 0 }}>
                Every volunteer and partner charity is government-registered and vetted for safe transport.
              </p>
            </div>

            <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid rgba(44, 35, 32, 0.06)' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>📸</div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320', margin: '0 0 6px' }}>Proof of Receipt</h3>
              <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#6b5d56', margin: 0 }}>
                Receive verified pickup codes and photo confirmation when your meal reaches someone in need.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '48px', fontSize: '14px', color: '#6b5d56' }}>
            Looking for food instead?{' '}
            <Link to="/find-food" style={{ color: 'var(--brand-primary-dark)', fontWeight: 700, textDecoration: 'none' }}>
              Browse live available meals →
            </Link>
          </div>

        </div>
      </main>

    </div>
  );
};

export default DonateFood;
