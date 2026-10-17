import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roomApi } from '../api/roomApi';
import Avatar from '../components/common/Avatar';
import { formatDate } from '../utils/formatters';
import { Mail, Calendar, FolderCode, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [roomCount, setRoomCount] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await roomApi.getRooms();
        const rooms = data.rooms || data || [];
        setRoomCount(rooms.length);
      } catch {
        setRoomCount(0);
      }
    }
    loadStats();
  }, []);

  const name = user?.name || 'Developer';
  const email = user?.email || '';
  const createdAt = user?.createdAt || new Date().toISOString();

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <Avatar name={name} size="lg" />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>{name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{email}</p>
          </div>
        </div>

        <div className="profile-meta">
          <div className="meta-item">
            <span className="meta-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> Email
              </span>
            </span>
            <span className="meta-value">{email}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} /> Member Since
              </span>
            </span>
            <span className="meta-value">{formatDate(createdAt)}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderCode size={14} /> Active Rooms
              </span>
            </span>
            <span className="meta-value">{roomCount}</span>
          </div>

          <div className="meta-item">
            <span className="meta-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={14} /> Account Status
              </span>
            </span>
            <span className="meta-value" style={{ color: 'var(--accent-secondary)' }}>
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
