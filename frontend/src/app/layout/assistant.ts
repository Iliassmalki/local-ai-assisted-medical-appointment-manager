import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { apiError } from '../core/auth-interceptor';
import { Icon } from '../ui/icon';

interface Turn { role: 'user' | 'bot'; text: string; }

/**
 * Talks to ChatController (`POST /api/chat`), which returns plain text.
 */
@Component({
  selector: 'app-assistant',
  imports: [FormsModule, Icon],
  template: `
    <div class="panel" role="dialog" aria-label="Assistant Medora">
      <header>
        <span class="mark"><ui-icon name="sparkle" [size]="15" /></span>
        <div style="flex:1">
          <strong>Assistant Medora</strong>
          <div class="sub">Informations sur le service</div>
        </div>
        <button type="button" class="x" (click)="closed.emit()" aria-label="Fermer l'assistant">
          <ui-icon name="x" [size]="16" />
        </button>
      </header>

      <div class="log" #log>
        @for (t of turns(); track $index) {
          <div class="turn" [class.me]="t.role === 'user'">{{ t.text }}</div>
        }
        @if (busy()) { <div class="turn typing"><i></i><i></i><i></i></div> }
      </div>

      <form (ngSubmit)="send()">
        <input [(ngModel)]="draft" name="q" placeholder="Poser une question sur le site…"
               autocomplete="off" aria-label="Votre question" [disabled]="busy()" />
        <button type="submit" class="btn icon" [disabled]="busy() || !draft.trim()" aria-label="Envoyer">
          <ui-icon name="send" [size]="15" />
        </button>
      </form>
      <p class="foot">Informations générales sur le service. Ne remplace pas un avis médical.</p>
    </div>
  `,
  styles: [`
    :host { position: fixed; z-index: 100; right: 20px; bottom: 20px; }
    .panel {
      width: min(380px, calc(100vw - 32px)); max-height: min(560px, calc(100vh - 40px));
      display: flex; flex-direction: column;
      background: var(--surface); border: 1px solid var(--line);
      border-radius: var(--r-xl); box-shadow: var(--sh-3); overflow: hidden;
    }
    header { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid var(--line); }
    header strong { font-size: .92rem; display: block; }
    header .sub { font-size: .75rem; color: var(--muted); }
    .mark { width: 28px; height: 28px; border-radius: 8px; background: var(--primary-soft); color: var(--primary-700); display: grid; place-items: center; flex: none; }
    .x { background: none; border: none; color: var(--faint); cursor: pointer; padding: 4px; border-radius: 6px; line-height: 0; }
    .x:hover { color: var(--ink); background: var(--surface-2); }
    .log { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; min-height: 180px; }
    .turn {
      max-width: 84%; padding: 9px 13px; border-radius: 14px; font-size: .87rem; line-height: 1.5;
      background: var(--surface-2); color: var(--ink-2); border-bottom-left-radius: 5px; white-space: pre-wrap;
    }
    .turn.me { align-self: flex-end; background: var(--primary); color: #fff; border-bottom-left-radius: 14px; border-bottom-right-radius: 5px; }
    .typing { display: flex; gap: 4px; align-items: center; }
    .typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--faint); animation: b 1.1s infinite; }
    .typing i:nth-child(2) { animation-delay: .18s } .typing i:nth-child(3) { animation-delay: .36s }
    @keyframes b { 0%,60%,100% { opacity: .3 } 30% { opacity: 1 } }
    form { display: flex; gap: 8px; padding: 12px 14px 8px; border-top: 1px solid var(--line); }
    .foot { padding: 0 14px 12px; font-size: .72rem; color: var(--faint); }
    @media (max-width: 760px) { :host { right: 12px; left: 12px; bottom: 76px; } .panel { width: auto; } }
  `],
})
export class Assistant {
  @Output() closed = new EventEmitter<void>();
  private api = inject(Api);

  protected draft = '';
  protected busy = signal(false);
  protected turns = signal<Turn[]>([
    { role: 'bot', text: 'Bonjour. Je peux vous renseigner sur la prise de rendez-vous, les horaires et le fonctionnement du site.' },
  ]);

  protected send() {
    const q = this.draft.trim();
    if (!q || this.busy()) return;
    this.turns.update(t => [...t, { role: 'user', text: q }]);
    this.draft = '';
    this.busy.set(true);

    this.api.chat(q).subscribe({
      next: reply => {
        this.turns.update(t => [...t, { role: 'bot', text: reply.trim() || 'Aucune réponse reçue.' }]);
        this.busy.set(false);
      },
      error: e => {
        this.turns.update(t => [...t, {
          role: 'bot',
          text: `L'assistant est indisponible. ${apiError(e)}`,
        }]);
        this.busy.set(false);
      },
    });
  }
}
