import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DonorLayout from '../../components/donor/DonorLayout';
import { notificationService } from '../../services/notificationService';

// Seed Notifications strictly matching Figma Node 8:24610
const FIGMA_SEED_NOTIFICATIONS = [
  {
    id: 'notif-1',
    group: 'TODAY',
    type: 'ngo_collection',
    iconType: 'bicycle',
    title: 'Robin Hood Army collected your "Garden Salad Trays" donation.',
    time: '12 min ago',
    unread: true
  },
  {
    id: 'notif-2',
    group: 'TODAY',
    type: 'rating',
    iconType: 'star',
    title: 'You received a 5-star rating for "Surplus Produce Crate."',
    time: '2 hr ago',
    unread: true
  },
  {
    id: 'notif-3',
    group: 'TODAY',
    type: 'expiry_reminder',
    iconType: 'clock',
    title: 'Reminder: "Fresh Dinner Platters" expires in 40 minutes.',
    time: '4 hr ago',
    unread: false
  },
  {
    id: 'notif-4',
    group: 'EARLIER',
    type: 'received',
    iconType: 'check',
    title: '"Grain Bowls & Greens" was successfully received by a community member.',
    time: 'Yesterday',
    unread: false
  },
  {
    id: 'notif-5',
    group: 'EARLIER',
    type: 'rating',
    iconType: 'star',
    title: 'You received a 4-star rating for "Fresh Dinner Platters."',
    time: 'Yesterday',
    unread: false
  }
];

export const DonorNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(FIGMA_SEED_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await notificationService.getMyNotifications();
        if (res && res.data && res.data.length > 0) {
          const apiNotifs = res.data.map((n) => ({
            id: `api-${n.id}`,
            group: 'TODAY',
            type: 'system',
            iconType: 'check',
            title: n.message || n.title || 'System update',
            time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently',
            unread: !n.is_read
          }));
          setNotifications([...apiNotifs, ...FIGMA_SEED_NOTIFICATIONS]);
        }
      } catch (err) {
        // Fallback gracefully to Figma seed notifications
        setNotifications(FIGMA_SEED_NOTIFICATIONS);
      }
    };

    loadNotifications();
  }, [user]);

  const markSingleRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
    try {
      if (String(id).startsWith('api-')) {
        const rawId = id.replace('api-', '');
        await notificationService.markAsRead(rawId);
      }
    } catch (err) {
      console.warn('Failed to sync mark-read with backend:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  const todayList = notifications.filter((n) => n.group === 'TODAY');
  const earlierList = notifications.filter((n) => n.group === 'EARLIER');

  // Renders matching circular icons
  const renderIcon = (type) => {
    if (type === 'bicycle') {
      return (
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#ebf3fe',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}
        >
          🚲
        </div>
      );
    }
    if (type === 'star') {
      return (
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#fef9ee',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}
        >
          ⭐
        </div>
      );
    }
    if (type === 'clock') {
      return (
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: '#eaf7ed',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}
        >
          🕒
        </div>
      );
    }
    // Check/default
    return (
      <div
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: '#eaf7ed',
          color: '#16a34a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          flexShrink: 0
        }}
      >
        ✓
      </div>
    );
  };

  return (
    <DonorLayout title="Notifications">
      <div style={{ maxWidth: '980px', width: '100%', margin: '0 auto' }}>
        {/* Top Control Bar (Figma Node 8:24610) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          }}
        >
          {/* Unread count */}
          <span style={{ fontSize: '14px', color: '#6b5d56', fontWeight: 600 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </span>

          {/* Mark all read button */}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                background: 'transparent',
                border: 0,
                color: '#ff6b4a',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0
              }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications Panel Card */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid rgba(44,35,32,0.06)',
            boxShadow: '0 6px 24px rgba(44,35,32,0.04)',
            overflow: 'hidden'
          }}
        >
          {/* TODAY SECTION */}
          {todayList.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#8c7e77',
                  padding: '20px 24px 8px 24px'
                }}
              >
                TODAY
              </div>
              <div>
                {todayList.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      padding: '16px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                      background: item.unread ? '#fffaf8' : '#ffffff',
                      borderBottom: '1px solid rgba(44,35,32,0.04)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {renderIcon(item.iconType)}
                      <div>
                        <div
                          style={{
                            fontSize: '14.5px',
                            color: '#2c2320',
                            fontWeight: item.unread ? 600 : 500,
                            lineHeight: '20px'
                          }}
                        >
                          {item.title}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#8c7e77', marginTop: '3px' }}>
                          {item.time}
                        </div>
                      </div>
                    </div>

                    {item.unread && (
                      <button
                        onClick={() => markSingleRead(item.id)}
                        style={{
                          background: 'transparent',
                          border: 0,
                          color: '#ff6b4a',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#fff0eb')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EARLIER SECTION */}
          {earlierList.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: '#8c7e77',
                  padding: '24px 24px 8px 24px'
                }}
              >
                EARLIER
              </div>
              <div>
                {earlierList.map((item, idx) => {
                  const isLast = idx === earlierList.length - 1;
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '16px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16,
                        background: item.unread ? '#fffaf8' : '#ffffff',
                        borderBottom: isLast ? 'none' : '1px solid rgba(44,35,32,0.04)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {renderIcon(item.iconType)}
                        <div>
                          <div
                            style={{
                              fontSize: '14.5px',
                              color: '#2c2320',
                              fontWeight: item.unread ? 600 : 500,
                              lineHeight: '20px'
                            }}
                          >
                            {item.title}
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#8c7e77', marginTop: '3px' }}>
                            {item.time}
                          </div>
                        </div>
                      </div>

                      {item.unread && (
                        <button
                          onClick={() => markSingleRead(item.id)}
                          style={{
                            background: 'transparent',
                            border: 0,
                            color: '#ff6b4a',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#fff0eb')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DonorLayout>
  );
};

export default DonorNotifications;
