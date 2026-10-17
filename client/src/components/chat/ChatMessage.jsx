import React from 'react';
import Avatar from '../common/Avatar';
import { formatTime } from '../../utils/formatters';

export default function ChatMessage({ message, isSelf }) {
  const senderName = message.senderName || message.sender?.name || message.sender?.email || 'Anonymous';
  const time = message.timestamp || message.createdAt;

  return (
    <div className="chat-message" style={{ flexDirection: isSelf ? 'row-reverse' : 'row' }}>
      <Avatar name={senderName} size="sm" />
      <div
        className="chat-message-content"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSelf ? 'flex-end' : 'flex-start',
        }}
      >
        <div className="chat-message-header" style={{ flexDirection: isSelf ? 'row-reverse' : 'row' }}>
          <span className="chat-sender-name">{isSelf ? 'You' : senderName}</span>
          <span className="chat-timestamp">{formatTime(time)}</span>
        </div>
        <div
          className="chat-text"
          style={{
            backgroundColor: isSelf ? 'rgba(88, 166, 255, 0.15)' : 'var(--bg-tertiary)',
            border: isSelf ? '1px solid rgba(88, 166, 255, 0.3)' : '1px solid var(--border-color)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
          }}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
