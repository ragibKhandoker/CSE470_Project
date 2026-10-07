import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import receiverAssistantService from '../../services/receiverAssistantService';

const roleSettings = {
  receiver: {
    title: 'Receiver Help Assistant',
    greeting: 'Hello! I am ShareMeal’s AI Help Assistant. How can I help you?',
    suggestions: ['How do I request food?', 'How to verify my NID?', 'Where is my pickup code?'],
    contactPath: '/receiver/notifications'
  },
  donor: {
    title: 'Donor Help Assistant',
    greeting: 'Hello! I am ShareMeal’s AI Help Assistant. How can I help you?',
    suggestions: ['How do I post a donation?', 'How do I manage collection requests?', 'How does verification work?'],
    contactPath: '/donor/notifications'
  },
  ngo: {
    title: 'NGO Help Assistant',
    greeting: 'Hello! I am ShareMeal’s AI Help Assistant. How can I help you?',
    suggestions: ['How do I manage incoming donations?', 'How do I handle receiver requests?', 'Where are serving logs?'],
    contactPath: '/ngo/profile'
  },
  admin: {
    title: 'Admin Help Assistant',
    greeting: 'Hello! I am ShareMeal’s AI Help Assistant. How can I help you?',
    suggestions: ['How do I verify a user?', 'How do I message a user?', 'Where are reports and alerts?'],
    contactPath: '/admin/users'
  }
};

export const ShareMealHelpChatbot = ({ role = 'receiver' }) => {
  const navigate = useNavigate();
  const settings = roleSettings[role] || roleSettings.receiver;
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'assistant', text: settings.greeting }
  ]);
  const [isResponding, setIsResponding] = useState(false);
  const conversationRef = useRef(null);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const askQuestion = async (value) => {
    const trimmedQuestion = value.trim();
    if (!trimmedQuestion || isResponding) return;

    const userMessage = { id: Date.now(), sender: 'user', text: trimmedQuestion };
    const assistantMessageId = userMessage.id + 1;
    const nextMessages = [...messages, userMessage];
    setQuestion('');
    setMessages([...nextMessages, { id: assistantMessageId, sender: 'assistant', text: '' }]);
    setIsResponding(true);

    const context = nextMessages
      .slice(-6)
      .map((message) => ({
        role: message.sender === 'assistant' ? 'model' : 'user',
        text: message.text
      }));
    while (context[0]?.role === 'model') {
      context.shift();
    }

    try {
      await receiverAssistantService.ask(context, (_chunk, answer) => {
        setMessages((currentMessages) => currentMessages.map((message) => (
          message.id === assistantMessageId ? { ...message, text: answer } : message
        )));
      });
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages.filter((message) => message.id !== assistantMessageId),
        {
          id: assistantMessageId,
          sender: 'assistant',
          text: error instanceof Error
            ? error.message
            : 'The AI assistant could not answer right now. Please try again or contact support.',
          action: {
            label: role === 'admin' ? 'Open Users' : role === 'receiver' ? 'Contact Admin' : 'Open Notifications',
            path: settings.contactPath
          }
        }
      ]);
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 1500, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {isOpen && (
        <section
          aria-label={`ShareMeal ${settings.title}`}
          style={{ width: 'min(360px, calc(100vw - 32px))', height: 'min(540px, calc(100vh - 110px))', marginBottom: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '18px', boxShadow: '0 16px 48px rgba(15, 23, 42, 0.2)' }}
        >
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', color: '#ffffff', background: 'linear-gradient(135deg, #2563eb, #0f766e)' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '14px' }}>ShareMeal {settings.title}</strong>
              <span style={{ fontSize: '11px', opacity: 0.88 }}>Powered by Gemini</span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close assistant" style={{ border: 0, background: 'transparent', color: '#ffffff', fontSize: '22px', cursor: 'pointer' }}>×</button>
          </header>

          <div ref={conversationRef} aria-live="polite" style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc' }}>
            {messages.map((message) => (
              <div key={message.id} style={{ alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                <p style={{ margin: 0, padding: '10px 12px', borderRadius: '13px', background: message.sender === 'user' ? '#2563eb' : '#ffffff', border: message.sender === 'assistant' ? '1px solid #e5e7eb' : 0, color: message.sender === 'user' ? '#ffffff' : '#1f2937', fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {message.text}
                </p>
                {message.action && (
                  <button type="button" onClick={() => navigate(message.action.path)} style={{ marginTop: '6px', border: 0, background: 'transparent', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '2px 4px' }}>
                    {message.action.label} →
                  </button>
                )}
              </div>
            ))}
            {isResponding && <span style={{ color: '#64748b', fontSize: '12px' }}>Gemini is preparing an answer...</span>}
          </div>

          <div style={{ padding: '10px 12px 0', display: 'flex', gap: '6px', overflowX: 'auto', background: '#ffffff' }}>
            {settings.suggestions.map((prompt) => (
              <button key={prompt} type="button" onClick={() => askQuestion(prompt)} disabled={isResponding} style={{ flexShrink: 0, border: '1px solid #dbeafe', borderRadius: '999px', padding: '6px 9px', background: '#eff6ff', color: '#1d4ed8', fontSize: '10px', cursor: isResponding ? 'not-allowed' : 'pointer' }}>
                {prompt}
              </button>
            ))}
          </div>

          <p style={{ margin: 0, padding: '8px 12px 0', background: '#ffffff', color: '#64748b', fontSize: '10px', lineHeight: 1.4 }}>
            Your question is sent to Gemini. AI can make mistakes. Do not share your NID, password, phone number, or email.
          </p>
          <form onSubmit={(event) => { event.preventDefault(); askQuestion(question); }} style={{ display: 'flex', gap: '8px', padding: '8px 12px 12px', background: '#ffffff' }}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={500}
              placeholder="Ask for help..."
              aria-label="Ask the ShareMeal AI Help Assistant"
              style={{ minWidth: 0, flex: 1, border: '1px solid #d1d5db', borderRadius: '10px', padding: '10px 11px', fontSize: '13px', outlineColor: '#2563eb' }}
            />
            <button type="submit" disabled={isResponding || !question.trim()} style={{ border: 0, borderRadius: '10px', padding: '0 13px', background: isResponding || !question.trim() ? '#94a3b8' : '#2563eb', color: '#ffffff', fontWeight: 700, cursor: isResponding || !question.trim() ? 'not-allowed' : 'pointer' }}>
              Send
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close help assistant' : 'Open help assistant'}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginLeft: 'auto', border: 0, borderRadius: '999px', padding: '12px 18px', background: 'linear-gradient(135deg, #2563eb, #0f766e)', color: '#ffffff', fontSize: '13px', fontWeight: 700, boxShadow: '0 8px 22px rgba(37, 99, 235, 0.35)', cursor: 'pointer' }}
      >
        <span aria-hidden="true">✦</span>
        {isOpen ? 'Close Help' : 'Ask for Help'}
      </button>
    </div>
  );
};

export default ShareMealHelpChatbot;
