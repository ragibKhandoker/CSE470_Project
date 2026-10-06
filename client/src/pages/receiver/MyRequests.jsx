import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReceiverLayout from '../../components/receiver/ReceiverLayout';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';

export const MyRequests = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'accepted' | 'completed'
  const [requests, setRequests] = useState({ pending: [], accepted: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');
  const [directionsModalItem, setDirectionsModalItem] = useState(null);

  useEffect(() => {
    fetchMyRequests();
  }, [token]);

  // Fetch requests purely from DB
  const fetchMyRequests = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.data) {
          const pending = [];
          const accepted = [];
          const completed = [];

          data.data.forEach((r) => {
            const item = {
              id: r.id,
              title: `${r.food_name || r.food_title || r.food_type || 'Fresh Meal'} (${r.requested_quantity || 1} portions)`,
              foodName: r.food_name || r.food_title || 'Meal Box',
              foodType: r.food_type || 'Cooked Meals',
              source: r.donor_name || 'Community Donor / NGO',
              status: r.status,
              pickupCode: r.pickup_code || 'SM-PENDING',
              portions: r.requested_quantity || 1,
              location: `${r.thana || 'Dhaka'}, ${r.district || 'Bangladesh'}`,
              address: [r.house_no, r.road_no, r.area_ward, r.thana, r.district].filter(Boolean).join(', ') || 'Dhaka, Bangladesh',
              requestedAt: r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
              completedAt: r.updated_at ? new Date(r.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'
            };

            const status = (r.status || '').toLowerCase();
            if (status === 'approved' || status === 'accepted') {
              accepted.push(item);
            } else if (status === 'fulfilled' || status === 'completed') {
              completed.push(item);
            } else {
              // 'requested', 'pending', 'distributing', etc.
              pending.push(item);
            }
          });

          setRequests({ pending, accepted, completed });

          // Smartly activate the tab that has records
          if (accepted.length > 0) {
            setActiveTab('accepted');
          } else if (pending.length > 0) {
            setActiveTab('pending');
          } else if (completed.length > 0) {
            setActiveTab('completed');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching food requests from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this food request?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (res.ok) {
        fetchMyRequests();
      } else {
        alert('Could not cancel request');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const tabs = [
    { label: 'Pending / Active', key: 'pending', count: requests.pending.length },
    { label: 'Accepted', key: 'accepted', count: requests.accepted.length },
    { label: 'Completed', key: 'completed', count: requests.completed.length }
  ];

  return (
    <ReceiverLayout title="My Requests">
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Notice Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1px solid #fed7aa',
            borderRadius: '20px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 2px 10px rgba(251, 146, 60, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: '28px' }}>🎟️</span>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#9a3412' }}>
                Your Food Pickup Codes
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#7c2d12', lineHeight: '18px' }}>
                Present your <strong>Unique Pickup Code</strong> to the NGO distribution manager or staff at the distribution hub to collect your meal packets.
              </p>
            </div>
          </div>

          <Link
            to="/receiver/find-food"
            style={{
              background: 'var(--brand-primary)',
              color: '#ffffff',
              textDecoration: 'none',
              padding: '10px 20px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(var(--brand-primary-rgb), 0.25)'
            }}
          >
            + Request More Food
          </Link>
        </div>

        {/* Three Tabs Pill Group */}
        <div
          style={{
            display: 'inline-flex',
            background: '#e9e3df',
            borderRadius: '24px',
            padding: '4px',
            width: 'fit-content'
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  background: isActive ? '#ffffff' : 'transparent',
                  color: isActive ? '#2c2320' : '#6b5d56',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#888' }}>
            Loading your requests and pickup codes...
          </div>
        ) : (
          <>
            {/* Tab 1: Pending & Active Requests */}
            {activeTab === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {requests.pending.length === 0 ? (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '48px 24px',
                      textAlign: 'center',
                      boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
                      border: '1px solid rgba(44, 35, 32, 0.06)'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
                      No active or pending requests right now.
                    </h4>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#786d66' }}>
                      Browse available meal donations from verified donors and NGOs across Bangladesh.
                    </p>
                    <Link
                      to="/receiver/find-food"
                      style={{
                        background: 'var(--brand-primary)',
                        color: '#ffffff',
                        textDecoration: 'none',
                        padding: '10px 22px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    >
                      Find Food
                    </Link>
                  </div>
                ) : (
                  requests.pending.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
                        border: '1px solid rgba(44, 35, 32, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '18px'
                      }}
                    >
                      {/* Top Row: Title & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2c2320' }}>
                              {req.title}
                            </h4>
                            <span style={{ fontSize: '11px', fontWeight: 700, background: '#f3f4f6', color: '#4b5563', padding: '2px 8px', borderRadius: '6px' }}>
                              {req.foodType}
                            </span>
                          </div>
                          <span style={{ fontSize: '13px', color: '#786d66', marginTop: '4px', display: 'block' }}>
                            {req.source} · {req.location} · Requested on {req.requestedAt}
                          </span>
                        </div>

                        <span
                          style={{
                            padding: '4px 14px',
                            borderRadius: '20px',
                            background: '#fffbeb',
                            color: '#b45309',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid #fde68a'
                          }}
                        >
                          ⏳ Ready for Pickup
                        </span>
                      </div>

                      {/* Prominent Pickup Verification Code Box */}
                      <div
                        style={{
                          background: '#fff6f3',
                          border: '2px dashed var(--brand-primary)',
                          borderRadius: '16px',
                          padding: '18px 24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '16px',
                          boxSizing: 'border-box'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                            🔑 YOUR PICKUP CODE (TELL THIS TO DISTRIBUTOR MANAGER)
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                            <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--brand-primary)', fontFamily: 'monospace', letterSpacing: '2px' }}>
                              {req.pickupCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(req.pickupCode)}
                              style={{
                                background: 'var(--brand-soft)',
                                color: 'var(--brand-primary-deep)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>📋</span>
                              <span>{copiedCode === req.pickupCode ? '✓ Copied!' : 'Copy Code'}</span>
                            </button>
                          </div>
                          <div style={{ fontSize: '12px', color: '#786d66', marginTop: '4px' }}>
                            The distributor manager will type this code to verify your claim and hand over your meal packets.
                          </div>
                          <div style={{ fontSize: '11px', color: '#c2410c', background: '#ffedd5', border: '1px solid #fed7aa', padding: '3px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                            🔒 Specific to: <strong>{req.title}</strong> ({req.quantity} portion{req.quantity > 1 ? 's' : ''}) — Valid ONLY for this food.
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setDirectionsModalItem(req)}
                            style={{
                              background: '#ffffff',
                              color: 'var(--brand-primary)',
                              border: '1.5px solid var(--brand-primary)',
                              borderRadius: '12px',
                              padding: '10px 18px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>📍</span>
                            <span>Get Directions</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCancelRequest(req.id)}
                            style={{
                              background: 'transparent',
                              color: '#dc2626',
                              border: '1px solid #fca5a5',
                              borderRadius: '12px',
                              padding: '10px 16px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Accepted Requests */}
            {activeTab === 'accepted' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {requests.accepted.length === 0 ? (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '48px 24px',
                      textAlign: 'center',
                      boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
                      border: '1px solid rgba(44, 35, 32, 0.06)'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎫</div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
                      No accepted requests right now.
                    </h4>
                    <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#786d66' }}>
                      Check your Pending tab or browse available meal donations to request food.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('pending')}
                      style={{
                        background: 'var(--brand-primary)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 22px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      View Active &amp; Pending Requests ({requests.pending.length})
                    </button>
                  </div>
                ) : (
                  requests.accepted.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
                        border: '1px solid rgba(44, 35, 32, 0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
                            {req.title}
                          </h4>
                          <span style={{ fontSize: '13px', color: '#786d66' }}>
                            {req.source} · {req.location}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 14px',
                            borderRadius: '20px',
                            background: 'var(--brand-soft)',
                            color: 'var(--brand-primary)',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid var(--brand-soft-border)'
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)' }} />
                          <span>Accepted by Hub</span>
                        </div>
                      </div>

                      {/* Pickup Code Box */}
                      <div
                        style={{
                          background: '#fff6f3',
                          border: '2px dashed var(--brand-primary)',
                          borderRadius: '16px',
                          padding: '18px 24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '16px'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block' }}>
                            🔑 YOUR PICKUP CODE (TELL THIS TO DISTRIBUTOR)
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                            <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--brand-primary)', fontFamily: 'monospace', letterSpacing: '2px' }}>
                              {req.pickupCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(req.pickupCode)}
                              style={{
                                background: 'var(--brand-soft)',
                                color: 'var(--brand-primary-deep)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <span>📋</span>
                              <span>{copiedCode === req.pickupCode ? '✓ Copied!' : 'Copy'}</span>
                            </button>
                          </div>
                          <div style={{ fontSize: '12px', color: '#786d66', marginTop: '4px' }}>
                            Show this code at the distribution point to verify and claim your meal packets.
                          </div>
                          <div style={{ fontSize: '11px', color: '#c2410c', background: '#ffedd5', border: '1px solid #fed7aa', padding: '3px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                            🔒 Specific to: <strong>{req.title}</strong> ({req.quantity} portion{req.quantity > 1 ? 's' : ''}) — Valid ONLY for this food.
                          </div>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => setDirectionsModalItem(req)}
                            style={{
                              background: '#ffffff',
                              color: 'var(--brand-primary)',
                              border: '1.5px solid var(--brand-primary)',
                              borderRadius: '12px',
                              padding: '10px 22px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>📍</span>
                            <span>Get Directions</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Completed Requests */}
            {activeTab === 'completed' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {requests.completed.length === 0 ? (
                  <div
                    style={{
                      background: '#ffffff',
                      borderRadius: '20px',
                      padding: '48px 24px',
                      textAlign: 'center',
                      boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
                      border: '1px solid rgba(44, 35, 32, 0.06)'
                    }}
                  >
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
                      No completed requests yet.
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#786d66' }}>
                      Once you collect food using your pickup code, completed history will be displayed here.
                    </p>
                  </div>
                ) : (
                  requests.completed.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        padding: '24px',
                        boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
                        border: '1px solid rgba(44, 35, 32, 0.06)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '16px'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#2c2320' }}>
                            {req.title}
                          </h4>
                          <span
                            style={{
                              padding: '3px 10px',
                              borderRadius: '12px',
                              background: '#ecfdf5',
                              color: '#047857',
                              fontSize: '11px',
                              fontWeight: 700,
                              border: '1px solid #a7f3d0'
                            }}
                          >
                            ✓ Picked Up
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#786d66' }}>
                          {req.source} · {req.location} · Picked up on {req.completedAt}
                        </div>
                        <div style={{ fontSize: '12px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
                          Verified with Pickup Code: <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{req.pickupCode}</span>
                        </div>
                      </div>

                      <Link
                        to="/receiver/ratings"
                        style={{
                          background: '#fff6f3',
                          color: 'var(--brand-primary)',
                          border: '1.5px solid var(--brand-primary)',
                          borderRadius: '12px',
                          padding: '10px 20px',
                          fontSize: '13px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>⭐</span>
                        <span>Rate Experience</span>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

      </div>

      {/* Directions Modal */}
      {directionsModalItem && (
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
          onClick={() => setDirectionsModalItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '28px',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                Pickup Location &amp; Directions
              </h3>
              <button
                onClick={() => setDirectionsModalItem(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f7f4f0', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#2c2320', marginBottom: '4px' }}>
                {directionsModalItem.source}
              </div>
              <div style={{ fontSize: '13px', color: '#6b5d56' }}>
                📍 {directionsModalItem.address || directionsModalItem.location}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--brand-primary)', fontWeight: 800, marginTop: '10px' }}>
                Pickup Code: <span style={{ fontFamily: 'monospace' }}>{directionsModalItem.pickupCode}</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#6b5d56', lineHeight: '20px', marginBottom: '20px' }}>
              Present this code to the NGO staff or distributor manager at the hub. They will enter this code into their system to confirm handover of your meal packets.
            </p>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsModalItem.address || directionsModalItem.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'center',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '12px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              Open in Google Maps ↗
            </a>
          </div>
        </div>
      )}
    </ReceiverLayout>
  );
};

export default MyRequests;
