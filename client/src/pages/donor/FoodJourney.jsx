import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DonorLayout from '../../components/donor/DonorLayout';
import { API_BASE_URL } from '../../utils/constants';

// Sample Journey Items strictly matching Figma Node 8:24002
const FIGMA_JOURNEY_ITEMS = [
  {
    id: 'journey-1',
    title: 'Garden Salad Trays',
    quantity: 12,
    quantity_unit: 'meals',
    dateText: 'Aug 8, 2026',
    status: 'Collected by NGO',
    statusStage: 2, // 1: Posted, 2: Collected by NGO, 3: At NGO Point, 4: Received
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    ngoName: 'Robin Hood Army',
    location: 'Banani, Dhaka',
    timeline: [
      { step: 1, label: 'Posted', time: 'Aug 8, 2:15 PM', done: true },
      { step: 2, label: 'Collected by NGO', time: 'Aug 8, 3:40 PM by Robin Hood Army', done: true },
      { step: 3, label: 'At NGO Point', time: 'En route to distribution hub', done: false },
      { step: 4, label: 'Received', time: 'Awaiting beneficiary distribution', done: false }
    ]
  },
  {
    id: 'journey-2',
    title: 'Fresh Dinner Platters',
    quantity: 25,
    quantity_unit: 'meals',
    dateText: 'Aug 8, 2026',
    status: 'Available',
    statusStage: 1,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ngoName: null,
    location: 'Uttara, Dhaka',
    timeline: [
      { step: 1, label: 'Posted', time: 'Aug 8, 6:00 PM', done: true },
      { step: 2, label: 'Collected by NGO', time: 'Awaiting NGO pickup', done: false },
      { step: 3, label: 'At NGO Point', time: 'Pending collection', done: false },
      { step: 4, label: 'Received', time: 'Pending', done: false }
    ]
  },
  {
    id: 'journey-3',
    title: 'Grain Bowls & Greens',
    quantity: 8,
    quantity_unit: 'meals',
    dateText: 'Aug 7, 2026',
    status: 'At NGO Point',
    statusStage: 3,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    ngoName: 'Bidyanondo Foundation',
    location: 'Dhanmondi, Dhaka',
    timeline: [
      { step: 1, label: 'Posted', time: 'Aug 7, 11:30 AM', done: true },
      { step: 2, label: 'Collected by NGO', time: 'Aug 7, 1:00 PM', done: true },
      { step: 3, label: 'At NGO Point', time: 'Aug 7, 2:15 PM at Dhanmondi Hub', done: true },
      { step: 4, label: 'Received', time: 'Scheduled for evening distribution', done: false }
    ]
  },
  {
    id: 'journey-4',
    title: 'Surplus Produce Crate',
    quantity: 30,
    quantity_unit: 'kg',
    dateText: 'Aug 6, 2026',
    status: 'Taken',
    statusStage: 4,
    image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=800&q=80',
    ngoName: 'JAAGO Foundation',
    location: 'Gulshan 2, Dhaka',
    timeline: [
      { step: 1, label: 'Posted', time: 'Aug 6, 9:00 AM', done: true },
      { step: 2, label: 'Collected by NGO', time: 'Aug 6, 11:15 AM', done: true },
      { step: 3, label: 'At NGO Point', time: 'Aug 6, 1:00 PM', done: true },
      { step: 4, label: 'Received', time: 'Aug 6, 4:30 PM (Verified by 32 families)', done: true }
    ]
  },
  {
    id: 'journey-5',
    title: 'Bakery Assortment',
    quantity: 4,
    quantity_unit: 'kg',
    dateText: 'Aug 5, 2026',
    status: 'Expired',
    statusStage: 1,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    ngoName: null,
    location: 'Mirpur, Dhaka',
    timeline: [
      { step: 1, label: 'Posted', time: 'Aug 5, 4:00 PM', done: true },
      { step: 2, label: 'Collected by NGO', time: 'Not collected', done: false },
      { step: 3, label: 'At NGO Point', time: 'Expired', done: false },
      { step: 4, label: 'Received', time: 'Expired', done: false }
    ]
  }
];

