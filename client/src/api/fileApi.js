import api from './axios';

export const fileApi = {
  async getRoomFiles(roomId) {
    const res = await api.get(`/rooms/${roomId}/files`);
    return res.data;
  },

  async getFile(fileId) {
    const res = await api.get(`/files/${fileId}`);
    return res.data;
  },

  async createFile(roomId, data) {
    const res = await api.post(`/rooms/${roomId}/files`, data);
    return res.data;
  },

  async updateFile(fileId, data) {
    const res = await api.put(`/files/${fileId}`, data);
    return res.data;
  },

  async deleteFile(fileId) {
    const res = await api.delete(`/files/${fileId}`);
    return res.data;
  },

  async saveFile(fileId, content) {
    const res = await api.post(`/files/${fileId}/save`, { content });
    return res.data;
  },

  async getVersions(fileId) {
    const res = await api.get(`/files/${fileId}/versions`);
    return res.data;
  },

  async restoreVersion(fileId, versionId) {
    const res = await api.post(`/files/${fileId}/versions/${versionId}/restore`);
    return res.data;
  },
};
