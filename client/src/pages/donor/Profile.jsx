import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DonorLayout from '../../components/donor/DonorLayout';
import PasswordResetRequestModal from '../../components/common/PasswordResetRequestModal';
import { API_BASE_URL } from '../../utils/constants';
import '../../App.css';

export const Profile = () => {
  const { user, token, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [nid, setNid] = useState(user?.nid || '');
  const [nidPdf, setNidPdf] = useState(null);

  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setNid(user.nid || '');
    }
  }, [user]);

  const isVerified = user?.verification_status === 'verified';

  // 6 profile completion criteria summing to 100%
  const checklist = [
    {
      id: 'name',
      label: 'Full Name',
      weight: 15,
      isComplete: Boolean(name && name.trim())
    },
    {
      id: 'phone',
      label: 'Mobile Number',
      weight: 15,
      isComplete: Boolean(phone && phone.trim())
    },
    {
      id: 'email',
      label: 'Email Address',
      weight: 15,
      isComplete: Boolean(email && email.trim())
    },
    {
      id: 'address',
      label: 'Default Pickup Address',
      weight: 25,
      isComplete: Boolean(address && address.trim())
    },
    {
      id: 'nid',
      label: 'National ID (NID) Number',
      weight: 15,
      isComplete: Boolean(nid && nid.trim())
    },
    {
      id: 'nidDoc',
      label: 'NID Document (PDF or Photo)',
      weight: 15,
      isComplete: Boolean(nidPdf || user?.has_nid_pdf)
    }
  ];

  const completionPercentage = checklist.reduce((acc, item) => acc + (item.isComplete ? item.weight : 0), 0);
  const remainingPercentage = 100 - completionPercentage;
  const missingItems = checklist.filter((item) => !item.isComplete);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('nid', nid);
      if (nidPdf) {
        formData.append('nidPdf', nidPdf);
      }

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update profile');

      if (data.user && updateUser) {
        updateUser(data.user);
      }

      if (completionPercentage === 100 && !isVerified) {
        setStatus('🎉 Profile 100% Complete! Waiting for Super Admin approval.');
      } else {
        setStatus('✓ Profile updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DonorLayout title="Profile">
      <div style={{ width: '100%', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Profile Card Header */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '24px 28px', boxShadow: '0 4px 16px rgba(44,35,32,0.04)', border: '1px solid rgba(44,35,32,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#ffe4db',
                  color: '#c8391b',
                  fontSize: 22,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  textAlign: 'center'
                }}
              >
                {name ? name.substring(0, 2).toUpperCase() : 'DN'}
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#2c2320', margin: 0 }}>
                  {name || 'Donor Profile'}
                </h1>
                <p style={{ fontSize: '13px', color: '#6b5d56', margin: '2px 0 0' }}>
                  {user?.role ? user.role.toUpperCase() : 'DONOR'} ACCOUNT · {address || 'Dhaka, Bangladesh'}
                </p>
              </div>
            </div>

            <div
              style={{
                background: isVerified ? '#ecfdf5' : completionPercentage === 100 ? '#eff6ff' : '#fff7ed',
                border: isVerified ? '1px solid #a7f3d0' : completionPercentage === 100 ? '1px solid #bfdbfe' : '1px solid #fed7aa',
                color: isVerified ? '#047857' : completionPercentage === 100 ? '#1d4ed8' : '#c2410c',
                padding: '8px 16px',
                borderRadius: '100px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {isVerified
                ? '✅ Verified Donor'
                : completionPercentage === 100
                ? '⏳ 100% Complete — Waiting for Super Admin Approval'
                : '⏳ Pending Profile Completion & NID'}
            </div>
          </div>

          {/* Profile Completion Progress Bar */}
          <div style={{ marginTop: '20px', background: '#fcf8f6', padding: '14px 18px', borderRadius: '14px', border: '1px solid #f4ece8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#2c2320' }}>
                  📊 Profile Completion: {completionPercentage}%
                </span>
                {completionPercentage === 100 ? (
                  <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                    100% Complete
                  </span>
                ) : (
                  <span style={{ background: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}>
                    {remainingPercentage}% Remaining
                  </span>
                )}
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: completionPercentage === 100 ? '#059669' : '#ea580c' }}>
                {completionPercentage === 100
                  ? isVerified ? '✓ Verified Donor Account' : '⏳ Waiting for Admin Approval'
                  : `${remainingPercentage}% remaining to reach 100%`}
              </span>
            </div>

            <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '100px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${completionPercentage}%`,
                  height: '100%',
                  background: completionPercentage === 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ff6b4a, #ea580c)',
                  borderRadius: '100px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Clean Profile Breakdown: Just Titles & Status (No Explanations) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '22px 28px',
            boxShadow: '0 4px 16px rgba(44,35,32,0.04)',
            border: '1px solid rgba(44,35,32,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#2c2320' }}>
              📋 Profile Breakdown: Why is it at {completionPercentage}%?
            </h3>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '10px',
                background: completionPercentage === 100 ? '#ecfdf5' : '#fff7ed',
                color: completionPercentage === 100 ? '#047857' : '#c2410c',
                border: completionPercentage === 100 ? '1px solid #a7f3d0' : '1px solid #fed7aa'
              }}
            >
              {completionPercentage === 100 ? 'All 6 Items Completed' : `${missingItems.length} Missing Fields`}
            </span>
          </div>

          {/* Checklist rows: Just title, percentage & completed/missing pill */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {checklist.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: item.isComplete ? '#f0fdf4' : '#fff7ed',
                  border: item.isComplete ? '1px solid #bbf7d0' : '1px solid #fed7aa'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>
                    {item.isComplete ? '✅' : '⚠️'}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: item.isComplete ? '#166534' : '#9a3412' }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: item.isComplete ? '#15803d' : '#c2410c' }}>
                    ({item.weight}%)
                  </span>
                </div>

                <div>
                  {item.isComplete ? (
                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '10px' }}>
                      Completed
                    </span>
                  ) : (
                    <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '10px' }}>
                      Missing (+{item.weight}%)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Editor Form */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 16px rgba(44,35,32,0.04)', border: '1px solid rgba(44,35,32,0.06)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#2c2320', margin: '0 0 16px', borderBottom: '1px solid #f4ece8', paddingBottom: '12px' }}>
            Edit Account &amp; Verification Details
          </h2>

          {status && (
            <div style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>
              {status}
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
              <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: '#2c2320', width: '100%', boxSizing: 'border-box' }}>
                <span>Full Name (15%) *</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Abdur Rahman"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e0d8d3', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: '#2c2320', width: '100%', boxSizing: 'border-box' }}>
                <span>Mobile Number (15%) *</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="017XXXXXXXX"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e0d8d3', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
              <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: '#2c2320', width: '100%', boxSizing: 'border-box' }}>
                <span>Email Address (15%) *</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e0d8d3', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: '#2c2320', width: '100%', boxSizing: 'border-box' }}>
                <span>NID / ID Number (15%) *</span>
                <input
                  type="text"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  required
                  placeholder="10, 13, or 17 digit NID"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e0d8d3', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
                />
              </label>
            </div>

            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: '#2c2320', width: '100%', boxSizing: 'border-box' }}>
              <span>Default Pickup Address (25%) *</span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House, Road, Area, Dhaka"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e0d8d3', fontSize: 14, boxSizing: 'border-box', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6, fontSize: 13, fontWeight: 600, color: '#2c2320', width: '100%', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>NID Document (PDF or Photo) (15%) *</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '8px',
                    background: user?.has_nid_pdf || nidPdf ? '#ecfdf5' : '#fef2f2',
                    color: user?.has_nid_pdf || nidPdf ? '#047857' : '#991b1b'
                  }}
                >
                  {nidPdf ? 'New File Selected' : user?.has_nid_pdf ? '✓ Uploaded on File' : '⚠️ Missing Document'}
                </span>
              </div>
              <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setNidPdf(e.target.files[0] || null)}
                style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid #e0d8d3', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#ff684e',
                color: '#ffffff',
                border: 0,
                borderRadius: '12px',
                padding: '14px 24px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '12px',
                boxShadow: '0 4px 12px rgba(255, 104, 78, 0.3)'
              }}
            >
              {saving ? 'Saving Profile...' : 'Save Profile Changes →'}
            </button>
          </form>
        </div>

        {/* Security & Password Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '24px 32px',
            border: '1px solid #f0eae5',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800, color: '#2c2320' }}>
              🔐 Password & Security
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#786d66' }}>
              Need to change or reset your password? Submit an authorized request to Super Admin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            style={{
              background: '#f4f0ec',
              color: '#2c2320',
              border: '1px solid #e0d8d3',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Request Password Change →
          </button>
        </div>
      </div>

      <PasswordResetRequestModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        user={user}
        token={token}
      />
    </DonorLayout>
  );
};

export default Profile;
