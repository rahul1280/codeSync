import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { MessageSquare, X } from 'lucide-react';

export default function ChatPanel({
  messages = [],
  onSendMessage,
  currentUser,
  onClose,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} color="var(--accent-primary)" />
          <span>Room Chat</span>
          <span
            style={{
              fontSize: '0.75rem',
              backgroundColor: 'var(--bg-tertiary)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-muted)',
            }}
          >
            {messages.length}
          </span>
        </div>
        {onClose && (
          <button
            className="btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            <p>No messages yet.</p>
            <p style={{ marginTop: '4px' }}>Say hello to your collaborators!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const myId = (currentUser?._id || currentUser?.id || '').toString();
            const senderId = (msg.senderId || msg.sender?._id || msg.sender?.id || '').toString();
            const isSelf = Boolean(myId && senderId && myId === senderId);
            return (
              <ChatMessage
                key={msg._id || msg.id || index}
                message={msg}
                isSelf={Boolean(isSelf)}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={onSendMessage} />
    </div>
  );
}
