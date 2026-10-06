import React from 'react';

export const BotAlertCard = ({ alert, onReview, onDismiss, onRevoke, onSuspend }) => {
  const isHighRisk = alert.riskLevel === 'High Risk';
  const isMediumRisk = alert.riskLevel === 'Medium Risk';
  const isResolved = alert.status === 'dismissed' || alert.status === 'revoked' || alert.status === 'suspended';

  const riskBg = isHighRisk ? '#fef2f2' : isMediumRisk ? '#fffbeb' : '#f3f4f6';
  const riskColor = isHighRisk ? '#dc2626' : isMediumRisk ? '#d97706' : '#4b5563';

  const isRevoked = alert.status === 'revoked' || alert.status === 'suspended';

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px',
        border: `1px solid ${isHighRisk ? '#fee2e2' : 'rgba(44, 35, 32, 0.08)'}`,
        boxShadow: '0 4px 12px rgba(44, 35, 32, 0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        opacity: isResolved ? 0.6 : 1,
        transition: 'all 0.2s ease'
      }}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: riskBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
          >
            {isHighRisk ? '🚨' : isMediumRisk ? '⚠️' : '🛡️'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320' }}>
                {alert.title}
              </span>
              <span
                style={{
                  background: '#f7f4f0',
                  color: '#6b5d56',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase'
                }}
              >
                {alert.userType}
              </span>
              {alert.status !== 'active' && (
                <span
                  style={{
                    background: isRevoked ? '#fee2e2' : '#ecfdf5',
                    color: isRevoked ? '#dc2626' : '#059669',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {isRevoked ? 'REVOKED' : 'DISMISSED'}
                </span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
              Account ID: #{alert.accountId} · Flagged {alert.timestamp}
            </div>
          </div>
        </div>

        {/* Risk Badge */}
        <div
          style={{
            background: riskBg,
            color: riskColor,
            fontSize: '12px',
            fontWeight: 800,
            padding: '5px 12px',
            borderRadius: '100px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: riskColor }}></span>
          {alert.riskLevel}
        </div>
      </div>

      {/* Trigger Reason */}
      <div
        style={{
          background: '#faf8f5',
          borderRadius: '10px',
          padding: '12px 16px',
          fontSize: '14px',
          color: '#2c2320',
          lineHeight: 1.5,
          borderLeft: `4px solid ${riskColor}`
        }}
      >
        <span style={{ fontWeight: 700 }}>Trigger Violation:</span> {alert.reason}
      </div>

      {/* Telemetry Summary & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: '#6b5d56', flexWrap: 'wrap' }}>
          {alert.telemetry?.ip && <span>🌐 IP: <strong>{alert.telemetry.ip}</strong></span>}
          {alert.telemetry?.velocity && <span>⚡ Velocity: <strong>{alert.telemetry.velocity}</strong></span>}
          {alert.telemetry?.location && <span>📍 Location: <strong>{alert.telemetry.location}</strong></span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => onReview(alert)}
            style={{
              background: '#f7f4f0',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#2c2320',
              cursor: 'pointer'
            }}
          >
            Review Telemetry
          </button>
          
          {!isResolved && (
            <>
              <button
                type="button"
                onClick={() => onDismiss(alert.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#4b5563',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => (onRevoke ? onRevoke(alert.id) : onSuspend?.(alert.id))}
                style={{
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Revoke Verification
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BotAlertCard;
