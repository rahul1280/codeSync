import React from 'react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { UserMinus } from 'lucide-react';
import { ROLE_LABELS } from '../../utils/constants';

export default function MemberList({
  members = [],
  ownerId,
  currentUserId,
  onUpdateRole,
  onRemoveMember,
}) {
  const isOwner = currentUserId === ownerId;

  if (!members || members.length === 0) {
    return (
      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
        No members yet
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {members.map((member) => {
        const userObj = member.user || member;
        const memberUserId = userObj._id || userObj.id;
        const name = userObj.name || userObj.email || 'User';
        const role = member.role || (memberUserId === ownerId ? 'owner' : 'editor');
        const roleConfig = ROLE_LABELS[role] || ROLE_LABELS.editor;
        const isMemberOwner = memberUserId === ownerId;
        const isSelf = memberUserId === currentUserId;

        return (
          <div
            key={memberUserId || Math.random()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Avatar name={name} size="sm" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {name} {isSelf && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(You)</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {userObj.email}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isOwner && !isMemberOwner && onUpdateRole ? (
                <select
                  value={role}
                  onChange={(e) => onUpdateRole(memberUserId, e.target.value)}
                  className="input"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.75rem',
                    width: 'auto',
                    height: '28px',
                  }}
                >
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              ) : (
                <Badge variant={roleConfig.badgeClass.replace('badge-', '')}>
                  {roleConfig.label}
                </Badge>
              )}

              {isOwner && !isMemberOwner && onRemoveMember && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMember(memberUserId)}
                  title="Remove Member"
                  style={{ color: 'var(--accent-danger)', padding: '4px' }}
                >
                  <UserMinus size={14} />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
