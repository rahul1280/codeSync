import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import MemberList from './MemberList';
import ConfirmDialog from '../common/ConfirmDialog';
import { validateRoomName } from '../../utils/validation';
import { useToast } from '../../context/ToastContext';
import { Trash2, UserPlus, Save } from 'lucide-react';
import InviteModal from './InviteModal';

export default function RoomSettings({
  isOpen,
  onClose,
  room,
  currentUserId,
  onUpdateRoom,
  onDeleteRoom,
  onUpdateMemberRole,
  onRemoveMember,
}) {
  const [name, setName] = useState(room?.name || '');
  const [description, setDescription] = useState(room?.description || '');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const { toast } = useToast();

  const ownerId = room?.owner?._id || room?.owner?.id || room?.owner;

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    const valError = validateRoomName(name);
    if (valError) {
      setNameError(valError);
      return;
    }

    setSaving(true);
    setNameError('');
    try {
      await onUpdateRoom({ name: name.trim(), description: description.trim() });
    } catch {
      // toast is already handled in hook
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await onDeleteRoom(room._id || room.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      toast.error('Failed to delete room');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Room Settings"
        maxWidth="600px"
        showFooter={false}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* General Information Form */}
          <form onSubmit={handleSaveDetails}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>General</h3>
            <Input
              label="Room Name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError('');
              }}
              error={nameError}
              required
            />
            <div className="input-group">
              <label className="input-label" htmlFor="settings-desc">Description</label>
              <textarea
                id="settings-desc"
                className="input"
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button type="submit" variant="primary" size="sm" icon={Save} loading={saving}>
                Save Changes
              </Button>
            </div>
          </form>

          <hr style={{ borderColor: 'var(--border-color)', margin: 0 }} />

          {/* Member Management */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Manage Members</h3>
              <Button
                variant="secondary"
                size="sm"
                icon={UserPlus}
                onClick={() => setShowInviteModal(true)}
              >
                Invite
              </Button>
            </div>
            <MemberList
              members={room?.members || []}
              ownerId={ownerId}
              currentUserId={currentUserId}
              onUpdateRole={onUpdateMemberRole}
              onRemoveMember={onRemoveMember}
            />
          </div>

          <hr style={{ borderColor: 'var(--border-color)', margin: 0 }} />

          {/* Danger Zone */}
          <div style={{ padding: '16px', border: '1px solid var(--accent-danger)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(248, 81, 73, 0.05)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-danger)', marginBottom: '6px' }}>
              Danger Zone
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Permanently delete this room and all associated files. This cannot be undone.
            </p>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Room
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Room"
        message="Are you completely sure? All code files, versions, and chat history for this room will be permanently destroyed."
        confirmText="Yes, Delete Room"
      />

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={room?._id || room?.id}
        currentInviteCode={room?.inviteCode}
      />
    </>
  );
}
