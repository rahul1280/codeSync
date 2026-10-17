import React from 'react';
import { Code2, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Code2 size={20} color="var(--accent-primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>CodeSync</span>
          <span>— Collaborative Coding in Real-Time</span>
        </div>
        <div>
          <span>Built with </span>
          <Heart size={14} color="var(--accent-danger)" style={{ display: 'inline', verticalAlign: 'middle' }} />
          <span> for developers worldwide.</span>
        </div>
      </div>
    </footer>
  );
}
