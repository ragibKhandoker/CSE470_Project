import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import ReceiverLayout from '../../components/receiver/ReceiverLayout';
import { API_BASE_URL } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { getAnonymousMode } from '../../services/receiverData';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import CaptchaWidget from '../../components/common/CaptchaWidget';

// Leaflet default icons fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const createFoodMarkerIcon = (type) => {
  const isVeg = (type || '').toLowerCase().includes('veg');
  const color = isVeg ? '#10b981' : 'var(--brand-primary)';
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background: ${color}; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">${isVeg ? '🥬' : '🍲'}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

export const ReceiverFindFood = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const isVerified = user?.verification_status === 'verified';
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'
  const [foodPosts, setFoodPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRequests, setMyRequests] = useState([]);

  // Request Food State
  const [requestModalItem, setRequestModalItem] = useState(null);
  const [requestedPortions, setRequestedPortions] = useState(1);
  const [requestNote, setRequestNote] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(getAnonymousMode());
  const [requestSuccessMessage, setRequestSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestCaptcha, setRequestCaptcha] = useState({ captchaId: '', captchaAnswer: '', isValid: false });

  useEffect(() => {
    fetchFoodPosts();
    if (token) {
      fetchMyRequests();
    }
  }, [token]);

  const fetchMyRequests = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/food-requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching receiver requests:', err);
    }
  };

  // Helper to check if receiver already requested/received this post
  const getExistingRequestForPost = (postId) => {
    return myRequests.find(
      (r) => Number(r.food_post_id) === Number(postId) && ['requested', 'approved', 'fulfilled', 'accepted'].includes(r.status)
    );
  };

  // Fetch NGO food posts only (receivers should see NGO posts, not individual donor posts)
  const fetchFoodPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/food-posts/ngo-posts`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.foodPosts) {
          setFoodPosts(data.foodPosts);
        } else {
          setFoodPosts([]);
        }
      }
    } catch (err) {
      console.error('Error fetching NGO food posts from DB:', err);
      setFoodPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPills = [
    { label: 'All', key: 'All' },
    { label: 'NGO Point Only', key: 'NGO Point' },
    { label: 'Available Now', key: 'Available' },
    { label: 'Veg', key: 'Veg' },
    { label: 'Cooked', key: 'Cooked' },
    { label: 'Baked', key: 'Baked' },
    { label: 'Produce', key: 'Produce' }
  ];

  // Filter DB items (all items are NGO posts since we fetched from /ngo-posts)
  const filteredItems = foodPosts.filter((item) => {
    const query = searchQuery.toLowerCase().trim();
    const title = (item.food_name || item.title || item.food_type || '').toLowerCase();
    const thana = (item.thana || '').toLowerCase();
    const district = (item.district || '').toLowerCase();
    const area = (item.area_ward || '').toLowerCase();
    const donor = (item.donor_name || '').toLowerCase();
    const itemStatus = (item.status || '').toLowerCase();

    const matchesSearch =
      !query ||
      title.includes(query) ||
      thana.includes(query) ||
      district.includes(query) ||
      area.includes(query) ||
      donor.includes(query);

    if (!matchesSearch) return false;

    if (activeFilter === 'All') return true;
    if (activeFilter === 'NGO Point') return true; // All fetched items are NGO posts
    if (activeFilter === 'Available') return itemStatus === 'available' || itemStatus === 'at_ngo_point';
    if (activeFilter === 'Veg') return title.includes('veg');
    if (activeFilter === 'Cooked') return title.includes('cooked');
    if (activeFilter === 'Baked') return title.includes('baked');
    if (activeFilter === 'Produce') return title.includes('produce');

    return true;
  });

  const handleOpenRequest = (item) => {
    if (!isVerified) {
      alert('National ID verification required. Please upload your NID document in your Profile and wait for Super Admin verification before requesting food.');
      navigate('/receiver/profile');
      return;
    }
    const existing = getExistingRequestForPost(item.id);
    if (existing) {
      alert(existing.status === 'fulfilled' ? 'You have already collected food from this donation post.' : `You have already requested this food. Your pickup code is ${existing.pickup_code}.`);
      return;
    }
    setRequestModalItem(item);
    setRequestedPortions(1);
    setRequestNote('');
    setIsAnonymous(getAnonymousMode());
    setRequestSuccessMessage('');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in as a receiver to request food.');
      return;
    }
    if (!requestCaptcha.captchaAnswer || requestCaptcha.captchaAnswer.length < 4) {
      alert('Please enter the security verification code (CAPTCHA) to verify you are not a bot.');
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/food-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          food_post_id: requestModalItem.id,
          is_anonymous: isAnonymous,
          requested_quantity: requestedPortions,
          notes: requestNote,
          captchaId: requestCaptcha.captchaId,
          captchaAnswer: requestCaptcha.captchaAnswer
        })
      });
      const data = await res.json();
      if (res.ok) {
        setRequestSuccessMessage('Request submitted! Pickup code generated.');
        setTimeout(() => {
          setRequestModalItem(null);
          fetchFoodPosts();
          fetchMyRequests();
        }, 1300);
      } else {
        alert(data.message || 'Could not submit request');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Network error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ReceiverLayout title="Find Food">
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Full-width Search Bar */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '4px 18px',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 2px 10px rgba(44, 35, 32, 0.03)',
            border: '1px solid rgba(44, 35, 32, 0.06)'
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by food type, Bangladeshi location (e.g. Dhanmondi, Banani, Mirpur, Uttara)..."
            style={{
              width: '100%',
              height: '46px',
              border: 'none',
              fontSize: '14px',
              color: '#2c2320',
              outline: 'none',
              background: 'transparent'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: '#999', cursor: 'pointer', fontSize: '14px' }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Verification Warning Banner for Unverified Food Seekers */}
        {!isVerified && (
          <div
            style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              boxShadow: '0 4px 14px rgba(245,158,11,0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '26px' }}>🛡️</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#92400e' }}>
                  National ID (NID) Verification Required
                </h4>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#b45309', lineHeight: '18px' }}>
                  To ensure fair distribution and security, food seekers must upload their National ID (PDF or image) and receive Super Admin verification before claiming meal packets.
                </p>
              </div>
            </div>
            <Link
              to="/receiver/profile"
              style={{
                background: '#ea580c',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 10px rgba(234,88,12,0.3)'
              }}
            >
              Upload NID in Profile →
            </Link>
          </div>
        )}

        {/* View Toggle & Filter Pills Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* View Toggle Group */}
          <div style={{ display: 'flex', gap: '8px', marginRight: '6px' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: viewMode === 'grid' ? 'none' : '1px solid rgba(44, 35, 32, 0.1)',
                background: viewMode === 'grid' ? 'var(--brand-primary)' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#6b5d56',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? '0 4px 10px rgba(var(--brand-primary-rgb), 0.3)' : 'none'
              }}
            >
              <span>⊞</span>
              <span>Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('map')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '20px',
                border: viewMode === 'map' ? 'none' : '1px solid rgba(44, 35, 32, 0.1)',
                background: viewMode === 'map' ? 'var(--brand-primary)' : '#ffffff',
                color: viewMode === 'map' ? '#ffffff' : '#6b5d56',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: viewMode === 'map' ? '0 4px 10px rgba(var(--brand-primary-rgb), 0.3)' : 'none'
              }}
            >
              <span>🗺️</span>
              <span>Map</span>
            </button>
          </div>

          {/* Category Filter Pills */}
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
                  background: isSelected ? 'rgba(var(--brand-primary-rgb), 0.08)' : '#ffffff',
                  color: isSelected ? 'var(--brand-primary)' : '#6b5d56',
                  fontSize: '13px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '48px', textAlign: 'center', color: '#786d66' }}>
            Loading food posts from database...
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State if no posts match or DB has no posts */
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
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍽️</div>
            <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
              No food posts available right now.
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#786d66' }}>
              Check back soon as local donors and NGOs in Bangladesh post fresh meal donations throughout the day.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View from DB */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '22px' }}>
            {filteredItems.map((food) => {
              const img =
                food.image_url ||
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
              const locationText = food.area_ward
                ? `${food.area_ward}, ${food.thana || 'Dhaka'}`
                : `${food.thana || 'Dhaka'}, ${food.district || 'Bangladesh'}`;
              const isNGO =
                (food.status || '').toLowerCase() === 'at_ngo_point' ||
                (food.donor_role || '').toLowerCase() === 'ngo' ||
                (food.donor_name || '').toLowerCase().includes('ngo') ||
                Boolean(food.ngo_organization_name) ||
                (food.notes || '').toLowerCase().includes('ngo');

              const existingReq = getExistingRequestForPost(food.id);
              const hasClaimed = Boolean(existingReq);
              const isFulfilled = existingReq?.status === 'fulfilled';
              const remainingCount = food.remaining_packets != null ? food.remaining_packets : food.quantity;
              const totalCount = food.total_packets || food.quantity;

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
                      alt={food.food_name || food.food_type}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Top Left: Category Badge */}
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

                    {/* Top Right: Source Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: isNGO ? '#ecfdf5' : '#ffffff',
                        color: isNGO ? '#047857' : '#2c2320',
                        padding: '3px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        border: isNGO ? '1px solid #a7f3d0' : 'none'
                      }}
                    >
                      {isNGO ? (food.ngo_organization_name || 'Care Bangladesh (NGO Point)') : 'Direct Donor'}
                    </div>
                  </div>

                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#2c2320', lineHeight: 1.3 }}>
                        {food.food_name || food.title || `${food.food_type} Meals`}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#786d66' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: '8px',
                            background: remainingCount > 0 ? '#fff7ed' : '#fee2e2',
                            color: remainingCount > 0 ? '#c2410c' : '#dc2626',
                            border: `1px solid ${remainingCount > 0 ? '#ffedd5' : '#fecaca'}`
                          }}>
                            🍲 {food.remaining_packets != null ? `${remainingCount} portions left (of ${totalCount})` : `${food.quantity} servings available`}
                          </span>
                        </div>
                        <span>📍 {locationText}</span>
                        <span>👤 {food.donor_name || 'Donor'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!isVerified) {
                          alert('National ID (NID) verification required. Please upload your NID document in your Profile and wait for Super Admin verification.');
                          navigate('/receiver/profile');
                          return;
                        }
                        if (!hasClaimed) handleOpenRequest(food);
                      }}
                      disabled={hasClaimed}
                      style={{
                        width: '100%',
                        background: !isVerified
                          ? '#fff7ed'
                          : hasClaimed
                          ? (isFulfilled ? '#ecfdf5' : '#fffbeb')
                          : 'var(--brand-primary)',
                        color: !isVerified
                          ? '#c2410c'
                          : hasClaimed
                          ? (isFulfilled ? '#047857' : '#b45309')
                          : '#ffffff',
                        border: !isVerified
                          ? '1.5px solid #fed7aa'
                          : hasClaimed
                          ? (isFulfilled ? '1.5px solid #a7f3d0' : '1.5px solid #fde68a')
                          : 'none',
                        borderRadius: '14px',
                        padding: '12px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: hasClaimed ? 'not-allowed' : 'pointer',
                        boxShadow: hasClaimed || !isVerified ? 'none' : '0 4px 12px rgba(var(--brand-primary-rgb), 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={(e) => {
                        if (!hasClaimed && isVerified) e.currentTarget.style.background = 'var(--brand-primary-dark)';
                      }}
                      onMouseOut={(e) => {
                        if (!hasClaimed && isVerified) e.currentTarget.style.background = 'var(--brand-primary)';
                      }}
                    >
                      {!isVerified
                        ? '🔒 Verification Required (Upload NID)'
                        : hasClaimed
                        ? (isFulfilled ? '✓ Food Received' : `✓ Already Requested (${existingReq.pickup_code || 'Pending'})`)
                        : 'Request Food'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Map View from DB centered on Bangladesh (Dhaka) */
          <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', height: '560px', boxShadow: '0 4px 20px rgba(44, 35, 32, 0.05)', border: '1px solid rgba(44, 35, 32, 0.06)' }}>
            <MapContainer
              center={[23.8103, 90.4125]}
              zoom={12}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredItems.map((food, idx) => {
                const lat = food.latitude || (23.7808 + (idx * 0.015 - 0.01));
                const lng = food.longitude || (90.4152 + (idx * 0.015 - 0.01));
                const existingReq = getExistingRequestForPost(food.id);
                const hasClaimed = Boolean(existingReq);
                const isFulfilled = existingReq?.status === 'fulfilled';
                const rem = food.remaining_packets != null ? food.remaining_packets : food.quantity;

                return (
                  <Marker
                    key={food.id}
                    position={[lat, lng]}
                    icon={createFoodMarkerIcon(food.food_type)}
                  >
                    <Popup>
                      <div style={{ minWidth: '190px', padding: '4px' }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700 }}>
                          {food.food_name || food.title || `${food.food_type} Meals`}
                        </h4>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                          📍 {food.thana || 'Dhaka'} · <strong>{rem} portions left</strong>
                        </div>
                        <button
                          onClick={() => {
                            if (!isVerified) {
                              alert('National ID (NID) verification required. Please upload your NID document in your Profile and wait for Super Admin verification.');
                              navigate('/receiver/profile');
                              return;
                            }
                            if (!hasClaimed) handleOpenRequest(food);
                          }}
                          disabled={hasClaimed}
                          style={{
                            width: '100%',
                            background: !isVerified
                              ? '#fff7ed'
                              : hasClaimed
                              ? (isFulfilled ? '#ecfdf5' : '#fffbeb')
                              : 'var(--brand-primary)',
                            color: !isVerified
                              ? '#c2410c'
                              : hasClaimed
                              ? (isFulfilled ? '#047857' : '#b45309')
                              : '#fff',
                            border: !isVerified
                              ? '1px solid #fed7aa'
                              : hasClaimed
                              ? (isFulfilled ? '1px solid #a7f3d0' : '1px solid #fde68a')
                              : 'none',
                            borderRadius: '8px',
                            padding: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: hasClaimed ? 'not-allowed' : 'pointer'
                          }}
                        >
                          {!isVerified
                            ? '🔒 Verify NID to Request'
                            : hasClaimed
                            ? (isFulfilled ? '✓ Food Received' : `✓ Requested (${existingReq.pickup_code})`)
                            : 'Request Food'}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        )}

      </div>

      {/* Request Food Modal */}
      {requestModalItem && (
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
          onClick={() => setRequestModalItem(null)}
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
                Request Food
              </h3>
              <button
                onClick={() => setRequestModalItem(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>

            {requestSuccessMessage ? (
              <div style={{ background: '#ecfdf5', color: '#065f46', padding: '16px', borderRadius: '14px', textAlign: 'center', fontWeight: 600 }}>
                {requestSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest}>
                <div style={{ marginBottom: '18px', background: '#fcf8f6', padding: '14px', borderRadius: '14px', border: '1px solid #ffedd5' }}>
                  <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700, color: '#2c2320' }}>
                    {requestModalItem.food_name || requestModalItem.title || `${requestModalItem.food_type} Meals`}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#786d66' }}>
                    <span>📍 {requestModalItem.thana || 'Dhaka'} · {requestModalItem.donor_name || 'NGO Hub'}</span>
                    <span style={{ fontWeight: 700, color: '#c2410c' }}>
                      🍲 {requestModalItem.remaining_packets != null ? `${requestModalItem.remaining_packets} portions remaining (of ${requestModalItem.total_packets || requestModalItem.quantity})` : `${requestModalItem.quantity} portions available`}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                    Portions Needed
                  </label>
                  {(() => {
                    const availablePortions = requestModalItem.remaining_packets != null ? requestModalItem.remaining_packets : (requestModalItem.quantity || 4);
                    const maxPortionsAllowed = Math.max(1, Math.min(4, availablePortions));
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setRequestedPortions((p) => Math.max(1, p - 1))}
                          style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', fontSize: '16px', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '16px', fontWeight: 700, width: '30px', textAlign: 'center' }}>
                          {requestedPortions}
                        </span>
                        <button
                          type="button"
                          onClick={() => setRequestedPortions((p) => Math.min(maxPortionsAllowed, p + 1))}
                          style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#f9fafb', fontSize: '16px', cursor: 'pointer' }}
                        >
                          +
                        </button>
                        <span style={{ fontSize: '12px', color: '#888' }}>
                          (Max {maxPortionsAllowed} portions)
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                    Pickup Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    placeholder="E.g., Pickup in Banani / Dhanmondi..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '10px 14px', borderRadius: '12px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                    {isAnonymous ? '🛡️ Anonymous Mode: Your name is shielded' : '👤 Standard Mode: Your name will be shared with the donor'}
                  </span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <CaptchaWidget
                    onCaptchaChange={setRequestCaptcha}
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
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Confirm Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </ReceiverLayout>
  );
};

export default ReceiverFindFood;
