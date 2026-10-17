import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ id, type = 'info', message, onClose, duration = 5000 }) {
  useEffect(() => {
    if (!duration) return;
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} color="var(--accent-secondary)" />;
      case 'error':
        return <AlertCircle size={18} color="var(--accent-danger)" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--accent-warning)" />;
      case 'info':
      default:
        return <Info size={18} color="var(--accent-primary)" />;
    }
  };

  return (
    <div className={`toast toast-${type}`} role="alert">
      {renderIcon()}
      <div className="toast-content">{message}</div>
      <button
        className="toast-close"
        onClick={() => onClose(id)}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
