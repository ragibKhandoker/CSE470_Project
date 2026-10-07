import React, { useEffect, useState } from 'react';
import messageService from '../../services/messageService';

export const AdminMessageInbox = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    messageService.getAdminInbox()
      .then((response) => {
        if (active) setMessages(response.data || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load messages from the admin team.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(44,35,32,0.08)', padding: '20px 24px', boxShadow: '0 4px 16px rgba(44,35,32,0.04)' }}>
      <h3 style={{ margin: '0 0 14px', fontSize: '17px', color: '#2c2320' }}>Messages from Admin</h3>
      {loading ? (
        <p style={{ margin: 0, color: '#786d66', fontSize: '13px' }}>Loading messages...</p>
      ) : error ? (
        <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: '13px' }}>{error}</p>
      ) : messages.length === 0 ? (
        <p style={{ margin: 0, color: '#786d66', fontSize: '13px' }}>You don't have any messages from the admin team yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {messages.map((message) => (
            <article key={message.id} style={{ borderRadius: '12px', border: '1px solid #d1fae5', background: '#f0fdf4', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <strong style={{ color: '#047857', fontSize: '13px' }}>{message.sender_name || 'ShareMeal Admin'}</strong>
                <time dateTime={message.sent_at} style={{ color: '#786d66', fontSize: '12px' }}>
                  {new Date(message.sent_at).toLocaleString()}
                </time>
              </div>
              <p style={{ margin: 0, color: '#2c2320', fontSize: '14px', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {message.message_text}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default AdminMessageInbox;
