import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  Share2,
  Save,
  Play,
  Settings,
  MessageSquare,
  History,
  Sparkles,
} from 'lucide-react';
import Button from '../common/Button';
import ConnectionStatus from '../common/ConnectionStatus';
import ParticipantAvatars from './ParticipantAvatars';
import InviteModal from '../rooms/InviteModal';

export default function TopBar({
  room,
  isCollabConnected,
  participants = [],
  onSave,
  isSaving,
  isDirty,
  onRunCode,
  isRunning,
  onOpenSettings,
  isOwner,
  toggleChat,
  isChatOpen,
  unreadChatCount = 0,
  toggleHistory,
  isHistoryOpen,
  onExplainCode,
  isExplaining,
  canEdit = true,
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <>
      <header className="editor-topbar">
        <div className="topbar-left">
          <Link to="/dashboard" className="topbar-brand" title="Return to dashboard">
            <Code2 size={24} color="var(--accent-primary)" />
            <span>CodeSync</span>
          </Link>

          <div
            style={{
              height: '18px',
              width: '1px',
              backgroundColor: 'var(--border-color)',
            }}
          />

          <div className="topbar-room-name">
            <span>{room?.name || 'Collaborative Room'}</span>
          </div>

          <ConnectionStatus isConnected={isCollabConnected} />
        </div>

        <div className="topbar-center">
          <ParticipantAvatars participants={participants} />
        </div>

        <div className="topbar-right">
          <Button
            variant="ghost"
            size="sm"
            icon={Share2}
            onClick={() => setShowInviteModal(true)}
            title="Invite collaborators"
          >
            Invite
          </Button>

          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              icon={Sparkles}
              onClick={onExplainCode}
              loading={isExplaining}
              title="Explain code using AI"
            >
              AI Explain
            </Button>
          )}

          {canEdit && (
            <Button
              variant={isDirty ? 'primary' : 'secondary'}
              size="sm"
              icon={Save}
              onClick={onSave}
              loading={isSaving}
              title="Save changes (Ctrl+S)"
            >
              Save
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={Play}
            onClick={onRunCode}
            loading={isRunning}
            style={{ color: 'var(--accent-secondary)' }}
            title="Execute code"
          >
            Run
          </Button>

          <Button
            variant={isHistoryOpen ? 'primary' : 'ghost'}
            size="sm"
            icon={History}
            onClick={toggleHistory}
            title="Version history"
          />

          <div style={{ position: 'relative' }}>
            <Button
              variant={isChatOpen ? 'primary' : 'ghost'}
              size="sm"
              icon={MessageSquare}
              onClick={toggleChat}
              title="Room chat"
            />
            {unreadChatCount > 0 && !isChatOpen && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  backgroundColor: 'var(--accent-primary)',
                  color: '#0d1117',
                  borderRadius: '50%',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {unreadChatCount}
              </span>
            )}
          </div>

          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              icon={Settings}
              onClick={onOpenSettings}
              title="Room settings"
            />
          )}
        </div>
      </header>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        roomId={room?._id || room?.id}
        currentInviteCode={room?.inviteCode}
      />
    </>
  );
}
