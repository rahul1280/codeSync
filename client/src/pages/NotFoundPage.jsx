import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-code">404</div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '10px' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '28px' }}>
        The page or room you are looking for doesn&apos;t exist or has been moved to another location.
      </p>
      <Link to="/">
        <Button variant="primary" icon={Home}>
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
