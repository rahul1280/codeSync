import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { Copy, Check, Link, RefreshCw } from 'lucide-react';
import { roomApi } from '../../api/roomApi';
import { useToast } from '../../context/ToastContext';

export default function InviteModal({ isOpen, onClose, roomId, currentInviteCode }) {
  const [inviteCode, setInviteCode] = useState(currentInviteCode || roomId);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const inviteUrl = `${window.location.origin}/join/${inviteCode}`;

  const handleGenerateNew = async (silent = false) => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await roomApi.createInvitation(roomId);
      const code =
        res?.invitation?.token ||
        res?.invitation?.rawToken ||
        res?.invitation?.code ||
        res?.token ||
        res?.code ||
        res?.inviteCode;
      if (code) {
        setInviteCode(code);
        if (!silent) {
          toast.success('Generated new invitation link!');
        }
      }
    } catch (err) {
      if (!silent) {
        toast.error(err.response?.data?.message || 'Failed to generate new link');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && roomId && !currentInviteCode) {
      handleGenerateNew(true);
    }
  }, [isOpen, roomId, currentInviteCode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invitation link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Collaborators"
      showFooter={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Share this link with your team to invite them into this real-time session:
        </p>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Input
            value={inviteUrl}
            readOnly
            icon={Link}
            style={{ marginBottom: 0 }}
          />
          <Button
            variant="primary"
            onClick={handleCopy}
            icon={copied ? Check : Copy}
            style={{ minWidth: '90px' }}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Invite Code: <strong style={{ color: 'var(--text-primary)' }}>{inviteCode}</strong>
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateNew}
            icon={RefreshCw}
            loading={loading}
          >
            Generate New Link
          </Button>
        </div>
      </div>
    </Modal>
  );
}
