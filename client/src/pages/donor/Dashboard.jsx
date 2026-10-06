import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DonorLayout from '../../components/donor/DonorLayout';
import '../../App.css';

export const DonorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [foodPosts, setFoodPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const isVerified = user?.verification_status === 'verified';

  useEffect(() => {
    const fetchFoodPosts = async () => {
      if (!user?.id) {
        setFoodPosts([]);
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/food-posts?donor_id=${user.id}`);
        const data = await response.json();
        if (response.ok && data.foodPosts) {
          const myPosts = data.foodPosts.filter(
            (p) => Number(p.donor_id) === Number(user.id)
          );
          setFoodPosts(myPosts);
        } else {
          setFoodPosts([]);
        }
      } catch (error) {
        console.error('Error fetching food posts:', error);
        setFoodPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodPosts();
  }, [user]);

  const totalMeals = foodPosts.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const activeDonationsCount = foodPosts.length;

  return (
    <DonorLayout title="Home">
      <div style={{ width: '100%' }}>
        {/* Figma Hero Banner (Gradient) */}
        <div
          style={{
            background: 'linear-gradient(174deg, var(--brand-primary-light) 0%, var(--brand-primary-dark) 100%)',
            borderRadius: '16px',
            padding: '28px 32px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 12px 28px -12px rgba(var(--brand-primary-rgb), 0.4)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              position: 'relative',
              zIndex: 2
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>
                  Good morning, {user?.name || 'Donor'}! 👋
                </h1>
                <span
                  style={{
                    background: isVerified ? 'rgba(255,255,255,0.25)' : 'rgba(245, 158, 11, 0.3)',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {isVerified ? '✓ Verified Donor' : '⏳ Pending Verification'}
                </span>
              </div>
              <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
                You've rescued {totalMeals} meals so far. Keep going!
              </p>
            </div>

            <button
              onClick={() => {
                if (!isVerified) {
                  alert('Your profile is pending verification. Please complete your NID profile before posting.');
                  navigate('/donor/profile');
                } else {
                  navigate('/donor/post-food');
                }
              }}
              style={{
                background: '#ffffff',
                color: 'var(--brand-primary-dark)',
                border: 0,
                borderRadius: '100px',
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s'
              }}
            >
              + Post New Food
            </button>
          </div>
        </div>

        {/* Figma 3 Stat Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginTop: '24px'
          }}
        >
          {/* Card 1: Total Donations */}
          <div
            style={{
              background: '#ffe9e2',
              border: '1px solid #ffffff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(44, 35, 32, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b5d56', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Total Donations
                </span>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#2c2320', marginTop: 4 }}>
                  {activeDonationsCount}
                </div>
                <div style={{ fontSize: '13px', color: '#6b5d56', marginTop: 2 }}>all time</div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(145deg, var(--brand-primary) 0%, var(--brand-primary-dark) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  boxShadow: '0 6px 12px rgba(var(--brand-primary-rgb), 0.4)'
                }}
              >
                📦
              </div>
            </div>
          </div>

          {/* Card 2: Meals Shared */}
          <div
            style={{
              background: '#e3f5ea',
              border: '1px solid #ffffff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(44, 35, 32, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b5d56', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Meals Shared
                </span>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#2c2320', marginTop: 4 }}>
                  {totalMeals}
                </div>
                <div style={{ fontSize: '13px', color: '#6b5d56', marginTop: 2 }}>people fed</div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(145deg, #3fb984 0%, #299e69 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  boxShadow: '0 6px 12px rgba(63,185,132,0.4)'
                }}
              >
                🥗
              </div>
            </div>
          </div>

          {/* Card 3: Donor Rating */}
          <div
            style={{
              background: '#fff2d6',
              border: '1px solid #ffffff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(44, 35, 32, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b5d56', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Donor Rating
                </span>
                <div style={{ fontSize: '32px', fontWeight: 800, color: '#2c2320', marginTop: 4 }}>
                  4.8 ★
                </div>
                <div style={{ fontSize: '13px', color: '#6b5d56', marginTop: 2 }}>from 31 community reviews</div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(145deg, #e39a1c 0%, #c48011 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  boxShadow: '0 6px 12px rgba(227,154,28,0.4)'
                }}
              >
                ⭐
              </div>
            </div>
          </div>
        </div>

        {/* Figma Active Donations Section */}
        <div style={{ marginTop: '32px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(44,35,32,0.06)',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(44,35,32,0.04)'
            }}
          >
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f3ece8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#2c2320' }}>
                Active Donations
              </h3>
              <Link
                to="/donor/post-food"
                style={{ color: 'var(--brand-primary-dark)', fontWeight: 700, fontSize: '14px', textDecoration: 'none' }}
              >
                View all →
              </Link>
            </div>

            <div style={{ padding: '8px 0' }}>
              {loading ? (
                <div style={{ padding: '24px', textAlign: 'center', color: '#888' }}>Loading active donations...</div>
              ) : foodPosts.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#6b5d56' }}>
                  No active food donations. Click <strong>+ Post New Food</strong> above to share food!
                </div>
              ) : (
                foodPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      padding: '16px 24px',
                      borderBottom: '1px solid #f8f3f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: 'var(--brand-soft)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22
                        }}
                      >
                        🥗
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#2c2320' }}>
                          {post.food_type} ({post.quantity} meals)
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b5d56', marginTop: 2 }}>
                          📍 {[post.thana, post.district].filter(Boolean).join(', ') || 'Address specified'} · Expires: {new Date(post.expiry_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: post.status === 'collected' ? 'rgba(74,144,226,0.14)' : 'rgba(245,183,62,0.14)',
                        color: post.status === 'collected' ? '#2a5f9e' : '#9a6b12',
                        padding: '6px 14px',
                        borderRadius: '100px',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: post.status === 'collected' ? '#4a90e2' : '#f5b73e'
                        }}
                      />
                      {post.status || 'Available'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DonorLayout>
  );
};

export default DonorDashboard;
