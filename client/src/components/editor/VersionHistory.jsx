import React, { useState, useEffect, useCallback } from 'react';
import { History, RotateCcw, X } from 'lucide-react';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import { fileApi } from '../../api/fileApi';
import { formatDate, formatTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

export default function VersionHistory({
  fileId,
  onRestore,
  onClose,
  canEdit = true,
}) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);
  const { toast } = useToast();

  const fetchVersions = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    try {
      const data = await fileApi.getVersions(fileId);
      setVersions(data.versions || data || []);
    } catch {
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  }, [fileId, toast]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = async (version) => {
    setRestoringId(version._id || version.id);
    try {
      await fileApi.restoreVersion(fileId, version._id || version.id);
      toast.success('Version restored successfully');
      if (onRestore) onRestore(version);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore version');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="side-panel">
      <div className="side-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={16} color="var(--accent-primary)" />
          <span>Version History</span>
        </div>
        {onClose && (
          <button className="btn-ghost btn-sm" onClick={onClose} aria-label="Close history">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="version-list">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
            <Spinner size="md" />
          </div>
        ) : versions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <History size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p>No saved versions yet.</p>
            <p style={{ marginTop: '4px', fontSize: '0.75rem' }}>
              Versions are created each time you save file changes.
            </p>
          </div>
        ) : (
          versions.map((ver, idx) => {
            const dateStr = ver.createdAt || ver.timestamp;
            const author = ver.createdByName || ver.author?.name || 'Collaborator';
            const vId = ver._id || ver.id;
            const isRestoring = restoringId === vId;

            return (
              <div key={vId || idx} className="version-item">
                <div className="version-meta">
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    v{versions.length - idx}
                  </span>
                  <span>{formatDate(dateStr)} {formatTime(dateStr)}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Saved by <span style={{ color: 'var(--text-primary)' }}>{author}</span>
                </div>
                {canEdit && (
                  <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={RotateCcw}
                      loading={isRestoring}
                      onClick={() => handleRestore(ver)}
                    >
                      Restore
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
