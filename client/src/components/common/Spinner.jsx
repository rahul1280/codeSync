import React from 'react';

export default function Spinner({ size = 'md', className = '' }) {
  const sizeClass = size === 'lg' ? 'spinner-lg' : size === 'sm' ? 'spinner-sm' : '';
  return <span className={`spinner ${sizeClass} ${className}`} aria-hidden="true" />;
}
