import { useRef } from 'react';
import { useNotepad } from '../hooks/useNotepad';
import styles from './Notepad.module.css';

const STATUS_MAP = {
  connected:    { label: 'LIVE — REAL-TIME SYNC ACTIVE', cls: 'connected' },
  disconnected: { label: 'DISCONNECTED — RETRYING...',   cls: 'disconnected' },
  connecting:   { label: 'CONNECTING TO WS SERVER...',   cls: 'connecting' },
};

export default function Notepad() {
  const textareaRef = useRef(null);
  const { status, lastSaved, charCount, lineCount, onInput, clearNote } = useNotepad(textareaRef);
  const { label, cls } = STATUS_MAP[status] || STATUS_MAP.connecting;

  return (
    <div className={styles.notepad}>
      <div className={styles.header}>
        <div className={styles.tag}>// MODULE_03</div>
        <h2 className={styles.title}>
          NOTEPAD<span className={styles.accent}>_WS</span>
        </h2>
        <p className={styles.sub}>Real-time sync across all sessions via WebSocket. Persists to MySQL.</p>
      </div>

      <div className={styles.editor}>

        {/* Top bar */}
        <div className={styles.editorBar}>
          <div className={`${styles.wsStatus} ${styles[cls]}`}>
            <span className={styles.wsDot} />
            <span className={styles.wsLabel}>{label}</span>
          </div>
          <button className={styles.clearBtn} onClick={clearNote}>CLEAR</button>
        </div>

        {/* Editor body */}
        <div className={styles.editorBody}>
          <div className={styles.lineNums} aria-hidden="true">
            {Array.from({ length: lineCount }, (_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            onInput={onInput}
            placeholder={'// Start typing...\n// Notes sync in real-time across all open sessions.\n// Data persists to MySQL via WebSocket server.'}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* Status bar */}
        <div className={styles.statusBar}>
          <span className={styles.stat}>CHARS: {charCount}</span>
          <span className={styles.stat}>LINES: {lineCount}</span>
          <span className={styles.saved}>{lastSaved}</span>
        </div>
      </div>
    </div>
  );
}
