import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DonorLayout from '../../components/donor/DonorLayout';
import { API_BASE_URL } from '../../utils/constants';

// Activity seed strictly matching Figma Node 8:24452
const FIGMA_HISTORY_RECORDS = [
  {
    id: 'hist-1',
    date: 'Aug 8, 2026',
    dateObj: new Date('2026-08-08'),
    action: 'Posted',
    food: 'Garden Salad Trays',
    status: 'Collected',
    statusKey: 'collected'
  },
  {
    id: 'hist-2',
    date: 'Aug 8, 2026',
    dateObj: new Date('2026-08-08'),
    action: 'Posted',
    food: 'Fresh Dinner Platters',
    status: 'Available',
    statusKey: 'available'
  },
  {
    id: 'hist-3',
    date: 'Aug 7, 2026',
    dateObj: new Date('2026-08-07'),
    action: 'Collected',
    food: 'Grain Bowls & Greens',
    status: 'At NGO Point',
    statusKey: 'at_ngo_point'
  },
  {
    id: 'hist-4',
    date: 'Aug 6, 2026',
    dateObj: new Date('2026-08-06'),
    action: 'Completed',
    food: 'Surplus Produce Crate',
    status: 'Taken',
    statusKey: 'taken'
  },
  {
    id: 'hist-5',
    date: 'Aug 5, 2026',
    dateObj: new Date('2026-08-05'),
    action: 'Expired',
    food: 'Bakery Assortment',
    status: 'Expired',
    statusKey: 'expired'
  }
];

const getStatusConfig = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('collected')) {
    return { bg: '#ebf3fe', color: '#2563eb', label: 'Collected' };
  }
  if (s.includes('available')) {
    return { bg: '#fef9ee', color: '#d97706', label: 'Available' };
  }
  if (s.includes('at ngo point') || s.includes('ngo point')) {
    return { bg: '#ebf3fe', color: '#2563eb', label: 'At NGO Point' };
  }
  if (s.includes('taken') || s.includes('completed')) {
    return { bg: '#eaf7ed', color: '#16a34a', label: 'Taken' };
  }
  if (s.includes('expired')) {
    return { bg: '#fdeee9', color: '#dc2626', label: 'Expired' };
  }
  return { bg: '#f3f4f6', color: '#4b5563', label: status };
};

export const DonorHistory = () => {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | 'week' | 'month'
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user?.id) {
        setRecords([]);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/food-posts?donor_id=${user.id}`);
        const data = await res.json();
        let apiRecords = [];
        if (res.ok && data.foodPosts && data.foodPosts.length > 0) {
          const myPosts = data.foodPosts.filter(
            (p) => Number(p.donor_id) === Number(user.id)
          );
          apiRecords = myPosts.map((p) => {
            const dt = p.created_at ? new Date(p.created_at) : new Date();
            const dateStr = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return {
              id: `rec-${p.id}`,
              date: dateStr,
              dateObj: dt,
              action: 'Posted',
              food: p.title || (p.food_type ? `${p.food_type} Meal Donation` : 'Nutritious Meal'),
              status: p.status === 'available' ? 'Available' : p.status === 'collected' ? 'Collected' : (p.status === 'completed' || p.status === 'taken') ? 'Taken' : 'Available',
              statusKey: p.status || 'available'
            };
          });
        }
        setRecords(apiRecords);
      } catch (err) {
        console.error('Error fetching history:', err);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // Filter records by time period
  const filteredRecords = records.filter((r) => {
    if (timeFilter === 'all') return true;
    const now = new Date();
    const diffDays = (now - r.dateObj) / (1000 * 60 * 60 * 24);
    if (timeFilter === 'week') return diffDays <= 7;
    if (timeFilter === 'month') return diffDays <= 30;
    return true;
  });

  return (
    <DonorLayout title="History">
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
        {/* Top Control Bar (Figma Node 8:24452) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24
          }}
        >
          {/* Subtitle on the left */}
          <span style={{ fontSize: '14px', color: '#6b5d56', fontWeight: 500 }}>
            Showing all activity, newest first
          </span>

          {/* Time Filter Select Dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{
                appearance: 'none',
                background: '#ffffff',
                border: '1px solid rgba(44,35,32,0.12)',
                borderRadius: '10px',
                padding: '8px 36px 8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#2c2320',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(44,35,32,0.03)',
                outline: 'none'
              }}
            >
              <option value="all">All time</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
            </select>
            {/* Custom chevron indicator */}
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                fontSize: '10px',
                color: '#6b5d56'
              }}
            >
              ▼
            </span>
          </div>
        </div>

        {/* Activity Table Card (Figma Node 8:24452) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid rgba(44,35,32,0.06)',
            boxShadow: '0 6px 24px rgba(44,35,32,0.04)',
            overflow: 'hidden'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(44,35,32,0.06)' }}>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#6b5d56', width: '22%' }}>Date</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#6b5d56', width: '20%' }}>Action</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#6b5d56', width: '38%' }}>Food</th>
                  <th style={{ padding: '16px 24px', fontSize: '13px', fontWeight: 600, color: '#6b5d56', width: '20%' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '48px 24px', textAlign: 'center', color: '#786d66' }}>
                      Loading donation history...
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '48px 24px', textAlign: 'center', color: '#786d66' }}>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📜</div>
                      <strong>No donation history found.</strong>
                      <div style={{ fontSize: '13px', marginTop: '4px' }}>
                        When you post food donations, your complete transaction and collection history will appear here.
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item, idx) => {
                  const statusCfg = getStatusConfig(item.status);
                  const isLast = idx === filteredRecords.length - 1;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: isLast ? 'none' : '1px solid rgba(44,35,32,0.04)',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#faf6f3')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Date */}
                      <td style={{ padding: '16px 24px', fontSize: '14px', color: '#6b5d56' }}>
                        {item.date}
                      </td>

                      {/* Action */}
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: 700, color: '#2c2320' }}>
                        {item.action}
                      </td>

                      {/* Food */}
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#2c2320', fontWeight: 500 }}>
                        {item.food}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 24px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '999px',
                            background: statusCfg.bg,
                            color: statusCfg.color,
                            fontSize: '12px',
                            fontWeight: 700
                          }}
                        >
                          <span style={{ fontSize: '10px' }}>●</span>
                          <span>{statusCfg.label}</span>
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DonorLayout>
  );
};

export default DonorHistory;
