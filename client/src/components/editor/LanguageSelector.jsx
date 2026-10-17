import React from 'react';
import { SUPPORTED_LANGUAGES } from '../../utils/constants';

export default function LanguageSelector({ language, onChange, disabled = false }) {
  return (
    <select
      className="input"
      value={language}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        padding: '4px 10px',
        fontSize: '0.8rem',
        height: '32px',
        width: 'auto',
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      aria-label="Select programming language"
    >
      {SUPPORTED_LANGUAGES.map((lang) => (
        <option key={lang.id} value={lang.id}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
