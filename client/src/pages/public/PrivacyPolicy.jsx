import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', color: '#2c2320' }}>
      <Navbar />

      {/* Header */}
      <section style={{ padding: '64px 24px 40px', textAlign: 'center', background: 'linear-gradient(180deg, #fdf7f2 0%, #f8fafc 100%)', borderBottom: '1px solid rgba(44,35,32,0.06)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#e8f0fe', color: '#1967d2', padding: '6px 14px', borderRadius: '100px', fontSize: '12.5px', fontWeight: 700, marginBottom: '16px' }}>
            <span>🔒</span> Data Security &amp; Confidentiality
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800, color: '#2c2320', margin: '0 0 12px', lineHeight: 1.2 }}>
            ShareMeal Privacy Policy
          </h1>
          <p style={{ fontSize: '14.5px', color: '#8c7e77', margin: 0 }}>
            Last Updated: September 2026 • Effective for all global participants
          </p>
        </div>
      </section>

      {/* Content Body */}
      <main style={{ maxWidth: '880px', margin: '0 auto', padding: '56px 24px 80px', width: '100%', flex: 1, lineHeight: 1.8, fontSize: '15px', color: '#4a3f3a' }}>
        
        {/* Core Principles Callout */}
        <div style={{ background: '#ffffff', border: '1.5px solid #2563eb', borderRadius: '20px', padding: '28px 32px', marginBottom: '48px', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.06)' }}>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 800, color: '#2563eb', margin: '0 0 12px' }}>
            Our Core Privacy Commitments
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '10px', fontSize: '14px', color: '#554944' }}>
            <li><strong>We never sell your data:</strong> Your contact details and activity are never monetized or shared with third-party advertisers.</li>
            <li><strong>Cryptographic Receiver Masking:</strong> Sensitive receiver identities and NIDs are encrypted with AES-256 in our database.</li>
            <li><strong>Zero Plaintext Passwords:</strong> Credentials are cryptographically salted and hashed using standard bcrypt algorithms.</li>
            <li><strong>Single-Use Handover Verification:</strong> PIN verification enables dignified food distribution without disclosing recipient names.</li>
          </ul>
        </div>

        {/* Section 1 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', marginBottom: '14px' }}>
            1. Information We Collect
          </h2>
          <p>
            When you register, donate, or request meals on ShareMeal, we collect specific data required to facilitate safe food distribution:
          </p>
          <ul>
            <li><strong>Account Credentials:</strong> Full name, verified email address, phone number, and hashed password.</li>
            <li><strong>NGO Verification Records:</strong> Organization name, government certificate number, and authorized representative documents.</li>
            <li><strong>Donation Listing Details:</strong> Food category, quantity, perishability timeframe, pickup address, and photographic uploads.</li>
            <li><strong>Geolocation Information:</strong> Approximate pickup and delivery coordinates used exclusively to render interactive discovery maps.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', marginBottom: '14px' }}>
            2. How We Use Your Data
          </h2>
          <p>
            Your information is processed strictly for platform operations, including:
          </p>
          <ul>
            <li>Routing nearby surplus food notifications to certified non-profit collection vehicles.</li>
            <li>Generating single-use 4-digit pickup PINs for authorized food handover.</li>
            <li>Aggregating anonymous community metrics (e.g. cumulative kilograms of food rescued and families served).</li>
            <li>Preventing fraudulent spam posts, account botting, and platform abuse through rate-limiting middleware.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', marginBottom: '14px' }}>
            3. Data Retention &amp; Security Architecture
          </h2>
          <p>
            ShareMeal utilizes enterprise cloud architecture with encrypted data transit (TLS/HTTPS) and database connection pooling. Access to database tables is strictly role-gated via JWT bearer token authentication.
          </p>
          <p>
            Listing images uploaded to our cloud storage buckets are stored under restricted access policies and referenced solely during active food listings.
          </p>
        </section>

        {/* Section 4 */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', fontWeight: 800, color: '#2c2320', marginBottom: '14px' }}>
            4. Your Rights &amp; Account Deletion
          </h2>
          <p>
            You retain full ownership of your data under applicable data privacy regulations. You have the right to:
          </p>
          <ul>
            <li>Request an export of all personal data tied to your user ID.</li>
            <li>Update or correct inaccurate profile details at any time from your account settings.</li>
            <li>Permanently delete your profile and historical records by contacting our support desk.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section style={{ background: '#ffffff', padding: '28px', borderRadius: '16px', border: '1px solid #eee5e0' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 10px', color: '#2c2320' }}>
            5. Contact Our Privacy Office
          </h3>
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b5d56' }}>
            For privacy inquiries, audit disclosures, or data deletion requests, please contact our designated Data Protection Officer:
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href="mailto:privacy@sharemeal.org"
              style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}
            >
              privacy@sharemeal.org ➔
            </a>
            <span style={{ color: '#ccc' }}>|</span>
            <Link to="/help" style={{ color: '#6b5d56', textDecoration: 'none', fontSize: '14px' }}>
              Visit Help Centre
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
