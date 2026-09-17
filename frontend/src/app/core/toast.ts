import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'ok' | 'err' | 'info';
  title: string;
  msg?: string;
}

@Injectable({ providedIn: 'root' })
export class Toasts {
  private seq = 0;
  readonly items = signal<Toast[]>([]);

  ok(title: string, msg?: string) { this.push('ok', title, msg); }
  err(title: string, msg?: string) { this.push('err', title, msg, 7000); }
  info(title: string, msg?: string) { this.push('info', title, msg); }

  dismiss(id: number) { this.items.update(l => l.filter(t => t.id !== id)); }

  private push(kind: Toast['kind'], title: string, msg?: string, ttl = 4500) {
    const id = ++this.seq;
    this.items.update(l => [...l, { id, kind, title, msg }]);
    setTimeout(() => this.dismiss(id), ttl);
  }
}
