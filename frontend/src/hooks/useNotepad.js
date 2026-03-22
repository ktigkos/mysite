import { useEffect, useRef, useState, useCallback } from 'react';

export function useNotepad(textareaRef) {
  const wsRef       = useRef(null);
  const timerRef    = useRef(null);
  const [status,    setStatus]    = useState('connecting');
  const [lastSaved, setLastSaved] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(1);

  const stamp = useCallback((label) => {
    const now = new Date();
    setLastSaved(`${label} — ${now.toLocaleTimeString('en-GB', { hour12: false })}`);
  }, []);

  const updateCounts = useCallback((val) => {
    setCharCount(val.length);
    setLineCount(val ? val.split('\n').length : 1);
  }, []);

  // scrollToEnd: false = preserve scroll (initial load & own typing)
  //              true  = scroll to bottom (remote update so new content is visible)
  const setTextarea = useCallback((val, scrollToEnd = false) => {
    const el = textareaRef?.current;
    if (!el) return;
    const prevScroll = el.scrollTop;
    el.value = val;
    el.scrollTop = scrollToEnd ? el.scrollHeight : prevScroll;
    updateCounts(val);
  }, [textareaRef, updateCounts]);

  const connect = useCallback(() => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const host = location.hostname === 'localhost' && location.port === '4200'
      ? 'localhost:3000' : location.host;
    const ws = new WebSocket(`${protocol}://${host}`);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen    = () => setStatus('connected');
    ws.onclose   = () => { setStatus('disconnected'); setTimeout(connect, 2000); };
    ws.onerror   = () => setStatus('disconnected');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'update') {
        setTextarea(msg.content, true); // scroll to end on remote update
        stamp('Synced from another device');
      }
    };
  }, [setTextarea, stamp]);

  useEffect(() => {
    // Fetch initial content via HTTP — preserve scroll (starts at top)
    fetch('/api/note')
      .then(r => r.json())
      .then(({ content }) => setTextarea(content, false))
      .catch(() => {});

    connect();
    return () => { wsRef.current?.close(); clearTimeout(timerRef.current); };
  }, [connect, setTextarea]);

  const onInput = useCallback((e) => {
    const val = e.target.value;
    updateCounts(val);
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'update', content: val }));
      stamp('Saving...');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => stamp('Saved'), 600);
    }
  }, [updateCounts, stamp]);

  const clearNote = useCallback(() => {
    if (!confirm('PURGE ALL DATA? This will sync to all connected terminals.')) return;
    setTextarea('', false);
    wsRef.current?.send(JSON.stringify({ type: 'update', content: '' }));
    setLastSaved('');
  }, [setTextarea]);

  return { status, lastSaved, charCount, lineCount, onInput, clearNote };
}
