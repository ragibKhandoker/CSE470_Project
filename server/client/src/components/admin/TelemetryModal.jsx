import React from 'react';

export const TelemetryModal = ({ alert, onClose, onRevoke, onSuspend, onDismiss }) => {
  if (!alert) return null;

  const t = alert.telemetry || {};

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          maxWidth: '560px',
          width: '100%',
          padding: '28px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', fontWeight: 800, color: '#2c2320', margin: 0 }}>
              Device &amp; Telemetry Audit
            </h3>
            <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0' }}>
              Detailed network fingerprint for {alert.title}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#888'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#f7f4f0', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6b5d56', fontWeight: 600 }}>IP Address</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#2c2320' }}>{t.ip || 'N/A'}</span>
          </div>
          <div style={{ background: '#f7f4f0', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6b5d56', fontWeight: 600 }}>Internet Service Provider</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#2c2320' }}>{t.isp || 'N/A'}</span>
          </div>
          <div style={{ background: '#f7f4f0', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6b5d56', fontWeight: 600 }}>Request Velocity</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>{t.velocity || 'N/A'}</span>
          </div>
          <div style={{ background: '#f7f4f0', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6b5d56', fontWeight: 600 }}>Device Fingerprint</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#2c2320' }}>{t.device || 'N/A'}</span>
          </div>
          <div style={{ background: '#f7f4f0', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: '#6b5d56', fontWeight: 600 }}>Approximate Geo Location</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#2c2320' }}>{t.location || 'N/A'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            style={{
              background: '#f7f4f0',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#2c2320',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          {alert.status === 'active' && (
            <>
              <button
                onClick={() => { onDismiss(alert.id); onClose(); }}
                style={{
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#4b5563',
                  cursor: 'pointer'
                }}
              >
                Dismiss Alert
              </button>
              <button
                onClick={() => { (onRevoke ? onRevoke(alert.id) : onSuspend?.(alert.id)); onClose(); }}
                style={{
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 18px',
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

export default TelemetryModal;
