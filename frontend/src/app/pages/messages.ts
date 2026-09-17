import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CONVERSATIONS, type Conversation, type Message } from '../core/mock/inbox';
import { relative, time } from '../core/format';
import { Icon } from '../ui/icon';
import { UiAvatar, UiEmpty } from '../ui/ui';

@Component({
  selector: 'app-messages',
  imports: [FormsModule, Icon, UiAvatar, UiEmpty],
  template: `
    <div class="page messages-page">
      <header class="page-head">
        <h1>Messagerie</h1>
        <p>Échanges avec votre équipe soignante.</p>
      </header>

      <div class="alert a-warn mb-3">
        <ui-icon name="alert" [size]="17" />
        <span><strong>N’utilisez pas la messagerie en cas d’urgence.</strong> Composez le numéro d’urgence indiqué dans la rubrique « Paramètres → Informations d’urgence ».</span>
      </div>

      <div class="card raised inbox">
        <!-- Conversation list -->
        <aside class="list-pane" [class.hidden-mob]="!!active()">
          <div class="pane-head">
            <div class="search">
              <ui-icon name="search" [size]="15" />
              <input type="search" [(ngModel)]="q" (ngModelChange)="query.set($event)"
                     placeholder="Rechercher…" aria-label="Rechercher une conversation" />
            </div>
          </div>
          @if (!threads().length) {
            <ui-empty title="Aucune conversation" text="Aucun résultat pour cette recherche." />
          } @else {
            @for (c of threads(); track c.id) {
              <button type="button" class="thread" [class.on]="activeId() === c.id" (click)="activeId.set(c.id)">
                <ui-avatar [name]="c.doctor" size="sm" [presence]="c.online" />
                <span class="tx">
                  <span class="r1"><b>{{ c.doctor }}</b><small class="faint">{{ rel(c.lastAt) }}</small></span>
                  <span class="r2">{{ last(c) }}</span>
                </span>
                @if (c.unread) { <span class="unread">{{ c.unread }}</span> }
              </button>
            }
          }
        </aside>

        <!-- Thread -->
        <section class="thread-pane" [class.hidden-mob]="!active()">
          @if (active(); as c) {
            <header class="pane-head row">
              <button type="button" class="btn quiet sm icon back" (click)="activeId.set('')" aria-label="Retour">
                <ui-icon name="arrowLeft" [size]="16" />
              </button>
              <ui-avatar [name]="c.doctor" size="sm" [presence]="c.online" />
              <div style="flex:1;min-width:0">
                <b style="font-size:.9rem;display:block">{{ c.doctor }}</b>
                <small class="muted">{{ c.specialty }} · {{ c.online ? 'En ligne' : 'Vu ' + rel(c.lastAt) }}</small>
              </div>
            </header>

            <div class="log">
              @for (m of messages(); track m.id) {
                <div class="bubble-row" [class.me]="m.from === 'me'">
                  <div class="bubble">
                    <p>{{ m.text }}</p>
                    @if (m.attachment; as a) {
                      <span class="att"><ui-icon name="paperclip" [size]="13" /> {{ a.name }} <small>· {{ a.size }}</small></span>
                    }
                    <small class="ts num">{{ hour(m.at) }}</small>
                  </div>
                </div>
              }
            </div>

            <form class="composer" (ngSubmit)="send()">
              <button type="button" class="btn quiet icon" (click)="attach()" aria-label="Joindre un fichier">
                <ui-icon name="paperclip" [size]="17" />
              </button>
              <input [(ngModel)]="draft" name="m" placeholder="Écrire un message…" aria-label="Votre message" autocomplete="off" />
              <button type="submit" class="btn icon" [disabled]="!draft.trim()" aria-label="Envoyer">
                <ui-icon name="send" [size]="16" />
              </button>
            </form>
          } @else {
            <ui-empty title="Sélectionnez une conversation" text="Choisissez un échange dans la liste pour l’afficher." />
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .messages-page { max-width: 1180px; }
    .inbox { display: grid; grid-template-columns: 320px minmax(0,1fr); height: min(640px, calc(100vh - 260px)); overflow: hidden; }
    .list-pane { border-right: 1px solid var(--line); display: flex; flex-direction: column; overflow-y: auto; }
    .pane-head { padding: 13px 14px; border-bottom: 1px solid var(--line); flex: none; }
    .thread {
      display: flex; align-items: center; gap: 11px; width: 100%; padding: 12px 14px; text-align: left;
      background: none; border: none; border-bottom: 1px solid var(--line); cursor: pointer; font: inherit;
    }
    .thread:hover { background: var(--surface-2); }
    .thread.on { background: var(--primary-soft); }
    .thread .tx { flex: 1; min-width: 0; }
    .thread .r1 { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
    .thread .r1 b { font-size: .88rem; }
    .thread .r1 small { font-size: .72rem; flex: none; }
    .thread .r2 { display: block; font-size: .8rem; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .thread .unread { min-width: 19px; height: 19px; padding: 0 6px; border-radius: 999px; background: var(--primary);
                      color: #fff; font-size: .7rem; font-weight: 700; display: grid; place-items: center; flex: none; }
    .thread-pane { display: flex; flex-direction: column; min-width: 0; }
    .log { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; background: var(--surface-2); }
    .bubble-row { display: flex; }
    .bubble-row.me { justify-content: flex-end; }
    .bubble { max-width: 74%; padding: 10px 13px; border-radius: 14px; background: var(--surface);
              border: 1px solid var(--line); border-bottom-left-radius: 5px; }
    .bubble-row.me .bubble { background: var(--primary); border-color: var(--primary); color: #fff;
                             border-bottom-left-radius: 14px; border-bottom-right-radius: 5px; }
    .bubble p { font-size: .88rem; line-height: 1.5; }
    .bubble .ts { display: block; margin-top: 4px; font-size: .7rem; opacity: .65; text-align: right; }
    .att { display: inline-flex; align-items: center; gap: 6px; margin-top: 7px; padding: 6px 10px;
           border-radius: var(--r-xs); background: var(--surface-2); color: var(--ink-2); font-size: .78rem; font-weight: 600; }
    .bubble-row.me .att { background: rgba(255,255,255,.16); color: #fff; }
    .composer { display: flex; gap: 8px; padding: 12px 14px; border-top: 1px solid var(--line); align-items: center; }
    .composer input { flex: 1; }
    .back { display: none; }
    @media (max-width: 860px) {
      .inbox { grid-template-columns: 1fr; height: calc(100vh - 300px); }
      .list-pane { border-right: none; }
      .hidden-mob { display: none; }
      .back { display: grid; }
    }
  `],
})
export class Messages {
  protected q = '';
  protected query = signal('');
  protected activeId = signal(CONVERSATIONS[0]?.id ?? '');
  protected draft = '';
  private extra = signal<Message[]>([]);

  protected threads = computed(() => {
    const term = this.query().trim().toLowerCase();
    return CONVERSATIONS.filter(c =>
      !term || c.doctor.toLowerCase().includes(term) || c.specialty.toLowerCase().includes(term));
  });

  protected active = computed<Conversation | undefined>(() =>
    CONVERSATIONS.find(c => c.id === this.activeId()));

  protected messages = computed<Message[]>(() => {
    const c = this.active();
    return c ? [...c.messages, ...this.extra().filter(m => m.id.startsWith(c.id))] : [];
  });

  protected last(c: Conversation) {
    return c.messages[c.messages.length - 1]?.text ?? '';
  }

  protected send() {
    const text = this.draft.trim();
    const c = this.active();
    if (!text || !c) return;
    this.extra.update(l => [...l, { id: `${c.id}-x${l.length}`, from: 'me', text, at: new Date().toISOString() }]);
    this.draft = '';
  }

  protected attach() { window.alert('La pièce jointe est simulée dans ce prototype.'); }
  protected rel = relative;
  protected hour = time;
}
