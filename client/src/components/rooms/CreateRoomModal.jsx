import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';
import { validateRoomName } from '../../utils/validation';
import { roomApi } from '../../api/roomApi';
import { useToast } from '../../context/ToastContext';

export default function CreateRoomModal({ isOpen, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleClose = () => {
    setName('');
    setDescription('');
    setLanguage('javascript');
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const valError = validateRoomName(name);
    if (valError) {
      setError(valError);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await roomApi.createRoom({
        name: name.trim(),
        language,
        description: description.trim(),
      });
      toast.success('Room created successfully!');
      const newRoom = res.room || res;
      handleClose();
      if (onCreated) onCreated(newRoom);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create room';
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
      title="Create New Room"
      onConfirm={handleSubmit}
      confirmText="Create Room"
      loading={loading}
    >
      <form onSubmit={handleSubmit}>
        <Input
          label="Room Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g. Algorithms Practice, Project Alpha"
          error={error}
          required
          autoFocus
        />

        <div className="input-group">
          <label className="input-label" htmlFor="room-language">
            Default Language
          </label>
          <select
            id="room-language"
            className="input"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="room-desc">
            Description (Optional)
          </label>
          <textarea
            id="room-desc"
            className="input"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this collaboration room for?"
            style={{ resize: 'vertical' }}
          />
        </div>
      </form>
    </Modal>
  );
}
