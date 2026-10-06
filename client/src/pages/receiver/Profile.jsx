import React, { useState, useEffect } from 'react';
import ReceiverLayout from '../../components/receiver/ReceiverLayout';
import PasswordResetRequestModal from '../../components/common/PasswordResetRequestModal';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';
import { getAnonymousMode, setAnonymousMode as persistAnonymousMode } from '../../services/receiverData';

export const ReceiverProfile = () => {
  const { user, token, updateUser } = useAuth();

  const [isAnonymous, setIsAnonymous] = useState(getAnonymousMode());
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || (user?.thana ? `${user.thana}, ${user.district || 'Dhaka'}` : ''),
    nid: user?.nid || ''
  });
  const [nidPdfFile, setNidPdfFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || (user.thana ? `${user.thana}, ${user.district || 'Dhaka'}` : ''),
        nid: user.nid || ''
      });
    }
  }, [user]);

  // 6 profile completion criteria summing to 100%
  const checklist = [
    {
      id: 'name',
      label: 'Full Name',
      weight: 15,
      isComplete: Boolean(profileData.name && profileData.name.trim())
    },
    {
      id: 'phone',
      label: 'Mobile Number',
      weight: 15,
      isComplete: Boolean(profileData.phone && profileData.phone.trim())
    },
    {
      id: 'email',
      label: 'Email Address',
      weight: 15,
      isComplete: Boolean(profileData.email && profileData.email.trim())
    },
    {
      id: 'address',
      label: 'Location / Address',
      weight: 25,
      isComplete: Boolean(profileData.address && profileData.address.trim())
    },
    {
      id: 'nid',
      label: 'National ID (NID) Number',
      weight: 15,
      isComplete: Boolean(profileData.nid && profileData.nid.trim())
    },
    {
      id: 'nidDoc',
      label: 'NID Document (PDF or Photo)',
      weight: 15,
      isComplete: Boolean(nidPdfFile || user?.has_nid_pdf)
    }
  ];

  const completionPercentage = checklist.reduce((acc, item) => acc + (item.isComplete ? item.weight : 0), 0);
  const remainingPercentage = 100 - completionPercentage;
  const missingItems = checklist.filter((item) => !item.isComplete);

  const handleToggleAnonymous = () => {
    const next = !isAnonymous;
    setIsAnonymous(next);
    persistAnonymousMode(next);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', profileData.name);
      formData.append('email', profileData.email);
      formData.append('phone', profileData.phone);
      formData.append('address', profileData.address);
      formData.append('nid', profileData.nid);
      if (nidPdfFile) {
        formData.append('nidPdf', nidPdfFile);
      }

      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      if (data.user && updateUser) {
        updateUser(data.user);
      }

      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    alert('Account deletion requested. Please contact Super Admin for final data removal.');
    setDeleteModalOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'RA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isVerified = user?.verification_status === 'verified';

  return (
    <ReceiverLayout title="Profile">
      <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Success Alert */}
        {saveSuccess && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '14px 18px', borderRadius: '16px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✓</span> Profile information &amp; documents updated successfully!
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '14px 18px', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Header Profile Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#2c2320' }}>
              Receiver Profile
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsEditing(!isEditing);
                setError('');
              }}
              style={{
                background: isEditing ? 'var(--brand-primary)' : '#ffffff',
                color: isEditing ? '#ffffff' : 'var(--brand-primary)',
                border: '1.5px solid var(--brand-primary)',
                borderRadius: '24px',
                padding: '8px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* User Avatar & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#e0f2fe',
                color: '#0284c7',
                fontSize: '20px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {getInitials(profileData.name)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#2c2320' }}>
                  {profileData.name || 'Food Seeker'}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 12px',
                    borderRadius: '12px',
                    background: isVerified ? '#ecfdf5' : '#fffbeb',
                    color: isVerified ? '#047857' : '#b45309',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: isVerified ? '1px solid #a7f3d0' : '1px solid #fde68a'
                  }}
                >
                  <span>{isVerified ? '🛡️' : '⏳'}</span>
                  <span>{isVerified ? 'Super Admin Verified' : 'Pending Super Admin Verification'}</span>
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#786d66', marginTop: '4px' }}>
                Food Seeker (Receiver) · {profileData.address || 'Dhaka, Bangladesh'}
              </div>
            </div>
          </div>

          {/* Profile Completion Progress Bar */}
          <div
            style={{
              background: '#fcf9f6',
              padding: '16px 20px',
              borderRadius: '16px',
              border: '1px solid #f0e9e4',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  ? isVerified ? '✓ Verified Account' : '⏳ Waiting for Super Admin Verification'
                  : `${remainingPercentage}% remaining to reach 100%`}
              </span>
            </div>

            {/* Visual Bar */}
            <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '100px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${completionPercentage}%`,
                  height: '100%',
                  background: completionPercentage === 100 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, var(--brand-primary), var(--brand-primary-dark))',
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
            borderRadius: '24px',
            padding: '22px 28px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#2c2320' }}>
              📋 Profile Breakdown: Why is it at {completionPercentage}%?
            </h4>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '10px',
                background: completionPercentage === 100 ? '#ecfdf5' : '#fef2f2',
                color: completionPercentage === 100 ? '#047857' : '#991b1b',
                border: completionPercentage === 100 ? '1px solid #a7f3d0' : '1px solid #fecaca'
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
                  borderRadius: '12px',
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
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        background: 'var(--brand-primary)',
                        color: '#fff',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Missing (+{item.weight}%)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Information & Verification Form */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '28px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#2c2320' }}>
              Account &amp; NID Identity Information
            </h4>
            <span style={{ fontSize: '12px', color: '#786d66' }}>
              {isEditing ? '✏️ Editing Mode' : '🔒 Read Only'}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#786d66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                FULL NAME (15%) *
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: isEditing ? '#ffffff' : '#fcf9f6',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  border: isEditing ? '1.5px solid var(--brand-primary)' : '1px solid #f0e9e4'
                }}
              >
                <span style={{ fontSize: '16px', color: 'var(--brand-primary)' }}>👤</span>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#2c2320' }}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <span style={{ fontSize: '14px', color: '#2c2320', fontWeight: 600 }}>
                    {profileData.name || 'Not provided'}
                  </span>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#786d66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                PHONE NUMBER (15%) *
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: isEditing ? '#ffffff' : '#fcf9f6',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  border: isEditing ? '1.5px solid var(--brand-primary)' : '1px solid #f0e9e4'
                }}
              >
                <span style={{ fontSize: '16px', color: 'var(--brand-primary)' }}>📞</span>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#2c2320' }}
                    placeholder="017XXXXXXXX"
                  />
                ) : (
                  <span style={{ fontSize: '14px', color: '#2c2320', fontWeight: 600 }}>
                    {profileData.phone || 'Not provided'}
                  </span>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#786d66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                EMAIL ADDRESS (15%) *
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: isEditing ? '#ffffff' : '#fcf9f6',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  border: isEditing ? '1.5px solid var(--brand-primary)' : '1px solid #f0e9e4'
                }}
              >
                <span style={{ fontSize: '16px', color: 'var(--brand-primary)' }}>✉️</span>
                {isEditing ? (
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#2c2320' }}
                    placeholder="you@example.com"
                  />
                ) : (
                  <span style={{ fontSize: '14px', color: '#2c2320', fontWeight: 600 }}>
                    {profileData.email || 'Not provided'}
                  </span>
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#786d66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                LOCATION / ADDRESS IN BANGLADESH (25%) *
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: isEditing ? '#ffffff' : '#fcf9f6',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  border: isEditing ? '1.5px solid var(--brand-primary)' : '1px solid #f0e9e4'
                }}
              >
                <span style={{ fontSize: '16px', color: 'var(--brand-primary)' }}>📍</span>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#2c2320' }}
                    placeholder="e.g. Dhanmondi, Dhaka or Uttara, Dhaka"
                  />
                ) : (
                  <span style={{ fontSize: '14px', color: '#2c2320', fontWeight: 600 }}>
                    {profileData.address || 'Not provided'}
                  </span>
                )}
              </div>
            </div>

            {/* NID Number */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#786d66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                NATIONAL ID (NID) NUMBER (15%) *
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: isEditing ? '#ffffff' : '#fcf9f6',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  border: isEditing ? '1.5px solid var(--brand-primary)' : '1px solid #f0e9e4'
                }}
              >
                <span style={{ fontSize: '16px', color: 'var(--brand-primary)' }}>🪪</span>
                {isEditing ? (
                  <input
                    type="text"
                    required
                    value={profileData.nid}
                    onChange={(e) => setProfileData({ ...profileData, nid: e.target.value })}
                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px', color: '#2c2320' }}
                    placeholder="10, 13, or 17 digit NID Number"
                  />
                ) : (
                  <span style={{ fontSize: '14px', color: '#2c2320', fontWeight: 600 }}>
                    {profileData.nid || '⚠️ NID number not provided'}
                  </span>
                )}
              </div>
            </div>

            {/* NID Document File Upload (15%) */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#786d66', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                NID DOCUMENT (PDF OR IMAGE) (15%) *
              </label>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: isEditing ? '#ffffff' : '#fcf9f6',
                  borderRadius: '14px',
                  padding: '16px',
                  border: isEditing ? '1.5px solid var(--brand-primary)' : '1px solid #f0e9e4'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📄</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#2c2320' }}>
                      Official NID File
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      background: user?.has_nid_pdf || nidPdfFile ? '#ecfdf5' : '#fef2f2',
                      color: user?.has_nid_pdf || nidPdfFile ? '#047857' : '#991b1b'
                    }}
                  >
                    {nidPdfFile ? 'New File Selected' : user?.has_nid_pdf ? '✓ Uploaded on File' : '⚠️ Missing File'}
                  </span>
                </div>

                {isEditing ? (
                  <div>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => setNidPdfFile(e.target.files[0] || null)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px solid #e0d8d3',
                        fontSize: '13px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: user?.has_nid_pdf ? '#059669' : '#dc2626', fontWeight: 500 }}>
                    {user?.has_nid_pdf
                      ? '✓ Document submitted on file for Super Admin review.'
                      : '⚠️ No NID document uploaded yet. Click "Edit Profile" to upload your NID.'}
                  </div>
                )}
              </div>
            </div>

            {/* Save Buttons */}
            {isEditing && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    background: 'var(--brand-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '14px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(var(--brand-primary-rgb), 0.25)'
                  }}
                >
                  {saving ? 'Saving & Uploading...' : 'Save Profile & Documents →'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                  }}
                  style={{
                    padding: '14px 20px',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#4b5563',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Anonymous Mode Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', color: 'var(--brand-primary)' }}>👁️</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#2c2320' }}>
                Anonymous Mode
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: isAnonymous ? '#ffedd5' : '#f3f4f6',
                  color: isAnonymous ? '#c2410c' : '#6b7280',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                {isAnonymous ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleAnonymous}
              style={{
                width: '48px',
                height: '26px',
                borderRadius: '14px',
                background: isAnonymous ? 'var(--brand-primary)' : '#d1d5db',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                padding: 2
              }}
              aria-label="Toggle Anonymous Mode"
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: 2,
                  left: isAnonymous ? '24px' : '2px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              />
            </button>
          </div>

          <p style={{ margin: 0, fontSize: '13px', color: '#786d66', lineHeight: '20px' }}>
            Your name is hidden from donors &amp; NGOs in Bangladesh. Admin can still see your identity for safety and verification purposes.
          </p>
        </div>

        {/* Security & Password Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '24px 28px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
            border: '1px solid rgba(44, 35, 32, 0.06)',
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
              Need to change or reset your food seeker account password? Submit a request to Super Admin.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            style={{
              background: '#faf6f3',
              color: '#2c2320',
              border: '1px solid rgba(44, 35, 32, 0.15)',
              borderRadius: '14px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Request Password Change →
          </button>
        </div>

        {/* Delete Account Link */}
        <div style={{ paddingLeft: '4px' }}>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Delete Account
          </button>
        </div>

      </div>

      <PasswordResetRequestModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        user={user}
        token={token}
      />

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '20px'
          }}
          onClick={() => setDeleteModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>
              Delete Account?
            </h3>
            <p style={{ fontSize: '13px', color: '#6b5d56', lineHeight: '20px', marginBottom: '20px' }}>
              This action will irreversibly remove your food request records and verification badge.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ReceiverLayout>
  );
};

export default ReceiverProfile;
