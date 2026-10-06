import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../utils/constants';

export const MyRequestsModal = ({ isOpen, onClose, token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  useEffect(() => {
    if (isOpen && token) {
      fetchMyRequests();
    }
  }, [isOpen, token]);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/my-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('Error fetching my requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (requestId, file) => {
    if (!file) return;
    setUploadingId(requestId);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('receipt_photo', file);

    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/${requestId}/receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setUploadSuccess(`Receipt photo uploaded successfully for Request #${requestId}!`);
        fetchMyRequests();
      } else {
        setUploadError(data.message || 'Failed to upload receipt photo.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Network error uploading proof of receipt.');
    } finally {
      setUploadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 3500 }}>
      <div style={{ width: '100%', maxWidth: '640px', background: '#ffffff', borderRadius: '24px', padding: '28px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#2c2320', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee5e0', paddingBottom: '14px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, fontFamily: "'Fraunces', serif" }}>
              📋 My Food Requests &amp; Pickup Codes
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b5d56' }}>
              Present your pickup code when collecting food &amp; upload proof of receipt photos.
            </p>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 0, borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
        </div>

        {uploadSuccess && (
          <div style={{ background: '#e3f5ea', color: '#166534', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            ✅ {uploadSuccess}
          </div>
        )}

        {uploadError && (
          <div style={{ background: '#fde8e8', color: '#991b1b', padding: '12px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
            ⚠️ {uploadError}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>Loading your food requests...</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#faf5f2', borderRadius: '16px', color: '#6b5d56' }}>
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🍱</span>
            You haven't requested any food yet. Browse live food posts on Find Food to make a request!
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {requests.map((req) => {
              const statusColors = {
                requested: { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' },
                approved: { bg: '#eff6ff', text: '#1d4ed8', border: '#dbeafe' },
                fulfilled: { bg: '#f0fdf4', text: '#15803d', border: '#dcfce7' },
                rejected: { bg: '#fef2f2', text: '#b91c1c', border: '#fee2e2' },
                cancelled: { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' }
              };
              const color = statusColors[req.status] || statusColors.requested;

              return (
                <div key={req.id} style={{ background: '#faf5f2', border: `1px solid ${color.border}`, borderRadius: '16px', padding: '18px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <span style={{ background: '#ffffff', border: '1px solid #e0d8d3', color: '#2c2320', padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>
                        {req.food_type || 'Food Request'} • {req.requested_quantity} Serving(s)
                      </span>
                      <h4 style={{ margin: '8px 0 2px', fontSize: '16px', fontWeight: 700 }}>
                        📍 {req.district}, {req.thana}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#6b5d56' }}>
                        Donor: {req.donor_name || 'Anonymous Donor'} {req.donor_phone ? `(${req.donor_phone})` : ''}
                      </div>
                    </div>

                    <span style={{ background: color.bg, color: color.text, padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: 800, border: `1px solid ${color.border}` }}>
                      {req.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Pickup Code Display */}
                  <div style={{ background: '#ffffff', border: '2px dashed #2563eb', borderRadius: '14px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#888', fontWeight: 700 }}>Your Unique Pickup Code</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: '#1e40af', letterSpacing: '1px', fontFamily: 'monospace' }}>
                        {req.pickup_code}
                      </div>
                    </div>
                    {req.is_anonymous && (
                      <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 700 }}>
                        🕵️ Identity Masked
                      </span>
                    )}
                  </div>

                  {/* Proof of Receipt Section */}
                  <div style={{ borderTop: '1px solid #e5ded8', paddingTop: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: '#2c2320' }}>
                      📸 Proof of Receipt Photo
                    </div>

                    {req.receipt_photo_url ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#ffffff', padding: '8px 12px', borderRadius: '10px', border: '1px solid #e0d8d3' }}>
                        <img
                          src={`${API_BASE_URL.replace('/api', '')}${req.receipt_photo_url}`}
                          alt="Receipt Proof"
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>✅ Proof Uploaded &amp; Confirmed</div>
                          <div style={{ fontSize: '11px', color: '#888' }}>Fulfilled: {req.fulfilled_at ? new Date(req.fulfilled_at).toLocaleString() : 'Yes'}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <label style={{ background: '#2c2320', color: '#ffffff', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-block' }}>
                          {uploadingId === req.id ? 'Uploading Photo...' : '📷 Attach Receipt Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(req.id, e.target.files[0])}
                            disabled={uploadingId === req.id}
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ fontSize: '11px', color: '#888' }}>
                          Upload photo when food is collected to mark fulfilled.
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button onClick={onClose} style={{ background: '#2563eb', color: '#ffffff', border: 0, padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};

export default MyRequestsModal;
