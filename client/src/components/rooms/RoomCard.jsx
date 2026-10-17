import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Code, Crown } from 'lucide-react';
import Badge from '../common/Badge';
import { timeAgo } from '../../utils/formatters';

export default function RoomCard({ room, currentUserId }) {
  const navigate = useNavigate();

  const isOwner =
    (room.owner?._id || room.owner?.id || room.owner) === currentUserId;

  const memberCount = Array.isArray(room.members) ? room.members.length : 1;
  const updatedTime = room.updatedAt || room.createdAt;

  return (
    <div
      className="card card-hover"
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
      onClick={() => navigate(`/room/${room._id || room.id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {room.name}
        </h3>
        {isOwner && (
          <Badge variant="purple">
            <Crown size={12} style={{ display: 'inline', marginRight: '3px' }} />
            Owner
          </Badge>
        )}
      </div>

      <p
        style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          flex: 1,
          marginBottom: '16px',
          minHeight: '38px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {room.description || 'No description provided.'}
      </p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Code size={14} color="var(--accent-primary)" />
            <span style={{ textTransform: 'capitalize' }}>{room.language || 'javascript'}</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Users size={14} />
            {memberCount}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Clock size={14} />
          <span>{timeAgo(updatedTime)}</span>
        </div>
      </div>
    </div>
  );
}
