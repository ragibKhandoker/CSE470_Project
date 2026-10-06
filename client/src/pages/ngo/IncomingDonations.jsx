import React, { useState, useEffect } from 'react';
import NgoLayout from '../../components/ngo/NgoLayout';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';
import CaptchaWidget from '../../components/common/CaptchaWidget';

export const IncomingDonations = () => {
  const { token } = useAuth();
  const [donations, setDonations] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Pickup request modal
  const [pickupModalItem, setPickupModalItem] = useState(null);
  const [pickupNotes, setPickupNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [pickupCaptcha, setPickupCaptcha] = useState({ captchaId: '', captchaAnswer: '', isValid: false });

  // Track which posts already have a sent pickup request (in this session)
  const [sentPickupPostIds, setSentPickupPostIds] = useState(new Set());

  useEffect(() => {
    fetchDonations();
  }, [token]);

  // NGO fetches donor posts (excluding ones already requested by this NGO)
  const fetchDonations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/food-posts/donor-posts`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.foodPosts) {
          setDonations(data.foodPosts);
        } else {
          setDonations([]);
        }
      }
    } catch (err) {
      console.error('Error fetching donor food posts:', err);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPills = [
    { label: 'All', key: 'All' },
    { label: 'Non-Veg', key: 'Non-Veg' },
    { label: 'Veg', key: 'Veg' },
    { label: 'Cooked', key: 'Cooked' },
    { label: 'Bakery', key: 'Bakery' },
    { label: 'Produce', key: 'Produce' }
  ];

  const filteredDonations = donations.filter((item) => {
    const type = (item.food_type || '').toLowerCase();
    const name = (item.food_name || item.title || '').toLowerCase();

    let matchesCategory = true;
    if (activeFilter === 'Non-Veg') {
      matchesCategory = type.includes('non-veg') || type.includes('meat') || type.includes('chicken') || type.includes('beef') || type.includes('fish') || type.includes('mutton');
    } else if (activeFilter === 'Veg') {
      matchesCategory = (type.includes('veg') && !type.includes('non-veg')) || (name.includes('veg') && !name.includes('non-veg'));
    } else if (activeFilter === 'Cooked') {
      matchesCategory = type.includes('cooked') || name.includes('rice') || name.includes('biriyani') || name.includes('polao') || name.includes('khichuri') || name.includes('curry');
    } else if (activeFilter === 'Bakery') {
      matchesCategory = type.includes('bak') || type.includes('bread') || name.includes('bread') || name.includes('pastr') || name.includes('cake') || name.includes('biscuit');
    } else if (activeFilter === 'Produce') {
      matchesCategory = type.includes('produce') || type.includes('fruit') || type.includes('raw');
    }

    if (!matchesCategory) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const donor = (item.donor_name || '').toLowerCase();
      const loc = `${item.area_ward || ''} ${item.thana || ''} ${item.district || ''}`.toLowerCase();
      return name.includes(q) || donor.includes(q) || type.includes(q) || loc.includes(q);
    }
    return true;
  });

  const handleOpenPickup = (food) => {
    setPickupModalItem(food);
    setPickupNotes('');
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSendPickupRequest = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in as an NGO to request pickup.');
      return;
    }
    if (!pickupCaptcha.captchaAnswer || pickupCaptcha.captchaAnswer.length < 4) {
      setErrorMessage('Please enter the security verification code (CAPTCHA) to verify you are not a bot.');
      return;
    }
    setSubmitting(true);
    setErrorMessage('');
    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/ngo-pickup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          food_post_id: pickupModalItem.id,
          notes: pickupNotes || 'NGO pickup request - our team will collect soon.',
          captchaId: pickupCaptcha.captchaId,
          captchaAnswer: pickupCaptcha.captchaAnswer
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMessage('✅ Pickup request sent to donor! Moving to Collection Requests...');
        setSentPickupPostIds((prev) => new Set([...prev, pickupModalItem.id]));
        // Immediately remove from incoming list
        setDonations((prev) => prev.filter((d) => d.id !== pickupModalItem.id));
        setTimeout(() => {
          setPickupModalItem(null);
          setSuccessMessage('');
        }, 1500);
      } else {
        setErrorMessage(data.message || 'Could not send pickup request. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NgoLayout title="Incoming Donations">
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>

        {/* Info Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
            borderRadius: '16px',
            padding: '16px 20px',
            border: '1px solid rgba(var(--brand-primary-rgb), 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <div style={{ fontSize: '28px' }}>🚚</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#2c2320' }}>Browse Donor Food Posts</div>
            <div style={{ fontSize: '12px', color: '#786d66', marginTop: 2 }}>
              These are food donations posted by local donors in Bangladesh. Send a pickup request to collect food for distribution.
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '14px' }}>
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by food name, donor, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 34px 9px 36px',
                borderRadius: '20px',
                border: '1px solid rgba(44, 35, 32, 0.12)',
                background: '#ffffff',
                fontSize: '13px',
                color: '#2c2320',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '13px',
                  padding: 0
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {filterPills.map((pill) => {
              const isSelected = activeFilter === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setActiveFilter(pill.key)}
                  style={{
                    padding: '7px 16px',
                    borderRadius: '20px',
                    border: isSelected ? '1.5px solid var(--brand-primary)' : '1px solid rgba(44, 35, 32, 0.1)',
                    background: isSelected ? 'var(--brand-primary)' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#6b5d56',
                    fontSize: '13px',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 10px rgba(var(--brand-primary-rgb), 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content / Cards */}
        {loading ? (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '48px', textAlign: 'center', color: '#786d66' }}>
            Loading donor food posts from database...
          </div>
        ) : filteredDonations.length === 0 ? (
          /* Empty state */
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '56px 24px',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
              border: '1px solid rgba(44, 35, 32, 0.06)',
              color: '#786d66'
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h4 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
              No donor food posts available right now.
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#786d66' }}>
              When local food donors in Bangladesh post surplus meals, they will appear here for NGO pickup.
            </p>
          </div>
        ) : (
          /* Grid of donations */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '22px' }}>
            {filteredDonations.map((food) => {
              const img =
                food.image_url ||
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
              const locationText = food.area_ward
                ? `${food.area_ward}, ${food.thana || 'Dhaka'}`
                : `${food.thana || 'Dhaka'}, ${food.district || 'Bangladesh'}`;
              const alreadySent = sentPickupPostIds.has(food.id);

              return (
                <div
                  key={food.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 18px rgba(44, 35, 32, 0.04)',
                    border: '1px solid rgba(44, 35, 32, 0.06)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ position: 'relative', height: '180px', background: '#e5e7eb' }}>
                    <img
                      src={img}
                      alt={food.food_name || food.title || food.food_type || 'Food Donation'}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: '#ffffff',
                        color: '#2c2320',
                        padding: '3px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                    >
                      {food.food_type || 'Cooked'}
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(30, 30, 30, 0.8)',
                        color: '#ffffff',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)'
                      }}
                    >
                      🟢 Available
                    </div>
                  </div>

                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '12px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#2c2320' }}>
                        {food.food_name || food.title || (food.food_type ? `${food.food_type} Meals` : 'Food Donation')}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#786d66' }}>
                        <span>👤 {food.donor_name || 'Verified Donor'}</span>
                        <span>🍱 {food.quantity} meals available</span>
                        <span>📍 {locationText}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => !alreadySent && handleOpenPickup(food)}
                      disabled={alreadySent}
                      style={{
                        width: '100%',
                        background: alreadySent ? '#d1fae5' : 'var(--brand-primary)',
                        color: alreadySent ? '#065f46' : '#ffffff',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: alreadySent ? 'default' : 'pointer',
                        boxShadow: alreadySent ? 'none' : '0 4px 12px rgba(var(--brand-primary-rgb), 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => { if (!alreadySent) e.currentTarget.style.background = 'var(--brand-primary-dark)'; }}
                      onMouseOut={(e) => { if (!alreadySent) e.currentTarget.style.background = 'var(--brand-primary)'; }}
                    >
                      {alreadySent ? '✅ Pickup Request Sent' : '🚚 Request Pickup'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Pickup Request Modal */}
      {pickupModalItem && (
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
          onClick={() => setPickupModalItem(null)}
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
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, fontFamily: "'Fraunces', serif" }}>
                🚚 Request Pickup
              </h3>
              <button
                onClick={() => setPickupModalItem(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>

            {successMessage ? (
              <div style={{ background: '#ecfdf5', color: '#065f46', padding: '20px', borderRadius: '14px', textAlign: 'center', fontWeight: 600, fontSize: '15px' }}>
                {successMessage}
              </div>
            ) : (
              <form onSubmit={handleSendPickupRequest}>
                <div style={{ marginBottom: '16px', background: '#fcf8f6', padding: '14px', borderRadius: '14px', border: '1px solid #f0e6e1' }}>
                  <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#2c2320' }}>
                    {pickupModalItem.food_name || pickupModalItem.title || (pickupModalItem.food_type ? `${pickupModalItem.food_type} Meals` : 'Food Donation')} — {pickupModalItem.quantity} servings
                  </h4>
                  <div style={{ fontSize: '12px', color: '#786d66', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                    <span style={{ background: 'var(--brand-soft)', color: 'var(--brand-primary-deep)', padding: '1px 8px', borderRadius: '6px', fontWeight: 600, fontSize: '11px' }}>
                      {pickupModalItem.food_type || 'Cooked'}
                    </span>
                    <span>·</span>
                    <span>👤 {pickupModalItem.donor_name || 'Donor'}</span>
                    <span>·</span>
                    <span>📍 {pickupModalItem.thana || pickupModalItem.district || 'Dhaka'}</span>
                  </div>
                </div>

                {errorMessage && (
                  <div style={{ background: '#fff5f5', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>
                    ⚠️ {errorMessage}
                  </div>
                )}

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                    Pickup Note (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    placeholder="E.g., Our collection van will arrive in 30 minutes..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <CaptchaWidget
                    onCaptchaChange={setPickupCaptcha}
                    label="Anti-Bot Security Check"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    background: 'var(--brand-primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? 'Sending Request...' : '🚚 Send Pickup Request to Donor'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </NgoLayout>
  );
};

export default IncomingDonations;
