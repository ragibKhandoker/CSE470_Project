import React from 'react';

export const PartnersTicker = ({ partners = [] }) => {
  const defaultPartners = [
    'Care Bangladesh Food Rescue',
    'Bidyanondo Foundation',
    'As-Sunnah Foundation',
    'Mastul Foundation',
    'BRAC Community Aid',
    'Jaago Foundation',
    'Dhaka Food Bank',
    'Sajida Foundation',
    'Quantum Foundation',
    'Al-Khidmat Bangladesh',
    'Chittagong Relief Hub'
  ];

  // Explicitly excluded personal names
  const excludedNames = ['nusrat jahan', 'tanvir ahmed'];

  const rawList = partners && partners.length > 0 ? partners : defaultPartners;
  const filteredList = rawList.filter(item => {
    if (!item || typeof item !== 'string') return false;
    const lower = item.trim().toLowerCase();
    return !excludedNames.some(ex => lower.includes(ex));
  });

  const baseList = filteredList.length > 0 ? filteredList : defaultPartners;
  // Duplicate the list so keyframe transform: translateX(-50%) creates a seamless loop
  const marqueeList = [...baseList, ...baseList];

  return (
    <section style={{
      padding: '28px 0 36px', 
      borderTop: '1px solid rgba(44, 35, 32, 0.06)', 
      borderBottom: '1px solid rgba(44, 35, 32, 0.06)', 
      background: '#fdf7f2',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <style>{`
        @keyframes infiniteMarquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .partners-marquee-container {
          width: 100%;
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
        }
        .partners-marquee-track {
          display: flex;
          width: max-content;
          gap: 18px;
          animation: infiniteMarquee 58s linear infinite;
          will-change: transform;
        }
        .partners-marquee-track:hover {
          animation-play-state: paused;
        }
        .partners-ticker-pill {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          padding: 10px 22px;
          border-radius: 9999px;
          border: 1px solid #eee5e0;
          font-size: 13.5px;
          font-weight: 700;
          color: '#4a3e39';
          box-shadow: 0 2px 8px rgba(44, 35, 32, 0.04);
          transition: all 0.2s ease;
          cursor: pointer;
          user-select: none;
        }
        .partners-ticker-pill:hover {
          transform: translateY(-2px);
          border-color: rgba(var(--brand-primary-rgb), 0.4);
          box-shadow: 0 6px 16px rgba(var(--brand-primary-rgb), 0.12);
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', padding: '0 24px', marginBottom: '22px' }}>
        <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#8c7e77' }}>
          Trusted by relief networks feeding communities everyday
        </p>
      </div>

      {/* Infinite Marquee Wrapper */}
      <div className="partners-marquee-container">
        <div className="partners-marquee-track">
          {marqueeList.map((partner, idx) => (
            <div
              key={`${partner}-${idx}`}
              className="partners-ticker-pill"
            >
              <span style={{ color: 'var(--brand-primary)', fontSize: '11px' }}>●</span>
              <span style={{ color: '#3e3430', fontWeight: 650 }}>{partner}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersTicker;
