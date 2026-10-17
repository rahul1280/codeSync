import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../hooks/useRoom';
import { useAuth } from '../context/AuthContext';
import EditorWorkspace from '../components/editor/EditorWorkspace';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import { roomApi } from '../api/roomApi';
import { useToast } from '../context/ToastContext';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function EditorPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    room,
    loading,
    error,
    updateRoom,
    removeMember,
    updateMemberRole,
  } = useRoom(roomId);

  const handleDeleteRoom = async (deletedRoomId) => {
    try {
      await roomApi.deleteRoom(deletedRoomId);
      toast.success('Room deleted successfully');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete room');
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-primary)',
          gap: '16px',
        }}
      >
        <Spinner size="lg" />
        <span style={{ color: 'var(--text-secondary)' }}>Connecting to room workspace...</span>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-primary)',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <AlertCircle size={48} color="var(--accent-danger)" style={{ marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Unable to Access Room</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: '24px' }}>
          {error || 'This room does not exist or you do not have permission to access it.'}
        </p>
        <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <EditorWorkspace
      room={room}
      currentUser={user}
      onUpdateRoom={updateRoom}
      onDeleteRoom={handleDeleteRoom}
      onUpdateMemberRole={updateMemberRole}
      onRemoveMember={removeMember}
    />
  );
}
