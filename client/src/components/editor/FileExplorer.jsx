import React, { useState } from 'react';
import { FilePlus, Trash2, FileCode, ChevronDown, ChevronRight } from 'lucide-react';
import ConfirmDialog from '../common/ConfirmDialog';
import Modal from '../common/Modal';
import Input from '../common/Input';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';

export default function FileExplorer({
  files = [],
  activeFileId,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  canEdit = true,
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState('javascript');
  const [fileToDelete, setFileToDelete] = useState(null);
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState('');

  const handleOpenCreateModal = () => {
    setNewFileName('');
    setNewFileLang('javascript');
    setNameError('');
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newFileName.trim()) {
      setNameError('File name is required');
      return;
    }

    setCreating(true);
    setNameError('');
    try {
      // Find default code for chosen language
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.id === newFileLang);
      const defaultContent = langConfig ? langConfig.defaultCode : '// Write code here\n';

      // Ensure proper extension if not given
      let finalName = newFileName.trim();
      const ext = langConfig ? `.${langConfig.extension}` : '';
      if (ext && !finalName.includes('.')) {
        finalName += ext;
      }

      await onCreateFile({
        name: finalName,
        language: newFileLang,
        content: defaultContent,
      });

      setShowCreateModal(false);
    } catch {
      // error handled in caller
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    try {
      await onDeleteFile(fileToDelete._id || fileToDelete.id);
      setFileToDelete(null);
    } catch {
      // error handled in caller
    }
  };

  return (
    <aside className="file-explorer">
      <div className="file-explorer-header">
        <span>Files</span>
        {canEdit && (
          <button
            className="btn-ghost btn-sm"
            onClick={handleOpenCreateModal}
            title="Create new file"
            aria-label="Create new file"
            style={{ padding: '2px 4px' }}
          >
            <FilePlus size={16} />
          </button>
        )}
      </div>

      <div className="file-list">
        {files.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
            }}
          >
            No files in this room.
          </div>
        ) : (
          files.map((file) => {
            const fileId = file._id || file.id;
            const isActive = fileId === activeFileId;

            return (
              <div
                key={fileId}
                className={`file-item ${isActive ? 'active' : ''}`}
                onClick={() => onSelectFile(file)}
              >
                <div className="file-item-name" title={file.name}>
                  <FileCode size={14} color="var(--accent-primary)" />
                  <span>{file.name}</span>
                </div>

                {canEdit && files.length > 1 && (
                  <div className="file-item-actions">
                    <button
                      className="btn-ghost btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileToDelete(file);
                      }}
                      title="Delete file"
                      aria-label={`Delete ${file.name}`}
                      style={{ padding: '2px', color: 'var(--accent-danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New File"
        onConfirm={handleCreateSubmit}
        confirmText="Create File"
        loading={creating}
      >
        <form onSubmit={handleCreateSubmit}>
          <Input
            label="File Name"
            value={newFileName}
            onChange={(e) => {
              setNewFileName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="e.g. index.js, script.py"
            error={nameError}
            required
            autoFocus
          />

          <div className="input-group">
            <label className="input-label" htmlFor="new-file-lang">
              Language
            </label>
            <select
              id="new-file-lang"
              className="input"
              value={newFileLang}
              onChange={(e) => setNewFileLang(e.target.value)}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(fileToDelete)}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete File"
        message={`Are you sure you want to delete "${fileToDelete?.name}"? All content will be permanently removed.`}
        confirmText="Delete File"
      />
    </aside>
  );
}
