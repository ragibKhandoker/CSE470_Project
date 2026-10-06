import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default marker icons in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Food Pin Icon
const createFoodMarkerIcon = (type) => {
  const isVeg = (type || '').toLowerCase().includes('veg') && !(type || '').toLowerCase().includes('non');
  const color = isVeg ? '#10b981' : '#ff6b4a';
  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="background: ${color}; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 800; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">${isVeg ? '🥬' : '🍲'}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -34]
  });
};

export const FindFood = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // If user is registered and logged in, direct take him to receiver find-food or his dashboard
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'receiver') {
        navigate('/receiver/find-food');
      } else {
        navigate(`/${user.role}/dashboard`);
      }
    }
  }, [user, loading, navigate]);

  // Live Food Explorer State
  const [foodPosts, setFoodPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'grid'
  const [selectedPost, setSelectedPost] = useState(null);
  const [showSignupPromptModal, setShowSignupPromptModal] = useState(null);

  useEffect(() => {
    fetchFoodPosts();
  }, []);

  const fetchFoodPosts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/food-posts`);
      const data = await res.json();
      if (res.ok && data.foodPosts) {
        setFoodPosts(data.foodPosts);
      }
    } catch (err) {
      console.error('Error fetching food posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const filteredPosts = foodPosts.filter((post) => {
    const matchesSearch =
      (post.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.thana || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.area_ward || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.donor_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedType === 'All' ||
      (post.food_type || '').toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesType;
  });

  const defaultCenter = [23.8103, 90.4125];
  const validMapPosts = filteredPosts.filter((p) => p.latitude && p.longitude);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff9f5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🍲</div>
          <div style={{ color: '#6b5d56', fontWeight: 600, fontSize: '15px' }}>Loading ShareMeal...</div>
        </div>
      </div>
    );
  }

  // If NOT registered / logged in: Ask for signup as a receiver (like Donate Food)
  return (
    <div style={{ minHeight: '100%', background: '#fff9f5', color: '#2c2320', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>

      <main style={{ flex: 1, padding: '40px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient Glows */}
        <div style={{ position: 'absolute', top: '-40px', left: '-60px', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(255, 180, 160, 0.35)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '100px', right: '-40px', width: '380px', height: '380px', borderRadius: '50%', background: 'rgba(255, 230, 180, 0.45)', filter: 'blur(90px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 5 }}>
          
          {/* Top Hero Section */}
          <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 48px' }}>
            {/* Top Pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ffe4db', color: '#c8391b', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '20px' }}>
              <span>🔍</span> RECEIVER COMMUNITY
            </div>

            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, color: '#2c2320', margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.15 }}>
              Find fresh meals, <br /><span style={{ color: '#f04b28' }}>nourish yourself &amp; family</span>
            </h1>

            <p style={{ fontSize: '17px', lineHeight: 1.6, color: '#6b5d56', maxWidth: '620px', margin: '0 auto 40px' }}>
              Connect directly with nearby verified food donors, community kitchens, and NGOs distributing free, nutritious surplus meals every day with complete dignity and privacy.
            </p>

            {/* Registration Prompt Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '28px',
                padding: 'clamp(32px, 5vw, 48px)',
                border: '1.5px solid #fed7aa',
                boxShadow: '0 20px 50px rgba(240, 75, 40, 0.08)',
                marginBottom: '40px',
                textAlign: 'center'
              }}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px', boxShadow: '0 8px 20px rgba(240, 75, 40, 0.15)' }}>
                🥗
              </div>

              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '26px', fontWeight: 800, color: '#2c2320', margin: '0 0 10px' }}>
                Sign up as a Receiver to claim meals
              </h2>

              <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#6b5d56', maxWidth: '520px', margin: '0 auto 32px' }}>
                Please create a free Receiver profile to claim available surplus meals, obtain encrypted pickup codes, and protect your identity with 100% anonymous mode.
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
                <Link
                  to="/signup?role=receiver&step=2"
                  style={{
                    textDecoration: 'none',
                    background: '#ff6b4a',
                    color: '#ffffff',
                    padding: '14px 32px',
                    borderRadius: '100px',
                    fontSize: '15px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 12px 28px rgba(255, 107, 74, 0.35)',
                    transition: 'transform 0.2s ease, background 0.2s ease'
                  }}
                >
                  <span>✨</span> Sign up to Receive Food <span>→</span>
                </Link>

                <Link
                  to="/login?redirect=/find-food"
                  style={{
                    textDecoration: 'none',
                    background: '#ffffff',
                    color: '#2c2320',
                    border: '1.5px solid #e5ded9',
                    padding: '14px 28px',
                    borderRadius: '100px',
                    fontSize: '15px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  Already registered? Log in
                </Link>
              </div>

              <div style={{ fontSize: '13px', color: '#8c7e77' }}>
                100% free forever for receivers · Completely anonymous &amp; dignified · Takes less than 60 seconds
              </div>
            </div>

            {/* Three Perks of Receiving */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', textAlign: 'left', marginBottom: '40px' }}>
              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid rgba(44, 35, 32, 0.06)' }}>
                <div style={{ fontSize: '26px', marginBottom: '12px' }}>🕵️</div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320', margin: '0 0 6px' }}>100% Anonymous &amp; Dignified</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#6b5d56', margin: 0 }}>
                  Your identity and real name are never exposed publicly. Unique encrypted pickup codes guarantee private meal retrieval without stigma.
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid rgba(44, 35, 32, 0.06)' }}>
                <div style={{ fontSize: '26px', marginBottom: '12px' }}>🍲</div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320', margin: '0 0 6px' }}>Fresh &amp; Nutritious Variety</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#6b5d56', margin: 0 }}>
                  Access cooked hot meals, fresh produce, bakery bread, and packaged groceries donated freshly by verified restaurants and grocery partners.
                </p>
              </div>

              <div style={{ background: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid rgba(44, 35, 32, 0.06)' }}>
                <div style={{ fontSize: '26px', marginBottom: '12px' }}>📍</div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#2c2320', margin: '0 0 6px' }}>Walking-Distance Pickups</h3>
                <p style={{ fontSize: '13px', lineHeight: 1.5, color: '#6b5d56', margin: 0 }}>
                  Locate active distributions and safe pickup points close to you, with verified timings, portion counts, and clear directions.
                </p>
              </div>
            </div>

            <div style={{ fontSize: '14px', color: '#6b5d56' }}>
              Want to donate surplus food instead?{' '}
              <Link to="/donate" style={{ color: '#f04b28', fontWeight: 700, textDecoration: 'none' }}>
                Donate food to community →
              </Link>
            </div>
          </div>

          {/* Live Meals Discovery Explorer Section */}
          <div id="live-map" style={{ borderTop: '2px dashed #f0ecea', paddingTop: '48px', marginTop: '32px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#dcfce7', color: '#15803d', padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span> LIVE AVAILABLE MEALS
                </div>
                <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 800, color: '#2c2320', fontFamily: "'Fraunces', serif" }}>
                  Explore Active Food Listings
                </h2>
                <p style={{ margin: '4px 0 0', color: '#6b5d56', fontSize: '14px' }}>
                  Browse current surplus food posted by donors across Bangladesh. Sign up as a receiver to claim any meal.
                </p>
              </div>

              {/* View Toggle (Map / Grid) */}
              <div style={{ display: 'flex', background: '#ffffff', border: '1px solid rgba(44,35,32,0.1)', borderRadius: '12px', padding: '4px' }}>
                <button
                  onClick={() => setViewMode('map')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 0,
                    background: viewMode === 'map' ? '#ff6b4a' : 'transparent',
                    color: viewMode === 'map' ? '#ffffff' : '#2c2320',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🗺️ Map View
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 0,
                    background: viewMode === 'grid' ? '#ff6b4a' : 'transparent',
                    color: viewMode === 'grid' ? '#ffffff' : '#2c2320',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  📋 Grid Cards ({filteredPosts.length})
                </button>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid rgba(44,35,32,0.06)', boxShadow: '0 4px 16px rgba(44,35,32,0.04)', marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search by District, Thana, Area, or Donor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid #e0d8d3',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['All', 'Veg', 'Non-Veg', 'Cooked'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '100px',
                      border: '1px solid',
                      borderColor: selectedType === type ? '#ff6b4a' : '#e0d8d3',
                      background: selectedType === type ? '#ffebe6' : '#ffffff',
                      color: selectedType === type ? '#d9381e' : '#6b5d56',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    {type === 'Veg' ? '🥬 Veg' : type === 'Non-Veg' ? '🍗 Non-Veg' : type === 'Cooked' ? '🍲 Cooked' : '✨ All Types'}
                  </button>
                ))}
              </div>
            </div>

            {/* Map View */}
            {viewMode === 'map' && (
              <div style={{ background: '#ffffff', borderRadius: '20px', padding: '12px', border: '1px solid rgba(44,35,32,0.06)', boxShadow: '0 12px 32px rgba(44,35,32,0.08)', marginBottom: '32px' }}>
                <div style={{ width: '100%', height: '500px', borderRadius: '14px', overflow: 'hidden', zIndex: 1 }}>
                  <MapContainer
                    center={validMapPosts.length > 0 ? [parseFloat(validMapPosts[0].latitude), parseFloat(validMapPosts[0].longitude)] : defaultCenter}
                    zoom={12}
                    scrollWheelZoom={false}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {validMapPosts.map((post) => (
                      <Marker
                        key={post.id}
                        position={[parseFloat(post.latitude), parseFloat(post.longitude)]}
                        icon={createFoodMarkerIcon(post.food_type)}
                      >
                        <Popup>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '4px', maxWidth: '240px' }}>
                            <span style={{ background: '#ffe4db', color: '#c8391b', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: 700, display: 'inline-block', marginBottom: '4px' }}>
                              {post.food_type} • {post.quantity} Meals
                            </span>
                            <h4 style={{ margin: '4px 0', fontSize: '14px', fontWeight: 700, color: '#2c2320' }}>
                              {post.food_name || post.title || `${post.food_type} Meals`}
                            </h4>
                            <p style={{ margin: '2px 0 4px', fontSize: '11px', color: '#6b5d56' }}>
                              📍 {post.district}, {post.thana}
                            </p>
                            <p style={{ margin: '4px 0 8px', fontSize: '11px', color: '#ff6b4a', fontWeight: 600 }}>
                              ⏰ Expires: {new Date(post.expiry_time).toLocaleString()}
                            </p>
                            <button
                              onClick={() => setSelectedPost(post)}
                              style={{ width: '100%', background: '#ff6b4a', color: '#fff', border: 0, padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', marginBottom: '4px' }}
                            >
                              View Details →
                            </button>
                            <button
                              onClick={() => setShowSignupPromptModal(post)}
                              style={{ width: '100%', background: '#2c2320', color: '#fff', border: 0, padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              🍱 Claim This Meal
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {loadingPosts ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#6b5d56' }}>Loading active food posts...</div>
                ) : filteredPosts.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '16px', color: '#6b5d56', gridColumn: '1 / -1' }}>
                    No food posts found matching your search.
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        border: '1px solid rgba(44,35,32,0.06)',
                        padding: '20px',
                        boxShadow: '0 4px 16px rgba(44,35,32,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ background: '#e3f5ea', color: '#227a55', padding: '3px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: 700 }}>
                            {post.food_type}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#ff6b4a', background: '#fff0ec', padding: '3px 10px', borderRadius: '100px' }}>
                            🍲 {post.quantity} Servings
                          </span>
                        </div>

                        <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 700, color: '#2c2320' }}>
                          {post.food_name || post.title || `${post.food_type} Meals`}
                        </h3>
                        <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#6b5d56' }}>
                          📍 {post.district}, {post.thana}{post.area_ward ? ` (${post.area_ward})` : ''}
                        </p>

                        <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
                          <strong>Donor:</strong> {post.donor_name || 'Verified Donor'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={() => setSelectedPost(post)}
                          style={{ flex: 1, background: '#f5f0ed', color: '#2c2320', border: 0, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Details
                        </button>
                        <button
                          onClick={() => setShowSignupPromptModal(post)}
                          style={{ flex: 1, background: '#ff6b4a', color: '#ffffff', border: 0, padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                        >
                          🍱 Claim Meal
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Details Popup Modal */}
      {selectedPost && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 3000 }}>
          <div style={{ width: '100%', maxWidth: '520px', background: '#ffffff', borderRadius: '20px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#2c2320', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #eee5e0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                🍲 {selectedPost.food_name || selectedPost.title || `${selectedPost.food_type} Meals`}
              </h3>
              <button onClick={() => setSelectedPost(null)} style={{ background: 'transparent', border: 0, fontSize: '20px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: '10px', background: '#fcf8f6', padding: '16px', borderRadius: '14px', border: '1px solid #eee5e0', marginBottom: '16px', fontSize: '13px' }}>
              <div><strong>Item Name:</strong> {selectedPost.food_name || selectedPost.title || `${selectedPost.food_type} Meals`}</div>
              <div><strong>Food Type:</strong> {selectedPost.food_type}</div>
              <div><strong>Quantity:</strong> {selectedPost.quantity} Servings</div>
              <div><strong>Expiry Date/Time:</strong> {new Date(selectedPost.expiry_time).toLocaleString()}</div>
              <div><strong>District / Thana:</strong> {selectedPost.district}, {selectedPost.thana}</div>
              <div><strong>Pickup Area:</strong> {selectedPost.area_ward}, Road {selectedPost.road_no || 'N/A'}</div>
              <div><strong>Donor:</strong> {selectedPost.donor_name || 'Verified Donor'}</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedPost(null)} style={{ background: '#f3f4f6', color: '#374151', border: 0, borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Close
              </button>
              <button
                onClick={() => {
                  const target = selectedPost;
                  setSelectedPost(null);
                  setShowSignupPromptModal(target);
                }}
                style={{ background: '#ff6b4a', color: '#ffffff', border: 0, borderRadius: '8px', padding: '10px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                🍱 Claim This Meal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receiver Signup Prompt Modal for Unauthenticated Requests */}
      {showSignupPromptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 3200 }}>
          <div style={{ width: '100%', maxWidth: '460px', background: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', color: '#2c2320', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: '#ffe4db', color: '#d9381e', fontSize: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              🎁
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 800, fontFamily: "'Fraunces', serif" }}>
              Sign up as a Receiver to claim
            </h3>

            <p style={{ margin: '0 0 20px', fontSize: '14px', lineHeight: 1.5, color: '#6b5d56' }}>
              To request <strong>{showSignupPromptModal.food_name || showSignupPromptModal.title || showSignupPromptModal.food_type} ({showSignupPromptModal.quantity} servings)</strong> and get your secure pickup code, please create a free Receiver account or sign in.
            </p>

            <div style={{ display: 'grid', gap: '10px' }}>
              <Link
                to="/signup?role=receiver&step=2"
                style={{
                  textDecoration: 'none',
                  background: '#ff6b4a',
                  color: '#ffffff',
                  padding: '13px 20px',
                  borderRadius: '100px',
                  fontSize: '14px',
                  fontWeight: 700,
                  boxShadow: '0 8px 20px rgba(255, 107, 74, 0.35)'
                }}
              >
                ✨ Sign up to Receive Food →
              </Link>
              <Link
                to="/login?redirect=/find-food"
                style={{
                  textDecoration: 'none',
                  background: '#fcf8f6',
                  color: '#2c2320',
                  border: '1.5px solid #e5ded9',
                  padding: '12px 20px',
                  borderRadius: '100px',
                  fontSize: '14px',
                  fontWeight: 700
                }}
              >
                Already registered? Log in
              </Link>
              <button
                type="button"
                onClick={() => setShowSignupPromptModal(null)}
                style={{ background: 'transparent', border: 0, color: '#8c7e77', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginTop: '6px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FindFood;
