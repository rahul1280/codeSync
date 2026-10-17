import React from 'react';
import { X, FileCode } from 'lucide-react';

export default function EditorTabs({
  openFiles = [],
  activeFileId,
  onSelectFile,
  onCloseFile,
  dirtyFileIds = new Set(),
}) {
  if (!openFiles || openFiles.length === 0) {
    return <div className="editor-tabs-bar" />;
  }

  return (
    <div className="editor-tabs-bar">
      {openFiles.map((file) => {
        const fileId = file._id || file.id;
        const isActive = fileId === activeFileId;
        const isDirty = dirtyFileIds.has(fileId);

        return (
          <div
            key={fileId}
            className={`editor-tab ${isActive ? 'active' : ''}`}
            onClick={() => onSelectFile(file)}
          >
            <FileCode size={14} color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'} />
            <span>{file.name}</span>
            {isDirty && <span className="tab-dirty-indicator" title="Unsaved changes" />}
            <button
              className="tab-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                onCloseFile(fileId);
              }}
              title="Close tab"
              aria-label={`Close ${file.name}`}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
