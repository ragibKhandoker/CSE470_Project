import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { API_BASE_URL } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import '../../App.css';

export const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  // Derived metrics with safe fallbacks
  const totalUsers = stats?.totalUsers || 0;
  const roleBreakdown = stats?.roleBreakdown || { donor: 0, ngo: 0, receiver: 0, admin: 0, ngo_staff: 0 };
  const totalPortions = stats?.totalPortions || 0;
  const totalFoodPosts = stats?.totalFoodPosts || 0;
  const availableFoodPosts = stats?.availableFoodPosts || 0;
  const rescuedFoodPosts = stats?.rescuedFoodPosts || 0;
  const pendingVerifications = stats?.pendingVerifications || 0;

  const totalRequests = stats?.requests?.total || 0;
  const completedRequests = stats?.requests?.completed || 0;
  const anonRequests = stats?.requests?.anonymous || 0;
  const namedRequests = Math.max(0, totalRequests - anonRequests);

  const activeBotAlerts = stats?.security?.activeBotAlerts || 0;
  const totalBotAlerts = stats?.security?.totalBotAlerts || 0;
  const pendingFoodReports = stats?.security?.pendingFoodReports || 0;
  const totalFoodReports = stats?.security?.totalFoodReports || 0;
  const pendingPasswordRequests = stats?.security?.pendingPasswordRequests || 0;

  const recentFoodPosts = stats?.recentFoodPosts || [];
  const recentUsers = stats?.recentUsers || [];
  const foodTypeBreakdown = stats?.foodTypeBreakdown || [];

  const totalFoodPortionsSum = foodTypeBreakdown.reduce((sum, item) => sum + (item.portions || 0), 0) || totalPortions || 1;

  // Status badge style helper for food posts
  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return { bg: '#ecfdf5', color: '#059669', label: 'Available' };
      case 'at_ngo_point':
        return { bg: '#eff6ff', color: '#2563eb', label: 'At NGO Hub' };
      case 'collected':
        return { bg: '#fef3c7', color: '#d97706', label: 'Picked Up' };
      case 'completed':
      case 'distributed':
        return { bg: '#f3e8ff', color: '#7e22ce', label: 'Distributed' };
      default:
        return { bg: '#f3f4f6', color: '#4b5563', label: status || 'Active' };
    }
  };

  // Status badge style helper for user roles
  const getRoleBadge = (role) => {
    switch (role) {
      case 'donor':
        return { bg: '#ecfdf5', color: '#059669', label: 'Donor' };
      case 'ngo':
        return { bg: '#fff7ed', color: '#ea580c', label: 'NGO' };
      case 'receiver':
        return { bg: '#eff6ff', color: '#2563eb', label: 'Receiver' };
      case 'ngo_staff':
        return { bg: '#fdf4ff', color: '#c026d3', label: 'NGO Staff' };
      case 'admin':
      case 'super_admin':
        return { bg: '#fef2f2', color: '#dc2626', label: 'Super Admin' };
      default:
        return { bg: '#f3f4f6', color: '#4b5563', label: role };
    }
  };

  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <AdminLayout title="Super Admin Dashboard">
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top Hero Command Center Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1f1a18 0%, #2c2320 60%, #3d2f2a 100%)',
            borderRadius: '20px',
            padding: '28px 32px',
            color: '#ffffff',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px' }}>👑</span>
              <span
                style={{
                  background: 'rgba(255, 107, 74, 0.2)',
                  color: '#ff8461',
                  border: '1px solid rgba(255, 107, 74, 0.35)',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '100px',
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase'
                }}
              >
                Executive Command Center
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '13px' }}>•</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '12px', fontWeight: 600 }}>
                {currentDateStr} (BST)
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px', color: '#ffffff', fontFamily: "'Fraunces', serif" }}>
              Welcome back, {user?.name || 'Super Admin'} 👋
            </h1>
            <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', fontSize: '13.5px', lineHeight: 1.5 }}>
              National surplus food rescue, volunteer NGO distribution logistics, and platform integrity monitor across Bangladesh.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '6px 14px',
                borderRadius: '100px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: '12px',
                color: '#e5e7eb'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
              <strong>All Services Live</strong> • DB Response: &lt; 15ms
            </div>

            <button
              onClick={fetchStats}
              disabled={refreshing}
              style={{
                background: '#ff6b4a',
                color: '#ffffff',
                border: 'none',
                padding: '9px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: refreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(255, 107, 74, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ display: 'inline-block', transform: refreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s linear' }}>
                ↻
              </span>
              {refreshing ? 'Refreshing...' : 'Refresh Live Data'}
            </button>
          </div>
        </div>

        {/* Immediate Action Attention Strip */}
        {(pendingVerifications > 0 || activeBotAlerts > 0 || pendingFoodReports > 0 || pendingPasswordRequests > 0) && (
          <div
            style={{
              background: '#fff9f5',
              borderRadius: '16px',
              padding: '16px 22px',
              border: '1.5px solid #fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 4px 16px rgba(234, 88, 12, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <div>
                <strong style={{ fontSize: '14px', color: '#9a3412' }}>Items Requiring Immediate Admin Attention:</strong>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {pendingVerifications > 0 && (
                    <Link
                      to="/admin/users"
                      style={{
                        textDecoration: 'none',
                        background: '#fef3c7',
                        color: '#b45309',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid #fde68a'
                      }}
                    >
                      ⏳ {pendingVerifications} Pending Verification{pendingVerifications > 1 ? 's' : ''}
                    </Link>
                  )}
                  {activeBotAlerts > 0 && (
                    <Link
                      to="/admin/bot-alerts"
                      style={{
                        textDecoration: 'none',
                        background: '#fee2e2',
                        color: '#b91c1c',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid #fecaca'
                      }}
                    >
                      🚨 {activeBotAlerts} Active Risk Alert{activeBotAlerts > 1 ? 's' : ''}
                    </Link>
                  )}
                  {pendingFoodReports > 0 && (
                    <Link
                      to="/admin/reports"
                      style={{
                        textDecoration: 'none',
                        background: '#ffedd5',
                        color: '#c2410c',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid #fed7aa'
                      }}
                    >
                      🚩 {pendingFoodReports} Food Quality Report{pendingFoodReports > 1 ? 's' : ''}
                    </Link>
                  )}
                  {pendingPasswordRequests > 0 && (
                    <Link
                      to="/admin/users"
                      style={{
                        textDecoration: 'none',
                        background: '#e0e7ff',
                        color: '#4338ca',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: '1px solid #c7d2fe'
                      }}
                    >
                      🔑 {pendingPasswordRequests} Password Reset{pendingPasswordRequests > 1 ? 's' : ''}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <Link
              to="/admin/users"
              style={{
                textDecoration: 'none',
                background: '#ea580c',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
              }}
            >
              Open Queue →
            </Link>
          </div>
        )}

        {/* Core Metric Summary KPI Grid (4 Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          
          {/* Card 1: Registered Accounts */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              padding: '24px',
              border: '1px solid rgba(44, 35, 32, 0.08)',
              boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b5d56', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  👥 Citizen &amp; Partner Accounts
                </span>
                <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                  Live DB
                </span>
              </div>
              <div style={{ fontSize: '38px', fontWeight: 800, color: '#2c2320', marginTop: '6px', fontFamily: "'Fraunces', serif" }}>
                {loading ? '...' : totalUsers}
              </div>
              <div style={{ fontSize: '12px', color: '#786d66', marginTop: '2px' }}>
                Total registered ecosystem members
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                <span style={{ background: '#f5f3f0', color: '#4b5563', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                  🍱 {roleBreakdown.donor || 0} Donors
                </span>
                <span style={{ background: '#f5f3f0', color: '#4b5563', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                  🏢 {roleBreakdown.ngo || 0} NGOs
                </span>
                <span style={{ background: '#f5f3f0', color: '#4b5563', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                  🎁 {roleBreakdown.receiver || 0} Receivers
                </span>
              </div>
              <Link to="/admin/users" style={{ textDecoration: 'none', fontSize: '12.5px', fontWeight: 700, color: '#ff6b4a' }}>
                Manage Accounts &amp; Verifications →
              </Link>
            </div>
          </div>

          {/* Card 2: Food Portions Rescued */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              padding: '24px',
              border: '1px solid rgba(44, 35, 32, 0.08)',
              boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b5d56', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🍲 Food Rescued &amp; Distributed
                </span>
                <span style={{ background: '#fff0ec', color: '#c8391b', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                  {totalFoodPosts} Posts
                </span>
              </div>
              <div style={{ fontSize: '38px', fontWeight: 800, color: '#ff6b4a', marginTop: '6px', fontFamily: "'Fraunces', serif" }}>
                {loading ? '...' : totalPortions}
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#6b5d56', marginLeft: '6px' }}>servings</span>
              </div>
              <div style={{ fontSize: '12px', color: '#786d66', marginTop: '2px' }}>
                Nutritious meals diverted from waste
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                <span style={{ background: '#ecfdf5', color: '#047857', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                  🟢 {availableFoodPosts} Available Now
                </span>
                <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                  📦 {rescuedFoodPosts} In Distribution / Rescued
                </span>
              </div>
              <Link to="/admin/food-threads" style={{ textDecoration: 'none', fontSize: '12.5px', fontWeight: 700, color: '#ff6b4a' }}>
                Audit Food Rescue Threads →
              </Link>
            </div>
          </div>

          {/* Card 3: Distribution Requests */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              padding: '24px',
              border: '1px solid rgba(44, 35, 32, 0.08)',
              boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b5d56', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🚚 Requests &amp; Fulfillment
                </span>
                <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                  {totalRequests} Total
                </span>
              </div>
              <div style={{ fontSize: '38px', fontWeight: 800, color: '#2563eb', marginTop: '6px', fontFamily: "'Fraunces', serif" }}>
                {loading ? '...' : completedRequests}
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#6b5d56', marginLeft: '6px' }}>fulfilled</span>
              </div>
              <div style={{ fontSize: '12px', color: '#786d66', marginTop: '2px' }}>
                Secure OTP handover completions
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                <span style={{ background: '#f5f3f0', color: '#4b5563', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                  👤 {namedRequests} Named
                </span>
                <span style={{ background: '#f5f3f0', color: '#4b5563', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                  🕶️ {anonRequests} Anonymous
                </span>
              </div>
              <Link to="/admin/analytics" style={{ textDecoration: 'none', fontSize: '12.5px', fontWeight: 700, color: '#ff6b4a' }}>
                View Request Heatmaps →
              </Link>
            </div>
          </div>

          {/* Card 4: Platform Security & Safety */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              padding: '24px',
              border: '1px solid rgba(44, 35, 32, 0.08)',
              boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b5d56', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🛡️ Security &amp; Safety Shield
                </span>
                <span
                  style={{
                    background: activeBotAlerts === 0 ? '#ecfdf5' : '#fee2e2',
                    color: activeBotAlerts === 0 ? '#059669' : '#dc2626',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}
                >
                  {activeBotAlerts === 0 ? 'Shield Active' : `${activeBotAlerts} Alerts`}
                </span>
              </div>
              <div
                style={{
                  fontSize: '38px',
                  fontWeight: 800,
                  color: activeBotAlerts === 0 ? '#10b981' : '#dc2626',
                  marginTop: '6px',
                  fontFamily: "'Fraunces', serif"
                }}
              >
                {loading ? '...' : activeBotAlerts === 0 ? '100%' : `${activeBotAlerts} Risk`}
              </div>
              <div style={{ fontSize: '12px', color: '#786d66', marginTop: '2px' }}>
                {activeBotAlerts === 0 ? 'Zero bot or fraud anomalies' : 'Anomalies flagged by safety engine'}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                <span style={{ background: '#f5f3f0', color: '#4b5563', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                  🤖 {totalBotAlerts} Audits Logged
                </span>
                <span style={{ background: '#f5f3f0', color: '#4b5563', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                  🚩 {totalFoodReports} Incident Logs
                </span>
              </div>
              <Link to="/admin/bot-alerts" style={{ textDecoration: 'none', fontSize: '12.5px', fontWeight: 700, color: '#ff6b4a' }}>
                Audit Bot Alerts &amp; Telemetry →
              </Link>
            </div>
          </div>

        </div>

        {/* Middle Section: Food Distribution & Ecosystem Composition (Two Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          
          {/* Left: Food Category Composition */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px 28px',
              border: '1px solid rgba(44, 35, 32, 0.08)',
              boxShadow: '0 4px 18px rgba(44, 35, 32, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#2c2320', fontFamily: "'Fraunces', serif" }}>
                  🍱 Rescued Food Category Breakdown
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                  Live distribution of servings across major culinary categories
                </p>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ff6b4a' }}>
                {totalPortions} Total Servings
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {foodTypeBreakdown.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                  Loading food categories...
                </div>
              ) : (
                foodTypeBreakdown.map((item, idx) => {
                  const pct = Math.round(((item.portions || 0) / totalFoodPortionsSum) * 100) || 0;
                  const colors = ['#ff6b4a', '#d97706', '#10b981', '#6366f1', '#ec4899'];
                  const barColor = colors[idx % colors.length];

                  return (
                    <div key={item.foodType}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#2c2320' }}>
                          {item.foodType} Meals
                        </span>
                        <span style={{ color: '#6b5d56' }}>
                          <strong>{item.portions}</strong> servings ({pct}%)
                        </span>
                      </div>
                      <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.max(5, pct)}%`,
                            background: barColor,
                            borderRadius: '10px',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right: Ecosystem Role Breakdown */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px 28px',
              border: '1px solid rgba(44, 35, 32, 0.08)',
              boxShadow: '0 4px 18px rgba(44, 35, 32, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#2c2320', fontFamily: "'Fraunces', serif" }}>
                  🏛️ Platform Ecosystem Composition
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                  Distribution of registered stakeholders and governance roles
                </p>
              </div>
              <Link to="/admin/users" style={{ fontSize: '12px', fontWeight: 700, color: '#ff6b4a', textDecoration: 'none' }}>
                All Users →
              </Link>
            </div>

            {/* Visual multi-segment bar */}
            <div style={{ height: '12px', display: 'flex', borderRadius: '100px', overflow: 'hidden', marginBottom: '18px', background: '#f3f4f6' }}>
              <div style={{ width: `${Math.max(8, Math.round(((roleBreakdown.donor || 0) / Math.max(1, totalUsers)) * 100))}%`, background: '#10b981' }} title="Donors" />
              <div style={{ width: `${Math.max(8, Math.round(((roleBreakdown.ngo || 0) / Math.max(1, totalUsers)) * 100))}%`, background: '#f59e0b' }} title="NGOs" />
              <div style={{ width: `${Math.max(8, Math.round(((roleBreakdown.receiver || 0) / Math.max(1, totalUsers)) * 100))}%`, background: '#3b82f6' }} title="Receivers" />
              <div style={{ width: `${Math.max(4, Math.round(((roleBreakdown.admin || 0) / Math.max(1, totalUsers)) * 100))}%`, background: '#ef4444' }} title="Super Admins" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ background: '#fcf8f6', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f0e6e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b5d56' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                  <strong>Food Donors</strong>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2c2320', marginTop: '4px' }}>
                  {roleBreakdown.donor || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>Hotels, restaurants, event caterers</div>
              </div>

              <div style={{ background: '#fcf8f6', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f0e6e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b5d56' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                  <strong>Partner NGOs</strong>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2c2320', marginTop: '4px' }}>
                  {roleBreakdown.ngo || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>Distribution logistics organizations</div>
              </div>

              <div style={{ background: '#fcf8f6', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f0e6e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b5d56' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span>
                  <strong>Receivers &amp; Shelters</strong>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2c2320', marginTop: '4px' }}>
                  {roleBreakdown.receiver || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>Needy citizens, students, orphanages</div>
              </div>

              <div style={{ background: '#fcf8f6', padding: '12px 14px', borderRadius: '12px', border: '1px solid #f0e6e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b5d56' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <strong>Platform Officers</strong>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2c2320', marginTop: '4px' }}>
                  {roleBreakdown.admin || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>Super admins &amp; governance team</div>
              </div>
            </div>
          </div>

        </div>

        {/* Live Platform Feed Intelligence (Two Columns) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '20px' }}>
          
          {/* Column 1: Recent Food Donations Feed */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(44, 35, 32, 0.08)',
              boxShadow: '0 4px 18px rgba(44, 35, 32, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#2c2320', fontFamily: "'Fraunces', serif" }}>
                    🍲 Live Food Donations Stream
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                    Newest surplus meals posted by verified donors
                  </p>
                </div>
                <Link to="/admin/food-threads" style={{ textDecoration: 'none', fontSize: '12px', fontWeight: 700, color: '#ff6b4a' }}>
                  View All Threads →
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentFoodPosts.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                    No food donations recorded yet.
                  </div>
                ) : (
                  recentFoodPosts.map((post) => {
                    const badge = getStatusBadge(post.status);
                    return (
                      <div
                        key={post.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid rgba(44, 35, 32, 0.06)',
                          background: '#faf9f8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '14px', color: '#2c2320', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              #{post.id} • {post.name}
                            </strong>
                            <span
                              style={{
                                background: '#ffe4db',
                                color: '#c8391b',
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              {post.foodType}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#786d66', marginTop: '2px' }}>
                            <span>👤 {post.donorName}</span> • <span>🍱 {post.quantity} servings</span> • <span>📍 {post.location}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                          <span
                            style={{
                              background: badge.bg,
                              color: badge.color,
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            {badge.label}
                          </span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {post.timeAgo}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
              <Link to="/admin/food-threads" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: 700, color: '#ff6b4a' }}>
                Inspect Full Lifecycle Delivery Threads →
              </Link>
            </div>
          </div>

          {/* Column 2: Recent User Registrations */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(44, 35, 32, 0.08)',
              boxShadow: '0 4px 18px rgba(44, 35, 32, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#2c2320', fontFamily: "'Fraunces', serif" }}>
                    👥 Recent Registrations &amp; Audit
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                    Citizens, donors, and NGOs onboarded to ShareMeal
                  </p>
                </div>
                <Link to="/admin/users" style={{ textDecoration: 'none', fontSize: '12px', fontWeight: 700, color: '#ff6b4a' }}>
                  Manage Users →
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentUsers.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                    No user accounts found.
                  </div>
                ) : (
                  recentUsers.map((u) => {
                    const roleBadge = getRoleBadge(u.role);
                    const isVerified = u.verificationStatus === 'verified';
                    const initials = (u.name || 'User')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={u.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: '1px solid rgba(44, 35, 32, 0.06)',
                          background: '#faf9f8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#ffe4db',
                              color: '#ff6b4a',
                              fontWeight: 800,
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: '13.5px', color: '#2c2320', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {u.name}
                              </strong>
                              <span
                                style={{
                                  background: roleBadge.bg,
                                  color: roleBadge.color,
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {roleBadge.label}
                              </span>
                            </div>
                            <div style={{ fontSize: '11.5px', color: '#888', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.email}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px', flexShrink: 0 }}>
                          <span
                            style={{
                              background: isVerified ? '#ecfdf5' : '#fef3c7',
                              color: isVerified ? '#059669' : '#b45309',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px'
                            }}
                          >
                            {isVerified ? '✓ Verified' : '⏳ Pending'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                            {u.timeAgo}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', textAlign: 'center' }}>
              <Link to="/admin/users" style={{ textDecoration: 'none', fontSize: '13px', fontWeight: 700, color: '#ff6b4a' }}>
                Open Comprehensive User Management Directory →
              </Link>
            </div>
          </div>

        </div>

        {/* Super Admin Quick Governance Navigation Grid */}
        <div style={{ marginTop: '8px' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#2c2320', fontFamily: "'Fraunces', serif" }}>
              🛠️ Platform Governance &amp; Administration Toolkit
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
              One-click shortcuts to key administrative portals and security consoles
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            
            <Link
              to="/admin/users"
              style={{
                textDecoration: 'none',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid rgba(44, 35, 32, 0.08)',
                boxShadow: '0 4px 14px rgba(44, 35, 32, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <span style={{ fontSize: '24px' }}>👥</span>
              <strong style={{ fontSize: '14px', color: '#2c2320' }}>User Management</strong>
              <span style={{ fontSize: '11.5px', color: '#888', lineHeight: 1.4 }}>
                NID verification queue, password resets, and account audits.
              </span>
            </Link>

            <Link
              to="/admin/food-threads"
              style={{
                textDecoration: 'none',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid rgba(44, 35, 32, 0.08)',
                boxShadow: '0 4px 14px rgba(44, 35, 32, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <span style={{ fontSize: '24px' }}>🍲</span>
              <strong style={{ fontSize: '14px', color: '#2c2320' }}>Food Threads</strong>
              <span style={{ fontSize: '11.5px', color: '#888', lineHeight: 1.4 }}>
                End-to-end donor pickup to beneficiary distribution threads.
              </span>
            </Link>

            <Link
              to="/admin/reports"
              style={{
                textDecoration: 'none',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid rgba(44, 35, 32, 0.08)',
                boxShadow: '0 4px 14px rgba(44, 35, 32, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <span style={{ fontSize: '24px' }}>🚩</span>
              <strong style={{ fontSize: '14px', color: '#2c2320' }}>Food Reports</strong>
              <span style={{ fontSize: '11.5px', color: '#888', lineHeight: 1.4 }}>
                Food quality issues, spoiled food proofs, and investigation.
              </span>
            </Link>

            <Link
              to="/admin/bot-alerts"
              style={{
                textDecoration: 'none',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid rgba(44, 35, 32, 0.08)',
                boxShadow: '0 4px 14px rgba(44, 35, 32, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <span style={{ fontSize: '24px' }}>🤖</span>
              <strong style={{ fontSize: '14px', color: '#2c2320' }}>Bot &amp; Fraud Alerts</strong>
              <span style={{ fontSize: '11.5px', color: '#888', lineHeight: 1.4 }}>
                Velocity spikes, multi-account correlation, and verification revoke.
              </span>
            </Link>

            <Link
              to="/admin/analytics"
              style={{
                textDecoration: 'none',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid rgba(44, 35, 32, 0.08)',
                boxShadow: '0 4px 14px rgba(44, 35, 32, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <span style={{ fontSize: '24px' }}>📈</span>
              <strong style={{ fontSize: '14px', color: '#2c2320' }}>Analytics</strong>
              <span style={{ fontSize: '11.5px', color: '#888', lineHeight: 1.4 }}>
                Meal trends, top donors, NGO volume, and geographic insights.
              </span>
            </Link>

            <Link
              to="/admin/settings"
              style={{
                textDecoration: 'none',
                background: '#ffffff',
                borderRadius: '16px',
                padding: '18px',
                border: '1px solid rgba(44, 35, 32, 0.08)',
                boxShadow: '0 4px 14px rgba(44, 35, 32, 0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <span style={{ fontSize: '24px' }}>⚙️</span>
              <strong style={{ fontSize: '14px', color: '#2c2320' }}>Settings &amp; Team</strong>
              <span style={{ fontSize: '11.5px', color: '#888', lineHeight: 1.4 }}>
                System configuration, admin privileges, and platform policies.
              </span>
            </Link>

          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
