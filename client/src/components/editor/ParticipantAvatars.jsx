import React from 'react';
import Avatar from '../common/Avatar';

export default function ParticipantAvatars({ participants = [] }) {
  if (!participants || participants.length === 0) return null;

  const displayParticipants = participants.slice(0, 5);
  const remainingCount = participants.length - 5;

  return (
    <div className="participant-avatars" title={`${participants.length} user(s) currently connected`}>
      {displayParticipants.map((p, idx) => (
        <Avatar
          key={p.clientId || idx}
          name={p.name || 'User'}
          color={p.color}
          size="sm"
          title={`${p.name || 'User'} (Online)`}
        />
      ))}
      {remainingCount > 0 && (
        <div
          className="avatar avatar-sm"
          style={{ backgroundColor: 'var(--bg-hover)', fontSize: '0.65rem' }}
          title={`${remainingCount} more user(s)`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
