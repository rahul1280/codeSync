import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Trash2, X, Send, Square } from 'lucide-react';
import Button from '../common/Button';
import Spinner from '../common/Spinner';

export default function OutputPanel({
  output,
  error,
  loading = false,
  onClear,
  onClose,
  executionTime,
  isInteractive = false,
  onSendInput,
  onStopExecution,
}) {
  const [inputValue, setInputValue] = useState('');
  const outputEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when output or error updates
  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output, error, isInteractive]);

  // Keep focus on the stdin input field while execution is active
  useEffect(() => {
    if (isInteractive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isInteractive, output]);

  const handleSendInput = () => {
    if (onSendInput && inputValue !== undefined) {
      onSendInput(inputValue);
      setInputValue('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendInput();
    }
  };

  const hasContent = Boolean(output || error);

  return (
    <div className="output-panel">
      <div className="output-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={14} color="var(--accent-secondary)" />
          <span>Terminal</span>
          {executionTime && !isInteractive && (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ({executionTime}ms)
            </span>
          )}
          {isInteractive && (
            <span
              style={{
                fontSize: '0.65rem',
                color: 'var(--accent-secondary)',
                background: 'rgba(63, 185, 80, 0.15)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ● RUNNING
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isInteractive && onStopExecution && (
            <Button
              variant="danger"
              size="sm"
              icon={Square}
              onClick={onStopExecution}
              title="Stop execution"
              style={{ height: '24px', padding: '0 8px', fontSize: '0.75rem' }}
            >
              Stop
            </Button>
          )}
          {hasContent && !isInteractive && (
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
          )}
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
        {/* If loading and there's no output text yet, show the starting indicator */}
        {loading && !hasContent && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <Spinner size="sm" />
            <span>Running program...</span>
          </div>
        )}

        {/* Display live output text */}
        {output ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              lineHeight: '1.5',
            }}
          >
            {output}
          </pre>
        ) : null}

        {/* Display error message if present */}
        {error ? (
          <div style={{ marginTop: output ? '8px' : 0 }}>
            <div style={{ color: 'var(--accent-danger)', fontWeight: 600, marginBottom: '4px' }}>
              Execution Error:
            </div>
            <div>{error}</div>
          </div>
        ) : null}

        {/* Empty state when not running and no content */}
        {!loading && !hasContent && (
          <span style={{ color: 'var(--text-muted)' }}>
            Click &quot;Run Code&quot; (or press Ctrl+Enter) to execute your program.
          </span>
        )}

        <div ref={outputEndRef} />
      </div>

      {/* Interactive stdin input bar — visible whenever a program is running */}
      {isInteractive && (
        <div className="output-input-bar">
          <span
            style={{
              color: 'var(--accent-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              userSelect: 'none',
              fontWeight: 700
            }}
          >
            &gt;
          </span>
          <input
            ref={inputRef}
            type="text"
            className="output-stdin-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type input here and press Enter..."
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="output-send-btn"
            onClick={handleSendInput}
            title="Send input (Enter)"
          >
            <Send size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