// Status badge pill styling
const getStatusConfig = (status) => {
  const s = String(status || '').toLowerCase();
  if (s.includes('pickup requested') || s === 'pickup_requested') {
    return { bg: '#fffbeb', color: '#b45309', label: 'Pickup Requested' };
  }
  if (s.includes('approved')) {
    return { bg: '#ecfdf5', color: '#047857', label: 'Pickup Approved' };
  }
  if (s.includes('assigned')) {
    return { bg: '#eff6ff', color: '#1d4ed8', label: 'Staff Assigned' };
  }
  if (s.includes('collected by ngo') || s.includes('picked up') || s === 'collected' || s === 'picked_up') {
    return { bg: '#f5f3ff', color: '#6d28d9', label: 'Picked Up by NGO' };
  }
  if (s.includes('at hub') || s.includes('at ngo hub') || s === 'at_hub') {
    return { bg: '#fef3c7', color: '#92400e', label: 'At NGO Hub' };
  }
  if (s.includes('distributing')) {
    return { bg: '#fff7ed', color: '#c2410c', label: status || 'Distributing' };
  }
  if (s.includes('distributed') || s.includes('taken') || s.includes('completed') || s.includes('received')) {
    return { bg: '#eaf7ed', color: '#16a34a', label: 'Fully Distributed' };
  }
  if (s.includes('available') || s === 'pending') {
    return { bg: '#fef9ee', color: '#d97706', label: 'Available' };
  }
  if (s.includes('expired')) {
    return { bg: '#fdeee9', color: '#dc2626', label: 'Expired' };
  }
  return { bg: '#f3f4f6', color: '#4b5563', label: status || 'Active' };
};

