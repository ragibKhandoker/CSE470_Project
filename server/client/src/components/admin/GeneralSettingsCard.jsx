import React from 'react';

export const GeneralSettingsCard = ({
  platformName,
  setPlatformName,
  supportEmail,
  setSupportEmail,
  savingGeneral,
  onSaveGeneral
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '28px',
        border: '1px solid rgba(44, 35, 32, 0.07)',
        boxShadow: '0 4px 16px rgba(44, 35, 32, 0.03)'
      }}
    >
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 800, color: '#2c2320', margin: 0 }}>
          General Platform Settings
        </h3>
        <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0' }}>
          Basic platform configuration and primary contact information
        </p>
      </div>

      <form onSubmit={onSaveGeneral} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4a3e39', marginBottom: '6px' }}>
            Platform Name
          </label>
          <input
            type="text"
            value={platformName}
            onChange={(e) => setPlatformName(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '10px',
              border: '1.5px solid #e5e7eb',
              fontSize: '14px',
              color: '#2c2320',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4a3e39', marginBottom: '6px' }}>
            Support Email Address
          </label>
          <input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '10px',
              border: '1.5px solid #e5e7eb',
              fontSize: '14px',
              color: '#2c2320',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button
            type="submit"
            disabled={savingGeneral}
            style={{
              background: '#2c2320',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: savingGeneral ? 'not-allowed' : 'pointer',
              opacity: savingGeneral ? 0.7 : 1
            }}
          >
            {savingGeneral ? 'Saving...' : 'Save General Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GeneralSettingsCard;
