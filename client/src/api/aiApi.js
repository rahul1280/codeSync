import api from './axios';

export const aiApi = {
  async explainCode({ language, code }) {
    const res = await api.post('/ai/explain', { language, code });
    return res.data;
  },

  async suggestTests({ language, code }) {
    const res = await api.post('/ai/suggest-tests', { language, code });
    return res.data;
  },

  async getAiStatus() {
    const res = await api.get('/ai/status');
    return res.data;
  },
};
