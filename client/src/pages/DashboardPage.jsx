import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Search, FolderCode } from 'lucide-react';
import RoomCard from '../components/rooms/RoomCard';
import CreateRoomModal from '../components/rooms/CreateRoomModal';
import JoinRoomModal from '../components/rooms/JoinRoomModal';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { roomApi } from '../api/roomApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function DashboardPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const currentUserId = user?._id || user?.id;

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await roomApi.getRooms();
      const roomList = Array.isArray(data?.rooms)
        ? data.rooms
        : Array.isArray(data?.data?.rooms)
        ? data.data.rooms
        : Array.isArray(data)
        ? data
        : [];
      setRooms(roomList);
    } catch {
      toast.error('Failed to load your rooms');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleRoomCreated = (newRoom) => {
    setRooms((prev) => [newRoom, ...prev]);
    navigate(`/room/${newRoom._id || newRoom.id}`);
  };

  const handleRoomJoined = (joinedRoom) => {
    navigate(`/room/${joinedRoom._id || joinedRoom.id}`);
  };

  const safeRooms = Array.isArray(rooms) ? rooms : [];
  const filteredRooms = safeRooms.filter((r) =>
    r && r.name && (
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  return (
    <div className="grid-container dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '6px' }}>
            Collaboration Rooms
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage and join your real-time coding sessions
          </p>
        </div>

        <div className="dashboard-actions">
          <Button
            variant="secondary"
            icon={Users}
            onClick={() => setShowJoinModal(true)}
          >
            Join Room
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            Create Room
          </Button>
        </div>
      </div>

      {rooms.length > 0 && (
        <div style={{ maxWidth: '400px', marginBottom: '20px' }}>
          <div className="input-wrapper">
            <Search size={16} className="input-icon" />
            <input
              type="text"
              className="input has-icon"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 0',
            gap: '12px',
          }}
        >
          <Spinner size="lg" />
          <span style={{ color: 'var(--text-secondary)' }}>Loading rooms...</span>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="card" style={{ padding: '40px' }}>
          <EmptyState
            icon={FolderCode}
            title={searchQuery ? 'No rooms match your search' : 'No rooms yet'}
            description={
              searchQuery
                ? 'Try searching with different keywords.'
                : 'Create your first collaboration room or join one with an invite code.'
            }
            actionLabel={searchQuery ? null : 'Create Room'}
            onAction={searchQuery ? null : () => setShowCreateModal(true)}
            actionIcon={Plus}
          />
        </div>
      ) : (
        <div className="grid-cards">
          {filteredRooms.map((room) => (
            <RoomCard
              key={room._id || room.id}
              room={room}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleRoomCreated}
      />

      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoined={handleRoomJoined}
      />
    </div>
  );
}
