import React, { useState, useEffect } from 'react';
import ReceiverLayout from '../../components/receiver/ReceiverLayout';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';

export const ReceiverHistory = () => {
  const { token } = useAuth();
  const [timeFilter, setTimeFilter] = useState('all');
  const [historyRows, setHistoryRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reporting modal states
  const [reportingItem, setReportingItem] = useState(null);
  const [viewingReport, setViewingReport] = useState(null);
  const [reportReason, setReportReason] = useState('Spoiled / Stale Food');
  const [reportDescription, setReportDescription] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportSuccess, setReportSuccess] = useState('');

  useEffect(() => {
    fetchHistoryFromDB();
  }, [token]);

  // Fetch history purely from DB (fulfilled/completed meal requests)
  const fetchHistoryFromDB = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [reqRes, repRes] = await Promise.all([
        fetch(`${API_BASE_URL}/food-requests/my-requests`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/food-reports/my-reports`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      let myReports = [];
      if (repRes.ok) {
        const repData = await repRes.json();
        myReports = repData.reports || [];
      }

      if (reqRes.ok) {
        const data = await reqRes.json();
        if (data && data.data) {
          // Filter strictly for completed/fulfilled requests
          const completed = data.data.filter(
            (r) =>
              (r.status || '').toLowerCase() === 'fulfilled' ||
              (r.status || '').toLowerCase() === 'completed'
          );

          const formatted = completed.map((r) => {
            // Check if there is an existing report for this request
            const matchedReport = myReports.find(
              (rep) => Number(rep.food_request_id) === Number(r.id)
            );

            return {
              id: r.id,
              foodRequestId: r.id,
              foodPostId: r.food_post_id,
              donorId: r.donor_id,
              date: r.updated_at
                ? new Date(r.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Recent',
              rawDate: r.updated_at ? new Date(r.updated_at) : new Date(),
              foodName: r.food_name || r.food_title || r.food_type || 'Cooked Food',
              food: `${r.food_name || r.food_title || r.food_type || 'Cooked Food'} (${r.requested_quantity || 1} portions)`,
              source: r.donor_name || 'Community Donor',
              location: `${r.thana || 'Dhaka'}, ${r.district || 'Bangladesh'}`,
              ngoRating: 5,
              donorRating: 5,
              report: matchedReport || (r.report_id ? {
                id: r.report_id,
                status: r.report_status,
                reason: r.report_reason,
                description: r.report_description,
                proof_image_url: r.proof_image_url,
                admin_notes: r.report_admin_notes,
                created_at: r.report_created_at
              } : null)
            };
          });

          setHistoryRows(formatted);
        } else {
          setHistoryRows([]);
        }
      }
    } catch (err) {
      console.error('Error fetching history from DB:', err);
      setHistoryRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReportModal = (row) => {
    setReportingItem(row);
    setReportReason('Spoiled / Stale Food');
    setReportDescription('');
    setProofFile(null);
    setProofPreview('');
    setReportError('');
    setReportSuccess('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setReportError('Please select a valid image file (JPG, PNG, WEBP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setReportError('Image size exceeds 5MB limit. Please choose a smaller file.');
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
      setReportError('');
    }
  };

  const handleRemovePhoto = () => {
    setProofFile(null);
    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
      setProofPreview('');
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportingItem) return;

    if (!reportDescription.trim()) {
      setReportError('Please provide a brief description explaining the issue.');
      return;
    }

    setSubmittingReport(true);
    setReportError('');

    try {
      const formData = new FormData();
      formData.append('food_request_id', reportingItem.foodRequestId);
      if (reportingItem.foodPostId) formData.append('food_post_id', reportingItem.foodPostId);
      if (reportingItem.donorId) formData.append('donor_id', reportingItem.donorId);
      formData.append('food_name', reportingItem.foodName);
      formData.append('donor_name', reportingItem.source);
      formData.append('reason', reportReason);
      formData.append('description', reportDescription);
      if (proofFile) {
        formData.append('proof_image', proofFile);
      }

      const res = await fetch(`${API_BASE_URL}/food-reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit report.');
      }

      // Update local item
      setHistoryRows((prev) =>
        prev.map((r) =>
          r.id === reportingItem.id
            ? { ...r, report: data.report || { status: 'pending', reason: reportReason, description: reportDescription, proof_image_url: proofPreview } }
            : r
        )
      );

      setReportSuccess('Your report and photo proof have been sent to the Super Admin team.');
      setTimeout(() => {
        setReportingItem(null);
        setReportSuccess('');
        handleRemovePhoto();
      }, 1600);
    } catch (err) {
      setReportError(err.message || 'Error submitting report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  // Filter based on selected time dropdown
  const filteredRows = historyRows.filter((r) => {
    if (timeFilter === 'all') return true;
    const now = new Date();
    const rowDate = r.rawDate;
    if (timeFilter === 'month') {
      return (
        rowDate.getMonth() === now.getMonth() &&
        rowDate.getFullYear() === now.getFullYear()
      );
    }
    if (timeFilter === '3months') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return rowDate >= threeMonthsAgo;
    }
    if (timeFilter === 'year') {
      return rowDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return { label: '🚩 Reported (Pending)', bg: '#fff7ed', color: '#c2410c', border: '#fdba74' };
      case 'investigating':
        return { label: '🔍 Under Investigation', bg: 'var(--brand-soft)', color: 'var(--brand-primary-dark)', border: '#93c5fd' };
      case 'resolved':
        return { label: '✅ Resolved', bg: '#ecfdf5', color: '#047857', border: '#6ee7b7' };
      case 'dismissed':
        return { label: 'ℹ️ Dismissed', bg: '#f3f4f6', color: '#4b5563', border: '#d1d5db' };
      default:
        return { label: '🚩 Reported', bg: '#fff7ed', color: '#c2410c', border: '#fdba74' };
    }
  };

  return (
    <ReceiverLayout title="History">
      <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Top Header & Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
              Completed Meal Pickups &amp; History
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#786d66' }}>
              Review past distributed food packages. Report any quality, safety, or hygiene issues with photo proof directly to the Super Admin.
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{
                appearance: 'none',
                background: '#ffffff',
                border: '1px solid rgba(44, 35, 32, 0.1)',
                borderRadius: '20px',
                padding: '8px 36px 8px 16px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#2c2320',
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
              }}
            >
              <option value="all">All time</option>
              <option value="month">This month</option>
              <option value="3months">Past 3 months</option>
              <option value="year">This year</option>
            </select>
            <span
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '11px',
                color: '#786d66',
                pointerEvents: 'none'
              }}
            >
              ▼
            </span>
          </div>
        </div>

        {/* Loading / Content */}
        {loading ? (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#888' }}>
            Loading history records...
          </div>
        ) : filteredRows.length === 0 ? (
          /* Explicit Empty State if no history in DB */
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '48px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
              border: '1px solid rgba(44, 35, 32, 0.06)',
              color: '#786d66'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📜</div>
            <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
              No history available yet.
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#786d66' }}>
              Once you have picked up meals from local donors or NGOs in Bangladesh, your fulfilled meal records will be saved here.
            </p>
          </div>
        ) : (
          /* History Table Container */
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
              border: '1px solid rgba(44, 35, 32, 0.06)'
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(44, 35, 32, 0.06)', background: '#faf6f3' }}>
                    <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#786d66' }}>Date</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#786d66' }}>Food Details</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#786d66' }}>Source &amp; Location</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#786d66' }}>Ratings</th>
                    <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#786d66', textAlign: 'center' }}>Safety &amp; Issue Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, index) => {
                    const badge = row.report ? getStatusBadge(row.report.status) : null;
                    return (
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: index < filteredRows.length - 1 ? '1px solid rgba(44, 35, 32, 0.05)' : 'none',
                          transition: 'background 0.15s ease'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.background = '#fcf8f6')}
                        onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6b5d56', whiteSpace: 'nowrap' }}>
                          {row.date}
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 700, color: '#2c2320' }}>
                          <div>{row.food}</div>
                          <div style={{ fontSize: '11px', fontWeight: 500, color: '#a39891', marginTop: '2px' }}>
                            Request ID #{row.id}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px', color: '#6b5d56' }}>
                          <span style={{ fontWeight: 600, color: '#2c2320' }}>{row.source}</span>
                          <div style={{ fontSize: '12px', color: '#8c7e75', marginTop: '2px' }}>{row.location}</div>
                        </td>
                        <td style={{ padding: '16px 20px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{ fontSize: '12px', color: '#6b5d56' }}>
                              Donor: <strong style={{ color: '#f59e0b' }}>⭐ {row.donorRating}</strong>
                            </span>
                            <span style={{ fontSize: '12px', color: '#6b5d56' }}>
                              NGO: <strong style={{ color: '#f59e0b' }}>⭐ {row.ngoRating}</strong>
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {row.report ? (
                            <button
                              type="button"
                              onClick={() => setViewingReport(row)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                background: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'transform 0.1s'
                              }}
                              title="Click to view report details, attached proof, and admin status"
                            >
                              <span>{badge.label}</span>
                              {row.report.proof_image_url && <span title="Photo attached">📷</span>}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenReportModal(row)}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '10px',
                                background: '#fff1ed',
                                color: '#e04f2f',
                                border: '1px solid rgba(224, 79, 47, 0.25)',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.background = '#e04f2f';
                                e.currentTarget.style.color = '#ffffff';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.background = '#fff1ed';
                                e.currentTarget.style.color = '#e04f2f';
                              }}
                            >
                              <span>🚩 Report Food</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submit Food Report Modal */}
        {reportingItem && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '540px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '92vh'
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  background: '#faf6f3',
                  borderBottom: '1px solid rgba(44,35,32,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🚩</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#2c2320' }}>
                      Report Food Safety / Quality Issue
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#786d66' }}>
                      Attach photo proof to help the Super Admin team investigate
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReportingItem(null)}
                  style={{ background: 'transparent', border: 'none', fontSize: '20px', color: '#888', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div style={{ padding: '16px 24px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Meal Summary Info Box */}
                <div
                  style={{
                    background: '#fef6ee',
                    border: '1px solid #fed7aa',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#9a3412' }}>
                    🍲 {reportingItem.food}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7c2d12' }}>
                    Donor: <strong>{reportingItem.source}</strong> · Received: {reportingItem.date}
                  </div>
                </div>

                <form onSubmit={handleSubmitReport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {reportError && (
                    <div
                      style={{
                        background: '#fef2f2',
                        color: '#b91c1c',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: '1px solid #fecaca'
                      }}
                    >
                      ⚠️ {reportError}
                    </div>
                  )}

                  {reportSuccess && (
                    <div
                      style={{
                        background: '#ecfdf5',
                        color: '#047857',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        border: '1px solid #a7f3d0'
                      }}
                    >
                      ✅ {reportSuccess}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                      Issue Category:
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(44,35,32,0.15)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#2c2320',
                        outline: 'none',
                        background: '#fff'
                      }}
                    >
                      <option value="Spoiled / Stale Food">Spoiled or Stale Food (Smell / Taste / Mold)</option>
                      <option value="Hygiene / Contamination Issue">Hygiene or Contamination Concern</option>
                      <option value="Damaged / Unsealed Packaging">Damaged, Leaking, or Unsealed Packaging</option>
                      <option value="Incorrect Quantity / Missing Items">Incorrect Quantity / Missing Portions</option>
                      <option value="Mislabeled Food (Non-Veg as Veg)">Mislabeled Food (Non-Veg labeled as Veg / Allergen)</option>
                      <option value="Food Not Handed Over">Food was not handed over / Missing distribution</option>
                      <option value="Other Quality or Safety Concern">Other Quality or Safety Concern</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                      Describe the Issue in Detail:
                    </label>
                    <textarea
                      rows={3}
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Please provide specific details (e.g. food odor, state of packaging, missing packets, time of consumption) so the Super Admin can take appropriate action..."
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: '1px solid rgba(44,35,32,0.15)',
                        fontSize: '13px',
                        color: '#2c2320',
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Photo Proof Upload Section */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                      📷 Attach Photo Proof (Recommended):
                    </label>
                    
                    {!proofPreview ? (
                      <div
                        style={{
                          border: '2px dashed rgba(44,35,32,0.18)',
                          borderRadius: '12px',
                          padding: '20px',
                          textAlign: 'center',
                          background: '#faf6f3',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s'
                        }}
                        onClick={() => document.getElementById('report-photo-input').click()}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = '#e04f2f')}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(44,35,32,0.18)')}
                      >
                        <input
                          id="report-photo-input"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                        />
                        <div style={{ fontSize: '26px', marginBottom: '4px' }}>📸</div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#2c2320' }}>
                          Click to upload meal photo proof
                        </div>
                        <div style={{ fontSize: '11px', color: '#786d66', marginTop: '3px' }}>
                          Supports JPG, PNG, WEBP (Max 5MB)
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          position: 'relative',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          border: '1px solid #fed7aa',
                          background: '#fff'
                        }}
                      >
                        <img
                          src={proofPreview}
                          alt="Proof preview"
                          style={{
                            width: '100%',
                            maxHeight: '180px',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            display: 'flex',
                            gap: '6px'
                          }}
                        >
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            style={{
                              background: 'rgba(0,0,0,0.7)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ✕ Remove
                          </button>
                        </div>
                        <div
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            color: '#047857',
                            fontWeight: 600,
                            background: '#ecfdf5',
                            borderTop: '1px solid #a7f3d0'
                          }}
                        >
                          ✓ Photo attached: {proofFile?.name} ({(proofFile.size / 1024).toFixed(0)} KB)
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '11px', color: '#786d66', lineHeight: '15px' }}>
                    🔒 Photos help verify safety violations. Verified reports protect receivers and ensure meal quality standards.
                  </div>

                  {/* Modal Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setReportingItem(null)}
                      disabled={submittingReport}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '10px',
                        border: '1px solid rgba(44,35,32,0.15)',
                        background: '#fff',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#6b5d56',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingReport}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: submittingReport ? '#fca5a5' : '#e04f2f',
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#fff',
                        cursor: submittingReport ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(224, 79, 47, 0.3)'
                      }}
                    >
                      {submittingReport ? 'Submitting Report...' : 'Submit Food Report'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Submitted Report Details Modal */}
        {viewingReport && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px'
            }}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '520px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
              }}
            >
              <div
                style={{
                  padding: '18px 24px',
                  background: '#faf6f3',
                  borderBottom: '1px solid rgba(44,35,32,0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📋</span>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#2c2320' }}>
                    Food Report Status
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingReport(null)}
                  style={{ background: 'transparent', border: 'none', fontSize: '20px', color: '#888', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#6b5d56' }}>Report Status:</span>
                  {(() => {
                    const badge = getStatusBadge(viewingReport.report?.status);
                    return (
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      >
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>

                <div style={{ background: '#fcf8f6', padding: '12px 16px', borderRadius: '12px', fontSize: '13px' }}>
                  <div style={{ fontWeight: 700, color: '#2c2320' }}>{viewingReport.food}</div>
                  <div style={{ color: '#786d66', marginTop: '2px' }}>Donor: {viewingReport.source}</div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#786d66', textTransform: 'uppercase' }}>
                    Reason Filed
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#2c2320', marginTop: '4px' }}>
                    {viewingReport.report?.reason || 'Food Quality Issue'}
                  </div>
                </div>

                {viewingReport.report?.description && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#786d66', textTransform: 'uppercase' }}>
                      Your Submitted Notes
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#443b37',
                        marginTop: '4px',
                        background: '#f8fafc',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        lineHeight: '18px'
                      }}
                    >
                      {viewingReport.report.description}
                    </div>
                  </div>
                )}

                {/* Attached Photo Proof */}
                {viewingReport.report?.proof_image_url && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#786d66', textTransform: 'uppercase', marginBottom: '6px' }}>
                      📷 Attached Photo Proof
                    </div>
                    <a
                      href={viewingReport.report.proof_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Click to view full image in a new tab"
                      style={{ display: 'block', textDecoration: 'none' }}
                    >
                      <img
                        src={viewingReport.report.proof_image_url}
                        alt="Proof of issue"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          display: 'block'
                        }}
                      />
                    </a>
                    <span style={{ fontSize: '11px', color: '#888', display: 'block', marginTop: '4px' }}>
                      🔍 Click image to view in full resolution
                    </span>
                  </div>
                )}

                {viewingReport.report?.admin_notes && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#047857', textTransform: 'uppercase' }}>
                      Super Admin Investigation Feedback
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: '#065f46',
                        marginTop: '4px',
                        background: '#ecfdf5',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #a7f3d0',
                        lineHeight: '18px'
                      }}
                    >
                      {viewingReport.report.admin_notes}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setViewingReport(null)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '10px',
                      background: '#2c2320',
                      color: '#fff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </ReceiverLayout>
  );
};

export default ReceiverHistory;
