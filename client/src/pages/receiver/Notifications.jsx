import React, { useState, useEffect } from 'react';
import ReceiverLayout from '../../components/receiver/ReceiverLayout';
import AdminMessageInbox from '../../components/common/AdminMessageInbox';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';

export const ReceiverNotifications = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificationsFromDB();
  }, [token]);

  // Fetch notifications purely from DB
  const fetchNotificationsFromDB = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.notifications) {
          setNotifications(data.notifications);
        } else {
          setNotifications([]);
        }
      }
    } catch (err) {
      console.error('Error fetching notifications from DB:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Mark all in local state & send reads
      notifications.forEach((n) => {
        if (!n.is_read) {
          fetch(`${API_BASE_URL}/notifications/${n.id}/read`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ReceiverLayout title="Notifications">
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <AdminMessageInbox />
        
        {/* Top Header Row matching Figma 8:32670 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
          <span style={{ fontSize: '14px', color: '#6b5d56', fontWeight: 500 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </span>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--brand-primary)',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications Container from DB */}
        {loading ? (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#888' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          /* Empty state if no notifications in DB */
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
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔔</div>
            <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
              No notifications yet.
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#786d66' }}>
              Status updates on your meal requests and pickup alerts in Bangladesh will appear here.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
              border: '1px solid rgba(44, 35, 32, 0.06)'
            }}
          >
            {notifications.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '20px 24px',
                  borderBottom: idx < notifications.length - 1 ? '1px solid rgba(44, 35, 32, 0.06)' : 'none',
                  background: !item.is_read ? '#fffaf8' : '#ffffff',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: '#d1fae5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '15px',
                      fontWeight: 800,
                      flexShrink: 0
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: !item.is_read ? 700 : 500, color: '#2c2320', marginBottom: '2px' }}>
                      {item.message || item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#786d66' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                </div>

                {!item.is_read && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(item.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--brand-primary)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </ReceiverLayout>
  );
};

export default ReceiverNotifications;
