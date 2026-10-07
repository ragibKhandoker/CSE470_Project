import React, { useEffect, useState } from 'react';
import messageService from '../../services/messageService';

export const AdminMessageInbox = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;

    const loadMessages = () => messageService.getAdminInbox()
      .then((response) => {
        if (active) setMessages(response.data || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Could not load messages from the admin team.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    loadMessages();
    const refreshTimer = window.setInterval(loadMessages, 10000);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  const lastAdminMessage = [...messages].reverse().find((message) =>
    ['admin', 'super_admin'].includes((message.sender_role || '').toLowerCase())
  );

  const handleReply = async (event) => {
    event.preventDefault();
    if (!lastAdminMessage || !replyText.trim()) return;

    setSending(true);
    setReplyStatus('');
    try {
      await messageService.replyToAdmin({
        receiver_id: lastAdminMessage.sender_id,
        message_text: replyText.trim()
      });
      setReplyText('');
      setReplyStatus('Your reply has been sent.');
      const response = await messageService.getAdminInbox();
      setMessages(response.data || []);
    } catch (err) {
      setReplyStatus(err.response?.data?.message || 'Could not send your reply. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid rgba(44,35,32,0.08)', padding: '20px 24px', boxShadow: '0 4px 16px rgba(44,35,32,0.04)' }}>
      <h3 style={{ margin: '0 0 14px', fontSize: '17px', color: '#2c2320' }}>Conversation with Admin</h3>
      {loading ? (
        <p style={{ margin: 0, color: '#786d66', fontSize: '13px' }}>Loading messages...</p>
      ) : error ? (
        <p role="alert" style={{ margin: 0, color: '#b91c1c', fontSize: '13px' }}>{error}</p>
      ) : messages.length === 0 ? (
        <p style={{ margin: 0, color: '#786d66', fontSize: '13px' }}>You don't have any messages from the admin team yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {messages.map((message) => (
            <article key={message.id} style={{ borderRadius: '12px', border: `1px solid ${message.sender_role === 'donor' || message.sender_role === 'receiver' ? '#bfdbfe' : '#d1fae5'}`, background: message.sender_role === 'donor' || message.sender_role === 'receiver' ? '#eff6ff' : '#f0fdf4', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <strong style={{ color: message.sender_role === 'donor' || message.sender_role === 'receiver' ? '#1d4ed8' : '#047857', fontSize: '13px' }}>
                  {message.sender_role === 'donor' || message.sender_role === 'receiver' ? 'You' : (message.sender_name || 'ShareMeal Admin')}
                </strong>
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
      {!loading && !error && lastAdminMessage && (
        <form onSubmit={handleReply} style={{ display: 'grid', gap: '8px', marginTop: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <label htmlFor="admin-message-reply" style={{ fontSize: '13px', fontWeight: 700, color: '#2c2320' }}>Reply to the admin team</label>
          {replyStatus && (
            <p role="status" style={{ margin: 0, color: replyStatus.startsWith('Your reply') ? '#047857' : '#b91c1c', fontSize: '12px' }}>{replyStatus}</p>
          )}
          <textarea
            id="admin-message-reply"
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder="Write your reply..."
            maxLength={2000}
            rows={3}
            required
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#64748b', fontSize: '11px' }}>{replyText.length}/2000</span>
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              style={{ background: '#2563eb', color: '#ffffff', border: 0, borderRadius: '8px', padding: '9px 14px', fontSize: '12px', fontWeight: 700, cursor: sending ? 'wait' : 'pointer' }}
            >
              {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default AdminMessageInbox;
