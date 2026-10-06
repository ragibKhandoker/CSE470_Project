import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', color: '#2c2320' }}>
      <Navbar />

      {/* Header */}
      <section style={{ padding: '64px 24px 40px', textAlign: 'center', background: 'linear-gradient(180deg, #fdf7f2 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(44,35,32,0.06)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fef3c7', color: '#92400e', padding: '6px 14px', borderRadius: '100px', fontSize: '12.5px', fontWeight: 700, marginBottom: '16px' }}>
            <span>⚖️</span> Community Agreement &amp; Terms
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800, color: '#2c2320', margin: '0 0 12px', lineHeight: 1.2 }}>
            ShareMeal Terms of Service
          </h1>
          <p style={{ fontSize: '14.5px', color: '#8c7e77', margin: 0 }}>
            Effective as of September 2026 • Governing all donors, NGOs, and community receivers
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main style={{ maxWidth: '880px', margin: '0 auto', padding: '56px 24px 80px', width: '100%', flex: 1, lineHeight: 1.8, fontSize: '15px', color: '#4a3f3a' }}>
        
        {/* Core Rules Callout */}
        <div style={{ background: '#ffffff', border: '1.5px solid #2563eb', borderRadius: '20px', padding: '28px 32px', marginBottom: '48px', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.06)' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 800, color: '#2563eb', margin: '0 0 12px' }}>
            Fundamental Principles of Participation
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '10px', fontSize: '14px', color: '#554944' }}>
            <li><strong>Strictly Non-Commercial:</strong> Reselling or charging money for any food obtained through ShareMeal is strictly illegal and triggers immediate account termination.</li>
            <li><strong>Good Faith Quality:</strong> Donors must only list food they would comfortably consume themselves, following all hygiene rules.</li>
            <li><strong>Dignity &amp; Respect:</strong> All parties agree to treat recipients with utmost dignity and privacy during collections and handovers.</li>
          </ul>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', marginBottom: '14px' }}>
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the ShareMeal website, API, or connected applications, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you are registering on behalf of an NGO or corporate entity, you warrant that you have the legal authority to bind that organization.
          </p>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', marginBottom: '14px' }}>
            2. Donor Conduct &amp; Food Quality Representations
          </h2>
          <p>
            When publishing a donation post, donors represent and warrant that:
          </p>
          <ul>
            <li>The surplus food is wholesome, edible, and has been handled under sanitary kitchen conditions.</li>
            <li>The stated expiration time and temperature conditions are accurate.</li>
            <li>The food has not been subjected to unsafe temperature standing exceeding recommended food safety thresholds.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', marginBottom: '14px' }}>
            3. NGO Collection &amp; Distribution Obligations
          </h2>
          <p>
            Approved non-profit organizations agree to:
          </p>
          <ul>
            <li>Maintain accurate vehicle and volunteer hygiene equipment (e.g. thermal insulated containers).</li>
            <li>Perform sensory and packaging inspection before loading food onto transport vehicles.</li>
            <li>Promptly update collection statuses and publish verified serving logs following meal distribution.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', marginBottom: '14px' }}>
            4. Limitation of Liability &amp; Safe Samaritan Protection
          </h2>
          <p>
            ShareMeal serves as an intermediary software coordination platform. To the fullest extent permissible by law, donors who provide food in good faith and without gross negligence or intentional misconduct are protected under applicable national Good Samaritan food rescue statutes.
          </p>
        </section>

        {/* Section 5 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', marginBottom: '14px' }}>
            5. Termination &amp; Account Sanctions
          </h2>
          <p>
            We reserve the right to suspend or permanently ban any user, donor, or organization found to engage in:
          </p>
          <ul>
            <li>Fraudulent food posts or expired item spam.</li>
            <li>Commercial resale of donated provisions.</li>
            <li>Automated botting or gaming of donation leaderboards.</li>
            <li>Harassment, privacy violations, or abuse of community members.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #eee5e0' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 10px', color: '#2c2320' }}>
            6. Legal &amp; Governance Contacts
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b5d56' }}>
            For legal inquiries, partnership compliance questions, or terms clarifications, please email our legal desk:
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="mailto:legal@sharemeal.org"
              style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}
            >
              legal@sharemeal.org ➔
            </a>
            <span style={{ color: '#ccc' }}>|</span>
            <Link to="/safety" style={{ color: '#6b5d56', textDecoration: 'none', fontSize: '14px' }}>
              View Safety Protocols
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
