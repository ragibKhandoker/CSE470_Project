import React from 'react';

/**
 * Reusable Food Post Lifecycle Thread Audit Modal
 * Shared across Admin, Donor, and NGO views
 */
export const FoodThreadModal = ({ selectedThread, onClose, allThreads = [], onSelectThread }) => {
  if (!selectedThread) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 3000 }}>
      <div style={{ width: '100%', maxWidth: '720px', background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#2c2320', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', borderBottom: '1px solid #eee5e0', paddingBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#2c2320' }}>
                🍲 {selectedThread.food_name}
              </h3>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: selectedThread.total_packets != null && selectedThread.remaining_packets === 0 ? '#ecfdf5' : '#fff7ed',
                  color: selectedThread.total_packets != null && selectedThread.remaining_packets === 0 ? '#047857' : '#c2410c',
                  border: '1px solid currentColor'
                }}
              >
                {selectedThread.total_packets != null && selectedThread.remaining_packets === 0
                  ? '✓ Fully Distributed'
                  : `📢 Distributing (${selectedThread.remaining_packets ?? selectedThread.initial_quantity} of ${selectedThread.total_packets ?? selectedThread.initial_quantity} left)`}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6b5d56', marginTop: '4px', display: 'block' }}>
              Food Post #{selectedThread.post_id} • Donated by {selectedThread.donor?.name || 'Donor'} on {selectedThread.formatted_created_at || 'Recent'}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, fontSize: '22px', cursor: 'pointer', color: '#888' }}>✕</button>
        </div>

        {/* Optional Switch Food Post Dropdown */}
        {allThreads.length > 1 && onSelectThread && (
          <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', marginBottom: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
              Switch Food Post Thread:
            </span>
            <select
              value={selectedThread.post_id}
              onChange={(e) => {
                const match = allThreads.find((t) => t.post_id === Number(e.target.value));
                if (match) onSelectThread(match);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                background: '#ffffff',
                color: '#1e293b',
                cursor: 'pointer'
              }}
            >
              {allThreads.map((t) => (
                <option key={t.post_id} value={t.post_id}>
                  #{t.post_id} - {t.food_name} ({t.remaining_packets ?? t.initial_quantity} left)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Key Stakeholders Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '20px', background: '#f8fafc', padding: '12px', borderRadius: '14px', border: '1px solid #f2e7e1' }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#8d7870', textTransform: 'uppercase' }}>🍲 Donor</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2c2320' }}>{selectedThread.donor?.name || 'Donor'}</div>
            <div style={{ fontSize: '11px', color: '#6b5d56' }}>{selectedThread.donor?.phone || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#8d7870', textTransform: 'uppercase' }}>🏢 Collecting NGO</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2c2320' }}>{selectedThread.ngo?.organization_name || selectedThread.ngo?.name || 'Awaiting NGO'}</div>
            <div style={{ fontSize: '11px', color: '#6b5d56' }}>{selectedThread.ngo?.phone || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#8d7870', textTransform: 'uppercase' }}>🛵 Pickup Staff</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2c2320' }}>{selectedThread.pickup_staff?.name || 'Unassigned'}</div>
            <div style={{ fontSize: '11px', color: '#6b5d56' }}>{selectedThread.pickup_staff?.phone || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#8d7870', textTransform: 'uppercase' }}>🔬 Hub Inspector</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2c2320' }}>{selectedThread.hub_inspection?.name || 'Pending Check'}</div>
            <div style={{ fontSize: '11px', color: '#6b5d56' }}>{selectedThread.hub_inspection?.phone || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#8d7870', textTransform: 'uppercase' }}>📍 Distribution Point</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2c2320' }}>{selectedThread.distribution?.pickup_point_name || 'Pending Staging'}</div>
            <div style={{ fontSize: '11px', color: '#6b5d56' }}>{selectedThread.remaining_packets ?? selectedThread.initial_quantity} portions left</div>
          </div>
        </div>

        {/* Lifecycle Timeline Thread (Steps 1 to 6) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '8px', position: 'relative', marginBottom: '24px' }}>
          {(selectedThread.steps || []).map((item, idx) => {
            const isCompleted = item.status === 'completed';
            const isInProgress = item.status === 'in_progress';
            const circleColor = isCompleted ? '#10b981' : isInProgress ? '#f59e0b' : '#9ca3af';

            return (
              <div key={item.step} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', position: 'relative' }}>
                {/* Vertical connecting line */}
                {idx < (selectedThread.steps || []).length - 1 && (
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

                {/* Step circle */}
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
                  {isCompleted ? '✓' : item.step}
                </div>

                <div style={{ flex: 1, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#111827' }}>
                      Step {item.step}: {item.title || item.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>
                      {item.full_date || item.time}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#4b5563', lineHeight: '18px' }}>
                    {item.detail}
                  </p>

                  {/* Step 6 Beneficiary Handover Log Table */}
                  {item.step === 6 && (
                    <div style={{ marginTop: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>📋 Beneficiary Claim &amp; Handover Log ("Who Collected")</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {(selectedThread.beneficiary_handovers || []).length} Records Verified
                        </span>
                      </div>

                      {(!selectedThread.beneficiary_handovers || selectedThread.beneficiary_handovers.length === 0) ? (
                        <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '12px', color: '#64748b', textAlign: 'center' }}>
                          No beneficiary handovers recorded yet. Awaiting food seeker claims at distribution point.
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Food Seeker</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Phone</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Pickup Code</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Servings</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Handed Over By</th>
                                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedThread.beneficiary_handovers.map((h, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#0f172a' }}>{h.receiver_name}</td>
                                  <td style={{ padding: '8px 10px', color: '#475569' }}>{h.receiver_phone || 'N/A'}</td>
                                  <td style={{ padding: '8px 10px' }}>
                                    <code style={{ background: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
                                      {h.pickup_code}
                                    </code>
                                  </td>
                                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#ea580c' }}>{h.quantity} pkts</td>
                                  <td style={{ padding: '8px 10px', color: '#475569' }}>{h.staff_name}</td>
                                  <td style={{ padding: '8px 10px', color: '#64748b' }}>{h.time_ago || h.formatted_date}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#2563eb', color: '#ffffff', border: 0, borderRadius: '10px', padding: '10px 24px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
          >
            Close Thread
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodThreadModal;