export const FoodJourney = () => {
  const { user } = useAuth();
  const [journeys, setJourneys] = useState([]);
  const [openItems, setOpenItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealData = async () => {
      if (!user?.id) {
        setJourneys([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/food-posts?donor_id=${user.id}`);
        const data = await res.json();
        let apiJourneys = [];
        if (res.ok && data.foodPosts && data.foodPosts.length > 0) {
          // Strictly filter by current donor's user ID
          const myPosts = data.foodPosts.filter(
            (p) => Number(p.donor_id) === Number(user.id)
          );
          apiJourneys = myPosts.map((p) => {
            const s = String(p.status || 'available').toLowerCase();
            const ps = String(p.pickup_status || '').toLowerCase();

            let stage = 1;
            let displayStatus = 'Available';
            let stage2Time = 'Awaiting NGO pickup';
            let stage3Time = 'En route to distribution hub';
            let stage4Time = 'Pending beneficiary distribution';

            if (ps === 'pickup_requested') {
              stage = 1;
              displayStatus = 'Pickup Requested';
              stage2Time = `${p.ngo_organization_name || 'NGO'} requested pickup`;
            } else if (ps === 'approved') {
              stage = 1;
              displayStatus = 'Pickup Approved';
              stage2Time = 'Donor approved · awaiting staff assignment';
            } else if (ps === 'assigned') {
              stage = 2;
              displayStatus = 'Staff Assigned';
              stage2Time = `Assigned to ${p.assigned_staff_name || 'Staff'} for collection`;
            } else if (ps === 'picked_up' || s.includes('collected') || s === 'collected') {
              stage = 2;
              displayStatus = 'Picked Up by NGO';
              stage2Time = `Picked up by ${p.picked_up_staff_name || 'NGO Staff'}`;
              stage3Time = 'Transporting to NGO hub';
            } else if (ps === 'at_hub' || s.includes('point') || s === 'at_ngo_point') {
              stage = 3;
              displayStatus = 'At NGO Hub';
              stage2Time = `Picked up by ${p.picked_up_staff_name || 'NGO Staff'}`;
              stage3Time = `Inspected & verified at ${p.pickup_point_name || 'NGO Hub'}`;
            } else if (ps === 'distributing') {
              stage = 3;
              const rem = p.remaining_packets != null ? p.remaining_packets : (p.quantity || 0);
              const tot = p.total_packets || p.quantity || rem;
              displayStatus = `Distributing (${rem} left)`;
              stage2Time = `Picked up by ${p.picked_up_staff_name || 'NGO Staff'}`;
              stage3Time = `Distributing at ${p.pickup_point_name || 'Hub'} (${tot - rem} of ${tot} served)`;
            } else if (ps === 'distributed' || s.includes('taken') || s.includes('completed') || s === 'fulfilled') {
              stage = 4;
              displayStatus = 'Fully Distributed';
              stage2Time = `Picked up by ${p.picked_up_staff_name || 'NGO Staff'}`;
              stage3Time = `Verified at ${p.pickup_point_name || 'NGO Hub'}`;
              stage4Time = `All ${p.total_packets || p.quantity || ''} meals served to beneficiaries!`;
            }

            const cfg = getStatusConfig(displayStatus);
            return {
              id: `api-${p.id}`,
              title: p.food_name || p.title || (p.food_type ? `${p.food_type} Meal Donation` : 'Nutritious Meal'),
              quantity: p.quantity || 1,
              quantity_unit: p.quantity_unit || 'meals',
              dateText: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently',
              status: cfg.label,
              statusStage: stage,
              image: p.image_url ? (p.image_url.startsWith('http') ? p.image_url : `${API_BASE_URL.replace('/api', '')}${p.image_url}`) : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
              location: [p.area_ward, p.district].filter(Boolean).join(', ') || 'Dhaka',
              timeline: [
                { step: 1, label: 'Posted', time: 'Completed', done: stage >= 1 },
                { step: 2, label: 'Collected by NGO', time: stage2Time, done: stage >= 2 },
                { step: 3, label: 'At NGO Point', time: stage3Time, done: stage >= 3 },
                { step: 4, label: 'Received', time: stage4Time, done: stage >= 4 }
              ]
            };
          });
        }
        setJourneys(apiJourneys);
        // Default open the first journey item if available
        if (apiJourneys.length > 0) {
          setOpenItems({ [apiJourneys[0].id]: true });
        } else {
          setOpenItems({});
        }
      } catch (err) {
        console.error('Error loading food journeys:', err);
        setJourneys([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, [user]);

  const toggleItem = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const stepsList = [
    { stepNum: 1, label: 'Posted' },
    { stepNum: 2, label: 'Collected by NGO' },
    { stepNum: 3, label: 'At NGO Point' },
    { stepNum: 4, label: 'Received' }
  ];

  return (
    <DonorLayout title="Food Journey">
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#786d66', background: '#fff', borderRadius: '18px', border: '1px solid rgba(44,35,32,0.06)' }}>
            Loading your food journeys...
          </div>
        ) : journeys.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              background: '#fff',
              borderRadius: '18px',
              border: '1px solid rgba(44,35,32,0.06)',
              boxShadow: '0 4px 20px rgba(44,35,32,0.04)'
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '14px' }}>🚚</div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
              No food journeys found
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#786d66', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              You haven't posted any food donations yet. When you post a donation, its full lifecycle from pickup to beneficiary handover will be tracked live here.
            </p>
          </div>
        ) : (
          /* Accordion Journey Cards List (Figma Node 8:24002) */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {journeys.map((item) => {
            const isOpen = Boolean(openItems[item.id]);
            const statusCfg = getStatusConfig(item.status);
            const currentStage = item.statusStage || 1;

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: '1px solid rgba(44,35,32,0.06)',
                  boxShadow: isOpen ? '0 8px 30px rgba(44,35,32,0.06)' : '0 2px 10px rgba(44,35,32,0.03)',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Collapsible Card Header Row */}
                <div
                  onClick={() => toggleItem(item.id)}
                  style={{
                    padding: '18px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    gap: 16
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
                    {/* Thumbnail Image */}
                    <img
                      src={item.image}
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                      }}
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        flexShrink: 0
                      }}
                    />

                    {/* Titles */}
                    <div style={{ minWidth: 0 }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '17px',
                          fontWeight: 700,
                          color: '#2c2320',
                          fontFamily: "'Fraunces', serif",
                          lineHeight: '22px'
                        }}
                      >
                        {item.title}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b5d56' }}>
                        {item.quantity} {item.quantity_unit} · {item.dateText}
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Status Badge + Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
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

                    {/* Chevron Indicator */}
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b5d56',
                        fontSize: '14px',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      ▼
                    </div>
                  </div>
                </div>

                {/* Expanded Section: 4-Step Stepper Timeline (Figma Node 8:24002) */}
                {isOpen && (
                  <div
                    style={{
                      padding: '16px 36px 36px 36px',
                      borderTop: '1px solid rgba(44,35,32,0.05)',
                      background: '#fffdfb'
                    }}
                  >
                    {/* Stepper Container */}
                    <div
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        marginTop: '20px'
                      }}
                    >
                      {/* Background Connecting Bar across steps */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '16px',
                          left: '40px',
                          right: '40px',
                          height: '2px',
                          background: '#e8e2dd',
                          zIndex: 1
                        }}
                      />

                      {/* Active Progress Colored Bar */}
                      <div
                        style={{
                          position: 'absolute',
                          top: '16px',
                          left: '40px',
                          width:
                            currentStage === 1
                              ? '0%'
                              : currentStage === 2
                              ? '33%'
                              : currentStage === 3
                              ? '66%'
                              : 'calc(100% - 80px)',
                          height: '2px',
                          background: '#2563eb',
                          zIndex: 2,
                          transition: 'width 0.3s ease'
                        }}
                      />

                      {/* 4 Steps */}
                      {stepsList.map((st) => {
                        const isDone = currentStage >= st.stepNum;
                        return (
                          <div
                            key={st.stepNum}
                            style={{
                              position: 'relative',
                              zIndex: 3,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              width: '120px'
                            }}
                          >
                            {/* Circle Node */}
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isDone ? '#2563eb' : '#f4eee9',
                                color: isDone ? '#ffffff' : '#8c7e77',
                                border: isDone ? 'none' : '1.5px solid #d8cfc9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '13px',
                                fontWeight: 700,
                                boxShadow: isDone ? '0 4px 12px rgba(37, 99, 235, 0.35)' : 'none',
                                marginBottom: '10px'
                              }}
                            >
                              {isDone ? '✓' : st.stepNum}
                            </div>

                            {/* Label */}
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: isDone ? 700 : 500,
                                color: isDone ? '#2c2320' : '#8c7e77',
                                textAlign: 'center',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      </div>
    </DonorLayout>
  );
};

export default FoodJourney;
