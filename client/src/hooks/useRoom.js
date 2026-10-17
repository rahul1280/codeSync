import { useState, useEffect, useCallback } from 'react';
import { roomApi } from '../api/roomApi';
import { useToast } from '../context/ToastContext';

export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await roomApi.getRoom(roomId);
      setRoom(data.room || data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load room details';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [roomId, toast]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const updateRoom = async (updates) => {
    try {
      const data = await roomApi.updateRoom(roomId, updates);
      const updated = data.room || data;
      setRoom(updated);
      toast.success('Room updated successfully');
      return updated;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update room';
      toast.error(msg);
      throw err;
    }
  };

  const removeMember = async (userId) => {
    try {
      await roomApi.removeMember(roomId, userId);
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.filter((m) => (m.user?._id || m.user?.id || m.user) !== userId),
        };
      });
      toast.success('Member removed');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove member';
      toast.error(msg);
      throw err;
    }
  };

  const updateMemberRole = async (userId, role) => {
    try {
      await roomApi.updateMember(roomId, userId, role);
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) => {
            const memberId = m.user?._id || m.user?.id || m.user;
            if (memberId === userId) {
              return { ...m, role };
            }
            return m;
          }),
        };
      });
      toast.success('Member role updated');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update role';
      toast.error(msg);
      throw err;
    }
  };

  return {
    room,
    loading,
    error,
    refreshRoom: fetchRoom,
    updateRoom,
    removeMember,
    updateMemberRole,
    setRoom,
  };
}
