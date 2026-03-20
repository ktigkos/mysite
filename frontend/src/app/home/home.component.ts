import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  bootLines: string[] = [];
  bootDone = false;
  private timer: any;

  readonly lines = [
    '> INITIALISING MYSITE v2.0...',
    '> LOADING NEURAL INTERFACE...',
    '> CONNECTING TO DATABASE [OK]',
    '> WEBSOCKET DAEMON [READY]',
    '> SYSTEM ONLINE — WELCOME.',
  ];

  ngOnInit() {
    let i = 0;
    const show = () => {
      if (i < this.lines.length) {
        this.bootLines.push(this.lines[i++]);
        this.timer = setTimeout(show, 260);
      } else {
        setTimeout(() => this.bootDone = true, 300);
      }
    };
    show();
  }

  ngOnDestroy() { clearTimeout(this.timer); }
}
