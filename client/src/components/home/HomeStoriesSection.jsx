import React from 'react';
import { Link } from 'react-router-dom';

export const HomeStoriesSection = ({ stories = [], loading = false }) => {
  return (
    <section id="stories" style={{ padding: '0 24px 90px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1d4ed8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px' }}>
              <span style={{ width: '24px', height: '2px', background: '#1d4ed8' }}></span> FROM THE FIELD
            </div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(30px, 4vw, 40px)', fontWeight: 800, color: '#2c2320', margin: 0 }}>
              Latest stories
            </h2>
          </div>
          <Link to="/stories" style={{ textDecoration: 'none', color: '#2563eb', fontSize: '14px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            View all stories <span>→</span>
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '24px' }}>
            <div style={{ fontSize: '15px', color: '#6b5d56', fontWeight: 600 }}>
              Loading stories from database...
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
            {stories.map((story) => (
              <Link
                key={story.id}
                to={`/stories/${story.slug || story.id}`}
                className="story-card"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  background: '#ffffff',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: '1px solid rgba(44, 35, 32, 0.06)',
                  boxShadow: '0 8px 24px rgba(44, 35, 32, 0.04)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div className="story-img-wrapper" style={{ height: '210px', width: '100%', overflow: 'hidden' }}>
                    <img
                      src={story.image}
                      alt={story.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                  </div>
                  <div style={{ padding: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ background: story.tagBg, color: story.tagColor, padding: '3px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: 800 }}>
                        {story.tag}
                      </span>
                      <span style={{ fontSize: '12px', color: '#888' }}>
                        🕒 {story.readTime}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 800, color: '#2c2320', lineHeight: 1.4, margin: '0 0 12px' }}>
                      {story.title}
                    </h3>
                  </div>
                </div>
                <div style={{ padding: '0 22px 22px' }}>
                  <span className="story-link" style={{ color: '#2563eb', fontSize: '13px', fontWeight: 700 }}>
                    Read story →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default HomeStoriesSection;
