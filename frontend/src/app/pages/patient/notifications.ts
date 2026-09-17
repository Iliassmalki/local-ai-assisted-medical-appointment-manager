import { Component, computed, signal } from '@angular/core';
import { NOTIFICATIONS, NOTIF_CATEGORIES, type Notification } from '../../core/mock/inbox';
import { relative } from '../../core/format';
import { Icon } from '../../ui/icon';
import { UiEmpty } from '../../ui/ui';

@Component({
  selector: 'app-patient-notifications',
  imports: [Icon, UiEmpty],
  template: `
    <div class="page" style="max-width:860px">
      <header class="page-head between">
        <div>
          <h1>Notifications</h1>
          <p>{{ unread() }} notification(s) non lue(s).</p>
        </div>
        <button type="button" class="btn secondary" [disabled]="!unread()" (click)="markAll()">
          <ui-icon name="check" [size]="15" /> Tout marquer comme lu
        </button>
      </header>

      <div class="row wrap mb-2" style="gap:7px">
        <button type="button" class="chip" [class.on]="!cat()" (click)="cat.set('')">Toutes</button>
        @for (c of categories; track c) {
          <button type="button" class="chip" [class.on]="cat() === c" (click)="cat.set(c)">{{ c }}</button>
        }
      </div>

      <div class="card">
        @if (!rows().length) {
          <ui-empty title="Aucune notification" text="Vous êtes à jour." />
        } @else {
          <div class="list">
            @for (n of rows(); track n.id) {
              <div class="list-item" [class.unread]="!n.read" style="align-items:flex-start">
                <span class="ic" [attr.data-c]="n.category"><ui-icon [name]="icon(n.category)" [size]="15" /></span>
                <div style="flex:1;min-width:0">
                  <div class="row between" style="gap:10px;align-items:baseline">
                    <span class="title">{{ n.title }}</span>
                    <small class="faint nowrap">{{ rel(n.at) }}</small>
                  </div>
                  <div class="meta">{{ n.body }}</div>
                </div>
                @if (!n.read) {
                  <button type="button" class="btn sm quiet" (click)="markOne(n)">Marquer lu</button>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .list-item.unread { background: var(--primary-soft); }
    .list-item.unread .title::before {
      content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%;
      background: var(--primary); margin-right: 7px; vertical-align: middle;
    }
    .ic { width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center; flex: none;
          background: var(--surface-2); border: 1px solid var(--line); color: var(--ink-2); }
    .ic[data-c=Analyses] { background: var(--info-soft); color: var(--info); border-color: #cfe0ea; }
    .ic[data-c=Messages] { background: var(--mint-soft); color: #3f7a5f; border-color: #cbe3d6; }
    .ic[data-c='Rendez-vous'] { background: var(--primary-soft); color: var(--primary-700); border-color: var(--primary-line); }
  `],
})
export class PatientNotifications {
  protected categories = NOTIF_CATEGORIES;
  protected cat = signal('');
  private items = signal<Notification[]>(NOTIFICATIONS.map(n => ({ ...n })));

  protected rows = computed(() =>
    this.items().filter(n => !this.cat() || n.category === this.cat())
      .sort((a, b) => b.at.localeCompare(a.at)));

  protected unread = computed(() => this.items().filter(n => !n.read).length);

  protected markOne(n: Notification) {
    this.items.update(l => l.map(x => (x.id === n.id ? { ...x, read: true } : x)));
  }
  protected markAll() {
    this.items.update(l => l.map(x => ({ ...x, read: true })));
  }

  protected icon(c: string) {
    return c === 'Analyses' ? 'flask' : c === 'Messages' ? 'chat'
      : c === 'Rendez-vous' ? 'calendar' : c === 'Dossier médical' ? 'folder' : 'gear';
  }
  protected rel = relative;
}
