import api from './axios';

export const executionApi = {
  async executeCode({ language, code, stdin = '' }) {
    const res = await api.post('/execute', { language, code, stdin });
    return res.data;
  },

  async getExecution(executionId) {
    const res = await api.get(`/execute/${executionId}`);
    return res.data;
  },
};
