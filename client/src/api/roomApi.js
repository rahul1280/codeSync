import api from './axios';

export const roomApi = {
  async getRooms() {
    const res = await api.get('/rooms');
    return res.data;
  },

  async getRoom(roomId) {
    const res = await api.get(`/rooms/${roomId}`);
    return res.data;
  },

  async createRoom(data) {
    const res = await api.post('/rooms', data);
    return res.data;
  },

  async updateRoom(roomId, data) {
    const res = await api.put(`/rooms/${roomId}`, data);
    return res.data;
  },

  async deleteRoom(roomId) {
    const res = await api.delete(`/rooms/${roomId}`);
    return res.data;
  },

  async joinRoom(inviteCode) {
    const res = await api.post('/rooms/join', {
      inviteCode,
      token: inviteCode
    });
    return res.data;
  },

  async leaveRoom(roomId) {
    const res = await api.post(`/rooms/${roomId}/leave`);
    return res.data;
  },

  async createInvitation(roomId, options = {}) {
    const res = await api.post(`/rooms/${roomId}/invitations`, options);
    return res.data;
  },

  async revokeInvitation(roomId, invitationId) {
    const res = await api.delete(`/rooms/${roomId}/invitations/${invitationId}`);
    return res.data;
  },

  async updateMember(roomId, userId, role) {
    const res = await api.put(`/rooms/${roomId}/members/${userId}`, { role });
    return res.data;
  },

  async removeMember(roomId, userId) {
    const res = await api.delete(`/rooms/${roomId}/members/${userId}`);
    return res.data;
  },
};
