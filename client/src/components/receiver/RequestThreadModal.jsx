import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Receiver Food Request Lifecycle Thread Modal
 * Displays the 4 stages: Requested -> Accepted/Rejected -> Food Taken -> Leave Review
 */
export const RequestThreadModal = ({ selectedRequest, onClose }) => {
  const navigate = useNavigate();
  if (!selectedRequest) return null;

  const steps = selectedRequest.thread || [];
  const canReview = selectedRequest.can_review;
  const hasReviewed = selectedRequest.has_reviewed;

  const handleGoToReview = () => {
    onClose();
    navigate(`/receiver/ratings?post_id=${selectedRequest.food_post_id}&target_id=${selectedRequest.donor_id || ''}`);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 3000 }}>
      <div style={{ width: '100%', maxWidth: '640px', background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#2c2320', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #eee5e0', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2c2320' }}>
                🍲 {selectedRequest.title || 'Food Claim Progress'}
              </h3>
              {selectedRequest.pickup_code && (
                <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  Code: {selectedRequest.pickup_code}
                </span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: '#6b5d56', marginTop: '4px', display: 'block' }}>
              {selectedRequest.subtitle || 'Realtime claim lifecycle updates'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, fontSize: '22px', cursor: 'pointer', color: '#888' }}>✕</button>
        </div>

        {/* Pickup Info Alert */}
        {selectedRequest.pickup_point && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#166534', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>📍</span>
            <div>
              <div style={{ fontWeight: 700 }}>Pickup Location:</div>
              <div style={{ fontSize: '12px' }}>{selectedRequest.pickup_point}</div>
            </div>
          </div>
        )}

        {/* Thread Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '8px', position: 'relative', marginBottom: '24px' }}>
          {steps.map((item, idx) => {
            const isCompleted = item.status === 'completed';
            const isRejected = item.status === 'rejected';
            const isAction = item.status === 'action_required';
            const circleColor = isCompleted ? '#10b981' : isRejected ? '#ef4444' : isAction ? '#f97316' : '#9ca3af';

            return (
              <div key={item.step || idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', position: 'relative' }}>
                {idx < steps.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '13px',
                      top: '26px',
                      bottom: '-16px',
                      width: '2px',
                      background: isCompleted ? '#10b981' : '#e5e7eb'
                    }}
                  />
                )}

                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: circleColor,
                    color: '#ffffff',
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    zIndex: 1,
                    boxShadow: `0 2px 6px ${circleColor}50`
                  }}
                >
                  {isCompleted ? '✓' : isRejected ? '✕' : item.step}
                </div>

                <div style={{ flex: 1, background: '#ffffff', border: `1px solid ${isAction ? '#fed7aa' : '#e5e7eb'}`, borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>
                      Step {item.step}: {item.title || item.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                      {item.time}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#4b5563', lineHeight: '18px' }}>
                    {item.detail}
                  </p>

                  {/* Leave Review Action inside Step 4 */}
                  {item.step === 4 && canReview && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #fdba74' }}>
                      <button
                        onClick={handleGoToReview}
                        style={{
                          background: 'linear-gradient(135deg, #2563eb 0%, #ea580c 100%)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '8px 18px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)'
                        }}
                      >
                        <span>⭐</span>
                        <span>Leave Review for Meal &amp; Donor</span>
                      </button>
                    </div>
                  )}

                  {item.step === 4 && hasReviewed && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>
                      ✓ Thank you! Your review has been recorded.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          {canReview ? (
            <button
              onClick={handleGoToReview}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 0,
                borderRadius: '10px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ⭐ Leave Review Now
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            style={{ background: '#f1f5f9', color: '#475569', border: 0, borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestThreadModal;
