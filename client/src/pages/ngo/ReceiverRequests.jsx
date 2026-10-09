import React, { useState, useEffect } from 'react';
import NgoLayout from '../../components/ngo/NgoLayout';
import { API_BASE_URL } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export const ReceiverRequests = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickCode, setQuickCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [verificationFeedback, setVerificationFeedback] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/incoming`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data || []);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error('Error fetching receiver requests:', err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchRequests();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update request');
      }
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handlePaymentAction = async (id, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/${id}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        setVerificationFeedback({ success: true, message: data.message });
        fetchRequests();
      } else {
        alert(data.message || 'Could not update payment status.');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      alert('Failed to connect to server while updating payment.');
    }
  };

  // Dedicated action to complete food pickup
  const handleCompletePickup = async (id, receiverName) => {
    const confirmPrompt = receiverName
      ? `Confirm food handover and mark pickup completed for ${receiverName}?`
      : 'Confirm food handover and mark pickup completed?';
    if (!window.confirm(confirmPrompt)) {
      return;
    }
    setCompletingId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'fulfilled' })
      });
      if (res.ok) {
        setVerificationFeedback({
          success: true,
          message: `🎉 Food pickup successfully marked as completed for ${receiverName || 'beneficiary'}!`
        });
        fetchRequests();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to complete food pickup');
      }
    } catch (err) {
      console.error('Pickup completion error:', err);
      alert('Failed to connect to server');
    } finally {
      setCompletingId(null);
    }
  };

  // ONLY verify the receiver code (does not fulfill or complete the pickup)
  const handleVerifyQuickCode = async (codeToVerify) => {
    const code = (codeToVerify || quickCode).trim();
    if (!code) {
      alert('Please enter a pickup code to verify.');
      return;
    }
    setVerifying(true);
    setVerificationFeedback(null);

    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pickup_code: code })
      });
      const data = await res.json();
      if (res.ok && data.valid !== false) {
        setVerificationFeedback({
          success: true,
          message: data.message,
          request: data.data
        });
        setQuickCode('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setVerificationFeedback({
          success: false,
          message: data.message || 'Invalid code'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationFeedback({ success: false, message: 'Network error during verification' });
    } finally {
      setVerifying(false);
    }
  };

  // Split into incoming requests, active pickup codes, and completed/fulfilled handovers
  const incomingRequests = requests.filter(
    (r) => (r.status || '').toLowerCase() === 'requested'
  );
  const activePickupCodes = requests.filter(
    (r) => (r.status || '').toLowerCase() === 'approved' || (r.status || '').toLowerCase() === 'accepted'
  );
  const fulfilledRequests = requests.filter(
    (r) => (r.status || '').toLowerCase() === 'fulfilled'
  );

  return (
    <NgoLayout title="Receiver Requests">
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '26px' }}>
        
        {/* Header & Quick Code Verification Box */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            padding: '24px 28px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 800, color: '#2c2320' }}>
              Receiver Food Requests & Handover
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#786d66' }}>
              Approve assistance requests and verify 6-character pickup codes when receivers arrive at your hub.
            </p>
          </div>

          {/* Quick Pickup Code Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              value={quickCode}
              onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
              placeholder="e.g. SM-LKUKNR"
              maxLength={12}
              style={{
                background: '#faf6f3',
                border: '1.5px solid rgba(44, 35, 32, 0.15)',
                borderRadius: '16px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#2c2320',
                fontFamily: 'monospace',
                outline: 'none',
                width: '150px'
              }}
            />
            <button
              onClick={() => handleVerifyQuickCode()}
              disabled={verifying}
              style={{
                background: 'var(--brand-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                padding: '11px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: verifying ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(var(--brand-primary-rgb), 0.3)',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--brand-primary-dark)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'var(--brand-primary)')}
            >
              {verifying ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </div>

        {/* Feedback Alert / Verification Result */}
        {verificationFeedback && (
          <div
            style={{
              padding: '16px 22px',
              borderRadius: '16px',
              background: verificationFeedback.success ? '#ecfdf5' : '#fee2e2',
              color: verificationFeedback.success ? '#065f46' : '#991b1b',
              border: `1.5px solid ${verificationFeedback.success ? '#a7f3d0' : '#fecaca'}`,
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{verificationFeedback.success ? '✅' : '❌'}</span>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>{verificationFeedback.message}</span>
              </div>
              <button
                onClick={() => setVerificationFeedback(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800, fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            {verificationFeedback.success && verificationFeedback.request && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #d1fae5',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '13px', color: '#374151' }}>
                  <div>
                    <strong>Beneficiary:</strong> {verificationFeedback.request.receiver_name} {verificationFeedback.request.receiver_phone ? `(📞 ${verificationFeedback.request.receiver_phone})` : ''}
                  </div>
                  <div>
                    <strong>Food:</strong> {verificationFeedback.request.food_name || verificationFeedback.request.food_title || 'Food Donation'} · <strong>Portions:</strong> {verificationFeedback.request.requested_quantity || 1}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Code:</strong> <code style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--brand-primary)', background: '#fff6f3', padding: '1px 6px', borderRadius: '6px' }}>{verificationFeedback.request.pickup_code}</code>
                    <span>·</span>
                    <strong>Status:</strong> <span style={{ textTransform: 'capitalize', fontWeight: 700, color: verificationFeedback.request.status === 'fulfilled' ? '#059669' : '#d97706' }}>{verificationFeedback.request.status}</span>
                  </div>
                </div>

                {verificationFeedback.request.status !== 'fulfilled' && (
                  <button
                    onClick={() => {
                      handleCompletePickup(verificationFeedback.request.id, verificationFeedback.request.receiver_name);
                      setVerificationFeedback(null);
                    }}
                    disabled={completingId === verificationFeedback.request.id}
                    style={{
                      padding: '9px 18px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#059669',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: completingId === verificationFeedback.request.id ? 'wait' : 'pointer',
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#047857')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#059669')}
                  >
                    {completingId === verificationFeedback.request.id ? 'Completing...' : '✓ Complete Food Pickup'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Section 1: Incoming Requests (Figma 8:29318) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(44, 35, 32, 0.06)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2c2320' }}>
              Incoming Requests ({incomingRequests.length})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#888' }}>
              Loading receiver requests...
            </div>
          ) : incomingRequests.length === 0 ? (
            /* Clean Empty State */
            <div style={{ padding: '42px 24px', textAlign: 'center', color: '#786d66' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📥</div>
              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#2c2320' }}>
                No incoming receiver requests right now.
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#786d66' }}>
                When community members or verified receivers request food assistance, their tickets will appear here for approval.
              </p>
            </div>
          ) : (
            <div>
              {incomingRequests.map((req, idx) => (
                <div
                  key={req.id}
                  style={{
                    padding: '18px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    borderBottom: idx < incomingRequests.length - 1 ? '1px solid rgba(44, 35, 32, 0.06)' : 'none',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#fcf8f6')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#2c2320', marginBottom: '4px' }}>
                      {req.receiver_display_name || req.receiver_name || `Verified Receiver #${req.receiver_id}`}
                    </div>
                    <div style={{ fontSize: '13px', color: '#786d66', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>Food: <strong style={{ color: '#2c2320' }}>{req.food_name || req.food_title || req.food_type || 'Food Donation'}</strong></span>
                      <span>·</span>
                      <span>Requested: <strong>{req.requested_quantity || 1} portions</strong></span>
                      <span>·</span>
                      <span>Remaining: <strong style={{ color: (req.remaining_packets != null ? req.remaining_packets : (req.post_quantity || 0)) > 0 ? '#059669' : '#dc2626' }}>{req.remaining_packets != null ? req.remaining_packets : (req.post_quantity || 0)} portions</strong></span>
                      <span>·</span>
                      <span>{req.thana || 'Dhaka'}</span>
                    </div>
                    {req.remaining_packets != null && (
                      <div style={{ marginTop: '6px' }}>
                        {req.remaining_packets <= 0 ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            ⚠️ Out of Stock (0 remaining)
                          </span>
                        ) : (req.requested_quantity || 1) > req.remaining_packets ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                            ⚠️ Exceeds Remaining Stock ({req.requested_quantity || 1} requested &gt; {req.remaining_packets} remaining)
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                            ✓ Stock Available ({req.remaining_packets} remaining)
                          </span>
                        )}
                      </div>
                    )}
                    {Number(req.payment_amount) > 0 && (
                      <div style={{ marginTop: 8, fontSize: 12, color: '#374151' }}>
                        <strong>Payment:</strong> ৳{Number(req.payment_amount).toFixed(2)} · {['bkash', 'rocket', 'nagad'].includes(req.payment_method) ? `${req.payment_method.toUpperCase()} Txn: ${req.bkash_transaction_id || '—'}` : 'Cash on Delivery'} · <strong>{req.payment_status}</strong>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {req.payment_status === 'verification_pending' && (
                      <>
                        <button onClick={() => handlePaymentAction(req.id, 'verify_wallet_payment')} style={{ padding: '8px 14px', borderRadius: 12, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Verify Payment</button>
                        <button onClick={() => handlePaymentAction(req.id, 'reject_wallet_payment')} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid #fecaca', background: '#fff', color: '#b91c1c', fontWeight: 700, cursor: 'pointer' }}>Reject Txn</button>
                      </>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'approved')}
                      disabled={['bkash', 'rocket', 'nagad'].includes(req.payment_method) && req.payment_status !== 'paid'}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'var(--brand-primary)',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: ['bkash', 'rocket', 'nagad'].includes(req.payment_method) && req.payment_status !== 'paid' ? 'not-allowed' : 'pointer',
                        opacity: ['bkash', 'rocket', 'nagad'].includes(req.payment_method) && req.payment_status !== 'paid' ? 0.55 : 1,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--brand-primary-dark)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'var(--brand-primary)')}
                    >
                      {['bkash', 'rocket', 'nagad'].includes(req.payment_method) && req.payment_status !== 'paid' ? 'Verify payment first' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'rejected')}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '12px',
                        border: '1px solid rgba(44, 35, 32, 0.15)',
                        background: '#ffffff',
                        color: '#6b5d56',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#fee2e2')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Active Pickup Codes (Figma 8:29346) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
            border: '1px solid rgba(44, 35, 32, 0.06)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(44, 35, 32, 0.06)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2c2320' }}>
              Active Pickup Codes ({activePickupCodes.length})
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#888' }}>
              Loading active pickup codes...
            </div>
          ) : activePickupCodes.length === 0 ? (
            /* Clean Empty State */
            <div style={{ padding: '42px 24px', textAlign: 'center', color: '#786d66' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎫</div>
              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#2c2320' }}>
                No active pickup codes awaiting collection right now.
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#786d66' }}>
                When accepted meal requests are pending pickup at your hub, their codes and handover actions will appear here.
              </p>
            </div>
          ) : (
            <div>
              {activePickupCodes.map((req, idx) => (
                <div
                  key={req.id}
                  style={{
                    padding: '18px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    borderBottom: idx < activePickupCodes.length - 1 ? '1px solid rgba(44, 35, 32, 0.06)' : 'none',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = '#fcf8f6')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#2c2320' }}>
                        {req.receiver_display_name || req.receiver_name || `Verified Receiver #${req.receiver_id}`}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a'
                        }}
                      >
                        • Awaiting Pickup
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#786d66' }}>
                      <strong>{req.food_name || req.food_title || req.food_type || 'Cooked Food'}</strong> ({req.requested_quantity || 1} portions) · {req.thana || 'Dhaka'}
                    </div>
                    {Number(req.payment_amount) > 0 && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#374151' }}>
                        Payment: ৳{Number(req.payment_amount).toFixed(2)} · {['bkash', 'rocket', 'nagad'].includes(req.payment_method) ? `${req.payment_method.toUpperCase()} Txn ${req.bkash_transaction_id || '—'}` : 'Cash on Delivery'} · {req.payment_status}
                        {req.payment_status === 'cod_due' && (
                          <button onClick={() => handlePaymentAction(req.id, 'confirm_cash')} style={{ marginLeft: 8, padding: '5px 10px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Confirm Cash Received</button>
                        )}
                        {req.payment_status === 'verification_pending' && (
                          <>
                            <button onClick={() => handlePaymentAction(req.id, 'verify_wallet_payment')} style={{ marginLeft: 8, padding: '5px 10px', borderRadius: 8, border: 'none', background: '#059669', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Verify Payment</button>
                            <button onClick={() => handlePaymentAction(req.id, 'reject_wallet_payment')} style={{ marginLeft: 6, padding: '5px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff', color: '#b91c1c', fontWeight: 700, cursor: 'pointer' }}>Reject Txn</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        background: '#fff6f3',
                        border: '1px solid #ffdcd4',
                        padding: '6px 14px',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: 800,
                        color: 'var(--brand-primary)',
                        fontFamily: 'monospace',
                        letterSpacing: '1px'
                      }}
                    >
                      {req.pickup_code}
                    </div>

                    <button
                      onClick={() => handleVerifyQuickCode(req.pickup_code)}
                      disabled={verifying}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        border: '1.5px solid rgba(44, 35, 32, 0.15)',
                        background: '#ffffff',
                        color: '#2c2320',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: verifying ? 'wait' : 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#f5f3f0')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#ffffff')}
                    >
                      🔍 Verify Code
                    </button>

                    <button
                      onClick={() => handleCompletePickup(req.id, req.receiver_display_name || req.receiver_name)}
                      disabled={completingId === req.id}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#059669',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: completingId === req.id ? 'wait' : 'pointer',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = '#047857')}
                      onMouseOut={(e) => (e.currentTarget.style.background = '#059669')}
                    >
                      {completingId === req.id ? 'Completing...' : '✓ Mark Picked Up'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Completed / Fulfilled Handovers */}
        {fulfilledRequests.length > 0 && (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
              border: '1px solid rgba(44, 35, 32, 0.06)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(44, 35, 32, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#2c2320' }}>
                  Completed Handovers ({fulfilledRequests.length})
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#786d66' }}>
                  Recipients who have collected their meal packets (automatically marked fulfilled from Distributing stage).
                </p>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: '10px',
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0'
                }}
              >
                ✓ All Picked Up
              </span>
            </div>

            <div>
              {fulfilledRequests.map((req, idx) => (
                <div
                  key={req.id}
                  style={{
                    padding: '16px 24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    borderBottom: idx < fulfilledRequests.length - 1 ? '1px solid rgba(44, 35, 32, 0.06)' : 'none',
                    background: idx % 2 === 0 ? '#fafafa' : '#ffffff'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#2c2320' }}>
                        {req.receiver_display_name || req.receiver_name || `Recipient #${req.receiver_id}`}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '8px',
                          background: '#ecfdf5',
                          color: '#059669',
                          border: '1px solid #a7f3d0'
                        }}
                      >
                        ✓ Collected
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#786d66' }}>
                      <strong>{req.food_name || req.food_title || req.food_type || 'Cooked Food'}</strong> ({req.requested_quantity || 1} portions) · {req.thana || 'Dhaka'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#6b7280', background: '#f3f4f6', padding: '4px 10px', borderRadius: '8px' }}>
                      {req.pickup_code}
                    </span>
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>
                      ✓ Fulfilled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </NgoLayout>
  );
};

export default ReceiverRequests;
