import React from 'react';

export default function Badge({
  children,
  variant = 'primary', // primary, secondary, warning, danger, purple
  className = '',
}) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}
