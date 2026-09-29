import React from 'react';

export const AdminTeamList = ({ adminTeam = [], onOpenInvite }) => {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 800, color: '#2c2320', margin: 0 }}>
            Admin Team Members
          </h3>
          <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0' }}>
            Users with administrative authorization across ShareMeal operations
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenInvite}
          style={{
            background: '#ff6b4a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(255, 107, 74, 0.25)'
          }}
        >
          <span>+</span> Invite Admin
        </button>
      </div>

      {adminTeam.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: '#888', fontSize: '13px' }}>
          Loading admin team members from database...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {adminTeam.map((member) => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderRadius: '14px',
                background: '#faf8f5',
                border: '1px solid rgba(44, 35, 32, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: member.role === 'Super Admin' ? 'linear-gradient(135deg, #ff8461 0%, #f04b28 100%)' : '#e5e7eb',
                    color: member.role === 'Super Admin' ? '#ffffff' : '#374151',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800
                  }}
                >
                  {member.initials || 'AD'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#2c2320' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {member.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: member.role === 'Super Admin' ? '#ffe4db' : '#f3f4f6',
                    color: member.role === 'Super Admin' ? '#d9381e' : '#4b5563',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '100px'
                  }}
                >
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTeamList;
