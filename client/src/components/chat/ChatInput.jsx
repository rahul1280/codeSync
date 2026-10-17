import React, { useState } from 'react';
import { Send } from 'lucide-react';
import Button from '../common/Button';

const MAX_LENGTH = 500;

export default function ChatInput({ onSendMessage, disabled = false }) {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!content.trim() || disabled) return;

    onSendMessage(content.trim());
    setContent('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form className="chat-input-wrapper" onSubmit={handleSubmit}>
      <div className="chat-input-box">
        <input
          type="text"
          className="input"
          placeholder={disabled ? 'Chat disabled' : 'Type a message... (Press Enter)'}
          value={content}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="submit"
          variant="primary"
          icon={Send}
          disabled={disabled || !content.trim()}
          style={{ padding: '8px 12px' }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          fontSize: '0.7rem',
          color: content.length >= MAX_LENGTH ? 'var(--accent-danger)' : 'var(--text-muted)',
        }}
      >
        {content.length}/{MAX_LENGTH}
      </div>
    </form>
  );
}
