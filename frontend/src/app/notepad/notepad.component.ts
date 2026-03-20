import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotepadWsService, WsStatus } from '../notepad-ws.service';

@Component({
  selector: 'app-notepad',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notepad.component.html',
  styleUrls: ['./notepad.component.scss']
})
export class NotepadComponent implements OnInit, OnDestroy {
  @ViewChild('textarea') textareaRef!: ElementRef<HTMLTextAreaElement>;

  status: WsStatus = 'connecting';
  lastSaved = '';
  charCount = 0;
  lineCount = 1;

  private subs = new Subscription();
  private saveTimer: any;

  constructor(private ws: NotepadWsService) {}

  ngOnInit() {
    this.ws.fetchNote().subscribe({
      next: ({ content }) => {
        this.setContent(content);
      },
      error: () => {}
    });

    this.ws.connect();

    this.subs.add(
      this.ws.status$.subscribe(s => this.status = s)
    );

    this.subs.add(
      this.ws.messages$.subscribe(msg => {
        if (msg.type === 'update') {
          this.setContent(msg.content);
          this.stamp('Synced from another device');
        }
      })
    );
  }

  // Always write directly to the DOM element — avoids Angular binding
  // causing the textarea to resize or the page to stretch
  private setContent(value: string) {
    const el = this.textareaRef?.nativeElement;
    if (el) {
      const scrollPos = el.scrollTop;
      el.value = value;
      el.scrollTop = scrollPos; // preserve scroll position
    }
    this.updateCounts(value);
  }

  onInput(event: Event) {
    const el  = event.target as HTMLTextAreaElement;
    const val = el.value;
    this.updateCounts(val);
    this.ws.send({ type: 'update', content: val });
    this.stamp('Saving...');
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.stamp('Saved'), 600);
  }

  clearNote() {
    if (!confirm('CLEAR ALL NOTES? This action will sync to all connected devices.')) return;
    this.setContent('');
    this.ws.send({ type: 'update', content: '' });
    this.lastSaved = '';
  }

  private updateCounts(content: string) {
    this.charCount = content.length;
    this.lineCount = content ? content.split('\n').length : 1;
  }

  private stamp(label: string) {
    const now = new Date();
    this.lastSaved = `${label} — ${now.toLocaleTimeString('en-GB', { hour12: false })}`;
  }

  get statusLabel(): string {
    switch (this.status) {
      case 'connected':    return 'LIVE — REAL-TIME SYNC ACTIVE';
      case 'disconnected': return 'DISCONNECTED — RETRYING...';
      case 'connecting':   return 'CONNECTING TO WS SERVER...';
    }
  }

  get statusClass(): string { return this.status; }

  ngOnDestroy() {
    this.subs.unsubscribe();
    clearTimeout(this.saveTimer);
  }
}
