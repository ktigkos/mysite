import { Injectable, OnDestroy } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

export interface WsMessage {
  type: 'init' | 'update' | 'clear';
  content: string;
}

@Injectable({ providedIn: 'root' })
export class NotepadWsService implements OnDestroy {
  private ws: WebSocket | null = null;
  private reconnectTimer: any;
  private connected = false;

  status$   = new BehaviorSubject<WsStatus>('connecting');
  messages$ = new Subject<WsMessage>();

  constructor(private http: HttpClient) {}

  // Fetch current note content via HTTP — reliable fallback for initial load
  fetchNote() {
    return this.http.get<{ content: string }>('/api/note');
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const host = location.hostname === 'localhost' && location.port === '4200'
      ? 'localhost:3000'
      : location.host;
    this.ws = new WebSocket(`${protocol}://${host}`);
    this.status$.next('connecting');

    this.ws.onopen = () => {
      this.connected = true;
      this.status$.next('connected');
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.status$.next('disconnected');
      this.reconnectTimer = setTimeout(() => this.connect(), 2000);
    };

    this.ws.onerror = () => {
      this.status$.next('disconnected');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        // Only emit 'update' from WS — initial content comes from HTTP
        if (msg.type === 'update') {
          this.messages$.next(msg);
        }
      } catch {}
    };
  }

  send(msg: WsMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  ngOnDestroy() {
    clearTimeout(this.reconnectTimer);
    this.ws?.close();
  }
}
