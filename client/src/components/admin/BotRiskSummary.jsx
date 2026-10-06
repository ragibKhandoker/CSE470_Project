import React from 'react';

export const BotRiskSummary = ({ alerts = [], activeFilter, onFilterChange }) => {
  const highRiskCount = alerts.filter(a => a.riskLevel === 'High Risk' && a.status === 'active').length;
  const medRiskCount = alerts.filter(a => a.riskLevel === 'Medium Risk' && a.status === 'active').length;
  const lowRiskCount = alerts.filter(a => a.riskLevel === 'Low Risk' && a.status === 'active').length;
  const resolvedCount = alerts.filter(a => a.status === 'dismissed' || a.status === 'revoked' || a.status === 'suspended').length;

  const filters = [
    { key: 'all', label: `All Alerts (${alerts.length})` },
    { key: 'high', label: `High Risk (${highRiskCount})` },
    { key: 'medium', label: `Medium Risk (${medRiskCount})` },
    { key: 'resolved', label: `Resolved (${resolvedCount})` }
  ];

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Risk Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid rgba(44, 35, 32, 0.06)', boxShadow: '0 4px 12px rgba(44, 35, 32, 0.03)' }}>
          <div style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>Active High Risk</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626', marginTop: '4px', fontFamily: "'Fraunces', serif" }}>
            {highRiskCount}
          </div>
          <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px', fontWeight: 600 }}>Action Required</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid rgba(44, 35, 32, 0.06)', boxShadow: '0 4px 12px rgba(44, 35, 32, 0.03)' }}>
          <div style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>Medium Risk</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706', marginTop: '4px', fontFamily: "'Fraunces', serif" }}>
            {medRiskCount}
          </div>
          <div style={{ fontSize: '12px', color: '#d97706', marginTop: '2px', fontWeight: 600 }}>Under Review</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid rgba(44, 35, 32, 0.06)', boxShadow: '0 4px 12px rgba(44, 35, 32, 0.03)' }}>
          <div style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>Low Risk</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#4b5563', marginTop: '4px', fontFamily: "'Fraunces', serif" }}>
            {lowRiskCount}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px', fontWeight: 600 }}>Monitoring</div>
        </div>

        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '18px 20px', border: '1px solid rgba(44, 35, 32, 0.06)', boxShadow: '0 4px 12px rgba(44, 35, 32, 0.03)' }}>
          <div style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>Resolved Incidents</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#10b981', marginTop: '4px', fontFamily: "'Fraunces', serif" }}>
            {resolvedCount}
          </div>
          <div style={{ fontSize: '12px', color: '#059669', marginTop: '2px', fontWeight: 600 }}>Revoked / Dismissed</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => onFilterChange(f.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '100px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeFilter === f.key ? 'none' : '1px solid #e5e7eb',
              background: activeFilter === f.key ? '#2c2320' : '#ffffff',
              color: activeFilter === f.key ? '#ffffff' : '#6b5d56',
              transition: 'all 0.15s ease'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BotRiskSummary;
