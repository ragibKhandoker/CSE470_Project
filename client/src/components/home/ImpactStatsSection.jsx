import React from 'react';

export const ImpactStatsSection = ({ stats = [] }) => {
  const defaultStats = [
    { number: '482,000+', title: 'Meals rescued', sub: 'and served to date' },
    { number: '1,340', title: 'Partner NGOs', sub: 'verified & active' },
    { number: '96%', title: 'Reach their plate', sub: 'tracked to receipt' },
    { number: '62 t', title: 'CO₂ saved', sub: 'from landfill each month' }
  ];

  const displayStats = stats && stats.length > 0 ? stats : defaultStats;

  return (
    <section style={{ padding: '0 24px 90px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div
          style={{
            background: 'linear-gradient(135deg, #e05333 0%, #c43818 100%)',
            borderRadius: '32px',
            padding: 'clamp(40px, 6vw, 70px) 32px',
            color: '#ffffff',
            textAlign: 'center',
            boxShadow: '0 24px 60px rgba(224, 83, 51, 0.35)'
          }}
        >
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, margin: '0 0 14px', letterSpacing: '-1px' }}>
            Every meal shared is a small act of repair
          </h2>
          <p style={{ fontSize: '17px', color: 'rgba(255, 255, 255, 0.85)', margin: '0 auto 48px', maxWidth: '520px' }}>
            Numbers we're proud of — and a bin we're happy to leave empty.
          </p>

          {/* 4 Impact Pillars directly from PostgreSQL */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
            {displayStats.map((stat, idx) => (
              <div
                key={idx}
                className="impact-stat-item"
                style={{
                  borderRight: idx < displayStats.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
                  padding: '0 12px'
                }}
              >
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(36px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: '6px' }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '2px' }}>
                  {stat.title}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)' }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default ImpactStatsSection;
