import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import { roomApi } from '../../api/roomApi';
import { useToast } from '../../context/ToastContext';
import { KeyRound } from 'lucide-react';

export default function JoinRoomModal({ isOpen, onClose, onJoined }) {
  const [inviteInput, setInviteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleClose = () => {
    setInviteInput('');
    setError('');
    onClose();
  };

  const handleJoin = async (e) => {
    if (e) e.preventDefault();
    if (!inviteInput.trim()) {
      setError('Please provide an invite code or link');
      return;
    }

    // Extract code if a full URL was pasted
    let code = inviteInput.trim();
    if (code.includes('/join/')) {
      code = code.split('/join/')[1].split('?')[0];
    } else if (code.includes('/room/')) {
      code = code.split('/room/')[1].split('?')[0];
    }

    setLoading(true);
    setError('');
    try {
      const res = await roomApi.joinRoom(code);
      toast.success('Joined room successfully!');
      const joinedRoom = res.room || res;
      handleClose();
      if (onJoined) onJoined(joinedRoom);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to join room. Please check the code.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Join Room"
      onConfirm={handleJoin}
      confirmText="Join Room"
      loading={loading}
    >
      <form onSubmit={handleJoin}>
        <Input
          label="Invitation Code or URL"
          value={inviteInput}
          onChange={(e) => {
            setInviteInput(e.target.value);
            if (error) setError('');
          }}
          placeholder="Paste invite code or URL"
          icon={KeyRound}
          error={error}
          required
          autoFocus
        />
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
          Enter the 8-character invite code or the complete invite link shared by the room owner.
        </p>
      </form>
    </Modal>
  );
}
