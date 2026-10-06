import React from 'react';
import DonorLayout from '../../components/donor/DonorLayout';
import { useAuth } from '../../context/AuthContext';
import '../../App.css';

export const Ratings = () => {
  const { user } = useAuth();

  const reviews = [
    {
      id: 1,
      reviewer: 'Care Bangladesh NGO',
      role: 'Verified NGO Partner',
      rating: 5,
      date: 'Yesterday',
      comment: 'Food was extremely fresh, well-packaged, and handed over on time. Fed 45 people in Dhanmondi shelter!'
    },
    {
      id: 2,
      reviewer: 'Ekmatra Society',
      role: 'Verified NGO Partner',
      rating: 5,
      date: '3 days ago',
      comment: 'Excellent donation quality. The donor was very communicative and helpful during pickup.'
    },
    {
      id: 3,
      reviewer: 'Local Community Shelter',
      role: 'Food Receiver',
      rating: 4.5,
      date: '1 week ago',
      comment: 'High quality meals. Thank you for making a real impact in our community!'
    }
  ];

  return (
    <DonorLayout title="Ratings">
      <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto' }}>
        {/* Rating Overview Card */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(44,35,32,0.04)', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#6b5d56', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Overall Community Rating
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <span style={{ fontSize: '36px', fontWeight: 800, color: '#2c2320' }}>4.8</span>
              <div>
                <div style={{ fontSize: '18px', color: '#e39a1c' }}>★★★★★</div>
                <span style={{ fontSize: '13px', color: '#6b5d56' }}>Based on 31 verified reviews</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '10px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
            🏅 Top Community Donor Badge Active
          </div>
        </div>

        {/* Reviews List */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 16px rgba(44,35,32,0.04)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#2c2320', borderBottom: '1px solid #f3ece8', paddingBottom: '12px' }}>
            Verified Community Feedback
          </h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            {reviews.map((r) => (
              <div key={r.id} style={{ background: '#fcf8f6', border: '1px solid #f3ece8', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#2c2320' }}>{r.reviewer}</strong>
                    <span style={{ fontSize: '12px', color: '#059669', marginLeft: 8, fontWeight: 600 }}>• {r.role}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#e39a1c', fontWeight: 700, fontSize: '14px' }}>{r.rating} ★</span>
                    <div style={{ fontSize: '11px', color: '#888' }}>{r.date}</div>
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b5d56', lineHeight: '20px' }}>"{r.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DonorLayout>
  );
};

export default Ratings;
