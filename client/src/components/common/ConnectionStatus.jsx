import React from 'react';

export default function ConnectionStatus({ isConnected, label = true }) {
  const statusColor = isConnected ? 'var(--accent-secondary)' : 'var(--accent-danger)';
  const statusText = isConnected ? 'Connected' : 'Disconnected';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
      }}
      title={`Status: ${statusText}`}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColor,
          display: 'inline-block',
          boxShadow: isConnected ? '0 0 6px var(--accent-secondary)' : 'none',
        }}
      />
      {label && <span>{statusText}</span>}
    </div>
  );
}
