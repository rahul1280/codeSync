import React from 'react';

const COLORS = [
  '#f85149', // red
  '#58a6ff', // blue
  '#3fb950', // green
  '#d29922', // orange
  '#bc8cff', // purple
  '#39c5bb', // teal
  '#f0883e', // deep orange
  '#db61a2', // pink
];

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
}

export default function Avatar({
  name = 'User',
  size = 'md', // sm, md, lg
  color,
  className = '',
  title,
}) {
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const bgColor = color || getAvatarColor(name);
  const sizeClass = `avatar-${size}`;

  return (
    <div
      className={`avatar ${sizeClass} ${className}`}
      style={{ backgroundColor: bgColor }}
      title={title || name}
    >
      {initial}
    </div>
  );
}
