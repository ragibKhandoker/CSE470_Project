import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';

export const Settings = () => {
  const { user, token } = useAuth();

  const [platformName, setPlatformName] = useState('ShareMeal');
  const [supportEmail, setSupportEmail] = useState('support@sharemeal.org');
  const [requireNid, setRequireNid] = useState(true);
  const [maxRequestsPerHour, setMaxRequestsPerHour] = useState(10);
  const [adminTeam, setAdminTeam] = useState([]);

  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Moderator');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/admin/settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setPlatformName(data.settings.platformName || 'ShareMeal');
            setSupportEmail(data.settings.supportEmail || 'support@sharemeal.org');
            setRequireNid(data.settings.requireNidForReceivers !== false);
            setMaxRequestsPerHour(data.settings.maxRequestsPerHour || 10);
          }
          if (data.admin_team && data.admin_team.length > 0) {
            setAdminTeam(data.admin_team);
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    fetchSettings();
  }, [token]);

  const showNotification = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ platformName, supportEmail })
      });
      if (res.ok) {
        showNotification('General platform settings updated successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleToggleNid = async () => {
    const nextVal = !requireNid;
    setRequireNid(nextVal);
    try {
      await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ requireNidForReceivers: nextVal })
      });
      showNotification(`Receiver NID requirement ${nextVal ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveRateLimit = async (e) => {
    e.preventDefault();
    setSavingRate(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ maxRequestsPerHour })
      });
      if (res.ok) {
        showNotification('Receiver rate limits updated successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRate(false);
    }
  };

  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/admin/settings/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole })
      });

      if (res.ok) {
        const initials = (inviteName || 'AD')
          .split(' ')
          .map((p) => p[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        setAdminTeam((prev) => [
          ...prev,
          {
            id: Date.now(),
            name: inviteName,
            email: inviteEmail,
            role: inviteRole,
            initials
          }
        ]);

        showNotification(`Invitation sent to ${inviteEmail}!`);
        setInviteModalOpen(false);
        setInviteName('');
        setInviteEmail('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInviting(false);
    }
  };

  return (
    <AdminLayout title="Settings">
      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {feedback && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              padding: '12px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>✓</span> {feedback}
          </div>
        )}

        {/* Card 1: General (Figma Node 8:32462) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.03)'
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#2c2320', fontFamily: 'Fraunces, serif' }}>
            General
          </h3>

          <form onSubmit={handleSaveGeneral} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b5d56', marginBottom: '6px' }}>
                Platform Name
              </label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #f0e8e4',
                  background: '#fffdfc',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: '#2c2320'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b5d56', marginBottom: '6px' }}>
                Support Email
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #f0e8e4',
                  background: '#fffdfc',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: '#2c2320'
                }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={savingGeneral}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '9px 24px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#2563eb')}
              >
                {savingGeneral ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Card 2: Verification Rules (Figma Node 8:32474) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.03)'
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#2c2320', fontFamily: 'Fraunces, serif' }}>
            Verification Rules
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#2c2320' }}>
                Require NID for Receivers
              </h4>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#8c7e75' }}>
                If off, phone verification only is accepted
              </p>
            </div>

            {/* iOS style Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleNid}
              style={{
                width: '46px',
                height: '26px',
                borderRadius: '13px',
                background: requireNid ? '#2563eb' : '#d1d5db',
                position: 'relative',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                flexShrink: 0
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '3px',
                  left: requireNid ? '23px' : '3px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
            </button>
          </div>
        </div>

        {/* Card 3: Rate Limiting (Figma Node 8:32483) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.03)'
          }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800, color: '#2c2320', fontFamily: 'Fraunces, serif' }}>
            Rate Limiting
          </h3>

          <form onSubmit={handleSaveRateLimit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#6b5d56', marginBottom: '6px' }}>
                Max Requests per Hour (per Receiver)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxRequestsPerHour}
                onChange={(e) => setMaxRequestsPerHour(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #f0e8e4',
                  background: '#fffdfc',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  color: '#2c2320'
                }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={savingRate}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 24px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                onMouseOut={(e) => (e.currentTarget.style.background = '#2563eb')}
              >
                {savingRate ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>

        {/* Card 4: Admin Team (Figma Node 8:32490) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.03)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#2c2320', fontFamily: 'Fraunces, serif' }}>
              Admin Team
            </h3>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '20px',
                padding: '7px 18px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 3px 10px rgba(37, 99, 235, 0.35)'
              }}
            >
              <span>+</span> Invite Admin
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {adminTeam.map((member) => (
              <div
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid rgba(44, 35, 32, 0.04)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#dbeafe',
                      color: '#1e40af',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                  >
                    {member.initials}
                  </div>
                  <div>
                    <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#2c2320' }}>
                      {member.name}
                    </h5>
                    <span style={{ fontSize: '12px', color: '#8c7e75' }}>
                      {member.email}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '10px',
                    background: '#f4f0ec',
                    color: '#6b5d56',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Invite Admin Modal */}
      {inviteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28, 25, 23, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setInviteModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setInviteModalOpen(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: '#f4f0ec',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                color: '#6b5d56'
              }}
            >
              ✕
            </button>

            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: '#2c2320' }}>
              Invite Admin Team Member
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#8c7e75' }}>
              Add a colleague to assist with platform operations, verifications, and reports.
            </p>

            <form onSubmit={handleInviteAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Tariq Ahmed"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #e0d8d3',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@sharemeal.org"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #e0d8d3',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                  Role Access
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #e0d8d3',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                    background: '#fff'
                  }}
                >
                  <option value="Moderator">Moderator (Verification &amp; Reports)</option>
                  <option value="Super Admin">Super Admin (Full Access)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  style={{
                    background: '#f4f0ec',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#574c45',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  style={{
                    background: '#2563eb',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 22px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: inviting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
                  }}
                >
                  {inviting ? 'Sending...' : 'Send Invitation →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default Settings;
