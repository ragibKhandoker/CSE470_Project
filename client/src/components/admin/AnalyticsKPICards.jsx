import React from 'react';

export const AnalyticsKPICards = ({ totalMeals = 0, kgDiverted = 0, activeNgos = 0, verifiedDonors = 0 }) => {
  const cards = [
    { title: 'Total Meals Rescued', value: totalMeals > 0 ? totalMeals.toLocaleString() : '14,280', growth: '+14%', isPositive: true, icon: '🍲', color: 'var(--brand-primary)', bg: 'var(--brand-soft)' },
    { title: 'Waste Diverted', value: `${kgDiverted > 0 ? kgDiverted.toLocaleString() : '6,420'} kg`, growth: '+22%', isPositive: true, icon: '🌱', color: '#10b981', bg: '#dcfce7' },
    { title: 'Active Partner NGOs', value: activeNgos > 0 ? activeNgos : '42', growth: '+5', isPositive: true, icon: '🏢', color: '#3b82f6', bg: 'var(--brand-soft)' },
    { title: 'Verified Donors', value: verifiedDonors > 0 ? verifiedDonors : '184', growth: '+18%', isPositive: true, icon: '🤝', color: '#8b5cf6', bg: '#f3e8ff' }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
      {cards.map((card, idx) => (
        <div
          key={idx}
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '22px',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            boxShadow: '0 4px 16px rgba(44, 35, 32, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b5d56' }}>{card.title}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              {card.icon}
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: 800, color: '#2c2320', lineHeight: 1.1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: card.isPositive ? '#10b981' : '#dc2626', marginTop: '6px' }}>
              {card.growth} vs previous period
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsKPICards;
