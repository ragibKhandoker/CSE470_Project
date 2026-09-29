import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export const SafetyProtocols = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const pillars = [
    {
      icon: '⏱️',
      title: 'The 2-Hour / 4-Hour Rule',
      desc: 'Cooked meals must be packaged and transferred under strict temperature windows. Any cooked food standing at room temperature for over 4 hours cannot be donated.'
    },
    {
      icon: '📦',
      title: 'Food-Grade Packaging',
      desc: 'All donations must be stored in clean, sealed, food-grade containers or original unopened store packaging to prevent airborne contamination.'
    },
    {
      icon: '🚚',
      title: 'NGO Vehicle Inspection',
      desc: 'Certified NGO collection teams carry insulated thermal bags and perform sensory & temperature verification before accepting donations.'
    },
    {
      icon: '🔑',
      title: 'Secure Handover PINs',
      desc: 'Receivers are issued single-use cryptographic 4-digit PINs. Volunteers must verify the code before distribution to ensure food reaches the intended family.'
    }
  ];

  const prohibitedFoods = [
    'Food past its printed "Use-By" or "Expiration" date',
    'Partially eaten or unsealed buffet leftovers from patron plates',
    'Raw unpasteurized dairy or homemade canned low-acid goods',
    'Food exhibiting unpleasant odor, discoloration, or signs of spoilage',
    'Food left at room temperature for over 4 hours'
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff9f5', color: '#2c2320' }}>
      <Navbar />

      {/* Hero Section */}
      <section style={{ padding: '64px 24px 48px', textAlign: 'center', background: 'linear-gradient(180deg, #fdf7f2 0%, #fff9f5 100%)', borderBottom: '1px solid rgba(44,35,32,0.06)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e6f7ef', color: '#0d8258', padding: '6px 14px', borderRadius: '100px', fontSize: '12.5px', fontWeight: 700, marginBottom: '16px' }}>
            <span>🛡️</span> Zero-Harm Food Safety Standards
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800, color: '#2c2320', margin: '0 0 16px', lineHeight: 1.2 }}>
            ShareMeal Safety &amp; Trust Protocols
          </h1>
          <p style={{ fontSize: '16px', color: '#6b5d56', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
            Eliminating hunger must never come at the expense of health. Every meal posted, collected, and shared follows rigorous hygiene guidelines.
          </p>
        </div>
      </section>

      {/* Core Protocols */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '56px 24px 80px', width: '100%', flex: 1 }}>
        
        <div style={{ marginBottom: '56px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 800, margin: '0 0 12px', textAlign: 'center' }}>
            Our 4 Pillars of Donation Safety
          </h2>
          <p style={{ textAlign: 'center', color: '#6b5d56', fontSize: '14.5px', margin: '0 auto 36px', maxWidth: '580px' }}>
            Standard operating procedures enforced across our network of donors, volunteers, and certified non-profits.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  padding: '30px 24px',
                  borderRadius: '20px',
                  border: '1px solid #eee5e0',
                  boxShadow: '0 4px 16px rgba(44, 35, 32, 0.03)'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{pillar.icon}</div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 10px', color: '#2c2320' }}>
                  {pillar.title}
                </h3>
                <p style={{ fontSize: '13.5px', color: '#6b5d56', lineHeight: 1.6, margin: 0 }}>
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Prohibited Foods & Allergen Policy */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '56px' }}>
          
          <div style={{ background: '#fff5f3', padding: '36px', borderRadius: '24px', border: '1px solid #fcdcd5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🚫</span>
              <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#c53018', margin: 0 }}>
                Strictly Prohibited Items
              </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: '#7a2818', lineHeight: 1.6, marginBottom: '20px' }}>
              To safeguard recipients, the following items must never be posted or distributed:
            </p>
            <ul style={{ paddingLeft: '20px', margin: 0, display: 'grid', gap: '12px', fontSize: '13.5px', color: '#692011' }}>
              {prohibitedFoods.map((item, idx) => (
                <li key={idx} style={{ lineHeight: 1.5 }}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#ffffff', padding: '36px', borderRadius: '24px', border: '1px solid #eee5e0', boxShadow: '0 4px 16px rgba(44, 35, 32, 0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '24px' }}>🏷️</span>
              <h3 style={{ fontSize: '19px', fontWeight: 800, color: '#2c2320', margin: 0 }}>
                Allergen &amp; Perishability Labeling
              </h3>
            </div>
            <p style={{ fontSize: '13.5px', color: '#6b5d56', lineHeight: 1.6, marginBottom: '18px' }}>
              Transparency in food composition saves lives. Donors are required to select appropriate category tags during post creation:
            </p>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ padding: '12px 16px', background: '#fdf7f2', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                <strong style={{ fontSize: '13px', color: '#155724' }}>Vegetarian vs Non-Vegetarian:</strong>
                <p style={{ fontSize: '12.5px', color: '#555', margin: '4px 0 0' }}>Clearly demarcated badges allow individuals with dietary restrictions to select appropriate meals.</p>
              </div>
              <div style={{ padding: '12px 16px', background: '#fdf7f2', borderRadius: '12px', borderLeft: '4px solid #ff6b4a' }}>
                <strong style={{ fontSize: '13px', color: '#d9381e' }}>Allergen Disclosures:</strong>
                <p style={{ fontSize: '12.5px', color: '#555', margin: '4px 0 0' }}>Donors are prompted to note common allergens including peanuts, dairy, shellfish, and gluten.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Trust & Good Samaritan Protection */}
        <div style={{ background: '#ffffff', padding: '40px', borderRadius: '24px', border: '1px solid #eee5e0', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤝</div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', margin: '0 0 12px' }}>
            Good Samaritan Protection Policy
          </h3>
          <p style={{ fontSize: '14px', color: '#6b5d56', lineHeight: 1.7, maxWidth: '720px', margin: '0 auto 24px' }}>
            ShareMeal operates under national and international food donation protection principles. Donors donating surplus food in good faith without willful negligence are protected from liability, encouraging businesses to feed communities rather than landfill bins.
          </p>
          <div style={{ display: 'inline-flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link
              to="/terms"
              style={{ padding: '10px 22px', borderRadius: '100px', background: '#fdf7f2', border: '1px solid #eee5e0', color: '#2c2320', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}
            >
              Read Terms of Service
            </Link>
            <Link
              to="/help"
              style={{ padding: '10px 22px', borderRadius: '100px', background: '#ff6b4a', color: '#ffffff', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}
            >
              Visit Help Centre
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default SafetyProtocols;
