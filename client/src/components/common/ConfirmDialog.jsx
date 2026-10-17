import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmText = 'Delete',
  confirmVariant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      confirmText={confirmText}
      confirmVariant={confirmVariant}
      loading={loading}
    >
      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
        {message}
      </p>
    </Modal>
  );
}
