import React from 'react';
import { Terminal, Trash2, X, Play } from 'lucide-react';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

export default function OutputPanel({
  output,
  error,
  loading = false,
  onClear,
  onClose,
  executionTime,
}) {
  return (
    <div className="output-panel">
      <div className="output-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} color="var(--accent-secondary)" />
          <span>Execution Output</span>
          {executionTime && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ({executionTime}ms)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {output || error ? (
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={onClear}
              title="Clear output"
              style={{ height: '24px', padding: '0 6px', fontSize: '0.75rem' }}
            >
              Clear
            </Button>
          ) : null}
          {onClose && (
            <button
              className="btn-ghost btn-sm"
              onClick={onClose}
              style={{ padding: '2px', display: 'flex', alignItems: 'center' }}
              aria-label="Close output panel"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className={`output-body ${error ? 'error' : ''}`}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <Spinner size="sm" />
            <span>Executing script in isolated sandbox...</span>
          </div>
        ) : error ? (
          <div>
            <div style={{ color: 'var(--accent-danger)', fontWeight: 600, marginBottom: '6px' }}>
              Execution Error:
            </div>
            <div>{error}</div>
          </div>
        ) : output ? (
          output
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>
            Click &quot;Run Code&quot; (or press Ctrl+Enter) to execute your program.
          </span>
        )}
      </div>
    </div>
  );
}
