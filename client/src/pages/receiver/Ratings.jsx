import React, { useState, useEffect } from 'react';
import ReceiverLayout from '../../components/receiver/ReceiverLayout';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../utils/constants';

export const ReceiverRatings = () => {
  const { token } = useAuth();

  const [activeTab, setActiveTab] = useState('ngos'); // 'ngos' | 'donors'
  const [ratings, setRatings] = useState({ ngos: [], donors: [] });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [targets, setTargets] = useState({ ngos: [], receivedFoods: [] });

  const [newRating, setNewRating] = useState({
    targetType: 'ngo',
    selectedRequestId: '',
    targetUserId: '',
    food_name: '',
    food_post_id: null,
    score: 5,
    comment: '',
    foodItem: 'Hot Meal Pack'
  });

  useEffect(() => {
    fetchRatingsFromDB();
    fetchPotentialTargets();
  }, [token]);

  // Fetch ratings submitted by user from DB
  const fetchRatingsFromDB = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ratings/my-ratings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.data) {
          const ngos = [];
          const donors = [];

          data.data.forEach((r) => {
            const item = {
              id: r.id,
              targetName: r.target_name || 'Community Organization',
              foodName: r.food_name || null,
              date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent',
              stars: r.score || 5,
              comment: r.comment,
              foodItem: r.food_name || 'Meal Donation'
            };

            if ((r.target_role || '').toLowerCase() === 'ngo') {
              ngos.push(item);
            } else {
              donors.push(item);
            }
          });

          setRatings({ ngos, donors });
        }
      }
    } catch (err) {
      console.error('Error fetching ratings from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch verified NGOs and foods requested & received by this receiver
  const fetchPotentialTargets = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ratings/targets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.data) {
          const ngosList = data.data.ngos || [];
          const receivedList = data.data.receivedFoods || [];
          setTargets({ ngos: ngosList, receivedFoods: receivedList });

          if (activeTab === 'donors') {
            const firstFood = receivedList[0];
            if (firstFood) {
              setNewRating((prev) => ({
                ...prev,
                targetType: 'donor',
                selectedRequestId: firstFood.request_id,
                targetUserId: firstFood.donor_id,
                food_name: firstFood.food_name,
                food_post_id: firstFood.food_post_id
              }));
            }
          } else {
            if (ngosList.length > 0) {
              setNewRating((prev) => ({
                ...prev,
                targetType: 'ngo',
                targetUserId: ngosList[0].id,
                food_name: '',
                food_post_id: null
              }));
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching rating targets:', err);
    }
  };

  const handleOpenModal = () => {
    const isNgo = activeTab === 'ngos';
    if (isNgo) {
      setNewRating({
        targetType: 'ngo',
        selectedRequestId: '',
        targetUserId: targets.ngos[0]?.id || '',
        food_name: '',
        food_post_id: null,
        score: 5,
        comment: '',
        foodItem: 'Hot Meal Pack'
      });
    } else {
      const firstFood = targets.receivedFoods[0];
      setNewRating({
        targetType: 'donor',
        selectedRequestId: firstFood?.request_id || '',
        targetUserId: firstFood?.donor_id || '',
        food_name: firstFood?.food_name || '',
        food_post_id: firstFood?.food_post_id || null,
        score: 5,
        comment: '',
        foodItem: firstFood?.food_name || 'Hot Meal Pack'
      });
    }
    setShowModal(true);
  };

  const renderStars = (count) => {
    return (
      <div style={{ display: 'flex', gap: '4px', color: '#f59e0b', fontSize: '16px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} style={{ opacity: star <= count ? 1 : 0.25 }}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const handleAddRating = async (e) => {
    e.preventDefault();
    if (!token) {
      alert('Please log in to submit a rating.');
      return;
    }

    let targetId = newRating.targetUserId;
    let foodName = newRating.food_name;
    let foodPostId = newRating.food_post_id;

    if (newRating.targetType === 'donor') {
      const chosen = targets.receivedFoods.find(
        (rf) => rf.request_id === Number(newRating.selectedRequestId)
      ) || targets.receivedFoods[0];

      if (!chosen) {
        alert('You do not have any completed food requests to rate.');
        return;
      }
      targetId = chosen.donor_id;
      foodName = chosen.food_name;
      foodPostId = chosen.food_post_id;
    } else {
      if (!targetId && targets.ngos.length > 0) {
        targetId = targets.ngos[0].id;
      }
    }

    if (!targetId) {
      alert(`Please select a valid ${newRating.targetType === 'ngo' ? 'NGO' : 'Received Meal & Donor'} to rate.`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          target_user_id: targetId,
          score: newRating.score,
          comment: newRating.comment,
          food_name: foodName,
          food_post_id: foodPostId
        })
      });
      if (res.ok) {
        setShowModal(false);
        setActiveTab(newRating.targetType === 'ngo' ? 'ngos' : 'donors');
        await fetchRatingsFromDB();
      } else {
        const d = await res.json();
        alert(d.message || 'Error submitting rating');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting rating');
    }
  };

  const activeList = activeTab === 'ngos' ? ratings.ngos : ratings.donors;

  return (
    <ReceiverLayout title="Ratings">
      <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div
            style={{
              display: 'inline-flex',
              background: '#e9e3df',
              borderRadius: '24px',
              padding: '4px',
              width: 'fit-content'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('ngos')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'ngos' ? '#ffffff' : 'transparent',
                color: activeTab === 'ngos' ? '#2c2320' : '#6b5d56',
                fontSize: '14px',
                fontWeight: activeTab === 'ngos' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: activeTab === 'ngos' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Ratings for NGOs ({ratings.ngos.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('donors')}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeTab === 'donors' ? '#ffffff' : 'transparent',
                color: activeTab === 'donors' ? '#2c2320' : '#6b5d56',
                fontSize: '14px',
                fontWeight: activeTab === 'donors' ? 700 : 500,
                cursor: 'pointer',
                boxShadow: activeTab === 'donors' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Ratings for Donors ({ratings.donors.length})
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              padding: '9px 20px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)'
            }}
          >
            + Leave a Rating
          </button>
        </div>

        {/* Ratings Card Container from DB */}
        {loading ? (
          <div style={{ background: '#ffffff', borderRadius: '20px', padding: '40px', textAlign: 'center', color: '#888' }}>
            Loading ratings from database...
          </div>
        ) : activeList.length === 0 ? (
          /* Empty state if no ratings in DB */
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
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⭐</div>
            <h4 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#2c2320' }}>
              No ratings submitted yet.
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#786d66' }}>
              Rate an NGO distribution center or food donor in Bangladesh after collecting your meal to help our community.
            </p>
            <button
              type="button"
              onClick={handleOpenModal}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '20px',
                padding: '9px 22px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Leave a Rating
            </button>
          </div>
        ) : (
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 4px 20px rgba(44, 35, 32, 0.04)',
              border: '1px solid rgba(44, 35, 32, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            {activeList.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  paddingBottom: idx < activeList.length - 1 ? '20px' : '0',
                  borderBottom: idx < activeList.length - 1 ? '1px solid rgba(44, 35, 32, 0.06)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#2c2320' }}>
                      {item.foodName ? item.foodName : item.targetName}
                    </h4>
                    {item.foodName ? (
                      <div style={{ fontSize: '12px', color: '#786d66', marginTop: '2px' }}>
                        Donated by <strong>{item.targetName}</strong>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#786d66', marginTop: '2px' }}>
                        NGO Partner
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '13px', color: '#786d66' }}>
                    {item.date}
                  </span>
                </div>

                {renderStars(item.stars)}

                {item.comment && (
                  <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b5d56', lineHeight: '20px' }}>
                    {item.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Leave Rating Modal */}
      {showModal && (
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
          onClick={() => setShowModal(false)}
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
                Leave a Rating
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}
              >
                ✕
              </button>
            </div>

            {/* Target Type Switcher: NGO vs Received Meal & Donor */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => {
                  setNewRating({
                    ...newRating,
                    targetType: 'ngo',
                    selectedRequestId: '',
                    targetUserId: targets.ngos[0]?.id || '',
                    food_name: '',
                    food_post_id: null
                  });
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: newRating.targetType === 'ngo' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  background: newRating.targetType === 'ngo' ? '#fff5f2' : '#ffffff',
                  color: newRating.targetType === 'ngo' ? '#2563eb' : '#6b5d56',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🏢 Rate NGO
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstFood = targets.receivedFoods[0];
                  setNewRating({
                    ...newRating,
                    targetType: 'donor',
                    selectedRequestId: firstFood?.request_id || '',
                    targetUserId: firstFood?.donor_id || '',
                    food_name: firstFood?.food_name || '',
                    food_post_id: firstFood?.food_post_id || null
                  });
                }}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: newRating.targetType === 'donor' ? '2px solid #2563eb' : '1px solid #e5e7eb',
                  background: newRating.targetType === 'donor' ? '#fff5f2' : '#ffffff',
                  color: newRating.targetType === 'donor' ? '#2563eb' : '#6b5d56',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                🍛 Rate Received Food
              </button>
            </div>

            <form onSubmit={handleAddRating}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                  {newRating.targetType === 'ngo'
                    ? 'Select NGO Organization'
                    : 'Select Received Food (Food & Donor)'}
                </label>

                {newRating.targetType === 'ngo' ? (
                  targets.ngos.length > 0 ? (
                    <select
                      value={newRating.targetUserId}
                      onChange={(e) => setNewRating({ ...newRating, targetUserId: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', background: '#ffffff' }}
                      required
                    >
                      {targets.ngos.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <option value="">No NGOs available</option>
                  )
                ) : targets.receivedFoods.length > 0 ? (
                  <select
                    value={newRating.selectedRequestId || targets.receivedFoods[0]?.request_id}
                    onChange={(e) => {
                      const reqId = Number(e.target.value);
                      const chosen = targets.receivedFoods.find((rf) => rf.request_id === reqId);
                      if (chosen) {
                        setNewRating({
                          ...newRating,
                          selectedRequestId: chosen.request_id,
                          targetUserId: chosen.donor_id,
                          food_name: chosen.food_name,
                          food_post_id: chosen.food_post_id
                        });
                      }
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', outline: 'none', background: '#ffffff' }}
                    required
                  >
                    {targets.receivedFoods.map((rf) => (
                      <option key={rf.request_id} value={rf.request_id}>
                        {rf.food_name} — {rf.donor_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', color: '#92400e', fontSize: '13px', lineHeight: '1.4' }}>
                    ℹ️ You have not requested or received any completed meals yet. Once your food pickup is completed, you can rate the food and donor here.
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                  Score: {newRating.score} Stars
                </label>
                <div style={{ display: 'flex', gap: '8px', fontSize: '24px', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      onClick={() => setNewRating({ ...newRating, score: s })}
                      style={{ color: s <= newRating.score ? '#f59e0b' : '#d1d5db' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#2c2320', marginBottom: '6px' }}>
                  Your Feedback
                </label>
                <textarea
                  rows={3}
                  value={newRating.comment}
                  onChange={(e) => setNewRating({ ...newRating, comment: e.target.value })}
                  placeholder="Share details of food packaging, quality, and pickup experience in Bangladesh..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={newRating.targetType === 'donor' && targets.receivedFoods.length === 0}
                style={{
                  width: '100%',
                  background: (newRating.targetType === 'donor' && targets.receivedFoods.length === 0) ? '#d1d5db' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: (newRating.targetType === 'donor' && targets.receivedFoods.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                Submit Rating
              </button>
            </form>
          </div>
        </div>
      )}
    </ReceiverLayout>
  );
};

export default ReceiverRatings;
