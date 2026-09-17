import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { Toasts } from '../core/toast';
import { initials } from '../core/format';
import type { Status } from '../core/models';

/** Circular initials avatar. */
@Component({
  selector: 'ui-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="avatar-wrap">
      <span class="avatar" [ngClass]="[size, tone]" aria-hidden="true">{{ short }}</span>
      @if (presence !== null) { <i class="presence" [class.on]="presence"></i> }
    </span>
  `,
  imports: [NgClass],
})
export class UiAvatar {
  @Input({ required: true }) set name(v: string | null | undefined) { this.short = initials(v); }
  @Input() size: '' | 'xs' | 'sm' | 'lg' | 'xl' = '';
  @Input() tone: '' | 'mint' | 'neutral' = '';
  @Input() presence: boolean | null = null;
  protected short = '?';
}

/** Appointment status pill — maps the backend Status enum to a tone. */
@Component({
  selector: 'ui-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge ' + cls"><i class="dot"></i>{{ text }}</span>`,
})
export class UiStatus {
  @Input({ required: true }) set status(v: Status | null | undefined) {
    switch (v) {
      case 'APPROVED': this.cls = 'b-ok'; this.text = 'Confirmé'; break;
      case 'REJECTED': this.cls = 'b-err'; this.text = 'Refusé'; break;
      case 'PENDING': this.cls = 'b-warn'; this.text = 'En attente'; break;
      default: this.cls = ''; this.text = 'Inconnu';
    }
  }
  protected cls = '';
  protected text = '';
}

/** Empty state with an optional call to action. */
@Component({
  selector: 'ui-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <span class="ico" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
        </svg>
      </span>
      <h3>{{ title }}</h3>
      <p>{{ text }}</p>
      <ng-content></ng-content>
    </div>
  `,
})
export class UiEmpty {
  @Input({ required: true }) title = '';
  @Input() text = '';
}

/** Shimmering placeholder rows used while a request is in flight. */
@Component({
  selector: 'ui-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (r of rows(); track $index) {
      <div class="skel" [style.height.px]="height" [style.width]="$last ? '62%' : '100%'"
           [style.margin-bottom.px]="$last ? 0 : gap"></div>
    }
  `,
})
export class UiSkeleton {
  @Input() count = 3;
  @Input() height = 16;
  @Input() gap = 10;
  protected rows() { return Array.from({ length: this.count }); }
}

/** Accessible modal dialog. Closes on backdrop click and Escape. */
@Component({
  selector: 'ui-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="backdrop" (click)="close.emit()" (keydown.escape)="close.emit()" tabindex="-1">
      <div class="modal" [class.wide]="wide" role="dialog" aria-modal="true" [attr.aria-label]="heading"
           (click)="$event.stopPropagation()">
        <header class="modal-head">
          <div>
            <h2>{{ heading }}</h2>
            @if (sub) { <p class="muted" style="font-size:.86rem;margin-top:3px">{{ sub }}</p> }
          </div>
          <button type="button" class="btn quiet sm icon" (click)="close.emit()" aria-label="Fermer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </header>
        <div class="modal-body"><ng-content></ng-content></div>
        <ng-content select="[foot]"></ng-content>
      </div>
    </div>
  `,
})
export class UiModal {
  @Input({ required: true }) heading = '';
  @Input() sub = '';
  @Input() wide = false;
  @Output() close = new EventEmitter<void>();
}

/** Global toast outlet, mounted once in the app shell. */
@Component({
  selector: 'ui-toasts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-host" role="status" aria-live="polite">
      @for (t of toasts.items(); track t.id) {
        <div class="toast" [class]="'toast t-' + t.kind">
          <div style="flex:1">
            <div class="t-title">{{ t.title }}</div>
            @if (t.msg) { <div class="t-msg">{{ t.msg }}</div> }
          </div>
          <button type="button" class="t-x" (click)="toasts.dismiss(t.id)" aria-label="Fermer la notification">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class UiToasts {
  protected toasts = inject(Toasts);
}

/** Confirmation dialog for destructive actions. */
@Component({
  selector: 'ui-confirm',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UiModal],
  template: `
    <ui-modal [heading]="heading" [sub]="sub" (close)="cancel.emit()">
      <p style="font-size:.93rem;line-height:1.6">{{ body }}</p>
      <div foot class="modal-foot">
        <button type="button" class="btn secondary" (click)="cancel.emit()">Annuler</button>
        <button type="button" class="btn" [class.danger]="danger" (click)="confirm.emit()">{{ action }}</button>
      </div>
    </ui-modal>
  `,
})
export class UiConfirm {
  @Input() heading = 'Confirmer';
  @Input() sub = '';
  @Input() body = 'Cette action est définitive.';
  @Input() action = 'Confirmer';
  @Input() danger = true;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

/** Minimal inline sparkline — one path, no charting dependency. */
@Component({
  selector: 'ui-spark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="w" [attr.height]="h" [attr.viewBox]="'0 0 ' + w + ' ' + h" aria-hidden="true"
         preserveAspectRatio="none" style="display:block;overflow:visible">
      <path [attr.d]="area" [attr.fill]="color" opacity=".10"/>
      <path [attr.d]="line" fill="none" [attr.stroke]="color" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
})
export class UiSpark {
  @Input() w = 96;
  @Input() h = 30;
  @Input() color = 'var(--primary-600)';
  @Input({ required: true }) set data(values: number[]) {
    const v = values?.length ? values : [0, 0];
    const min = Math.min(...v), max = Math.max(...v);
    const span = max - min || 1;
    const step = v.length > 1 ? this.w / (v.length - 1) : this.w;
    const pts = v.map((n, i) => [i * step, this.h - ((n - min) / span) * (this.h - 4) - 2] as const);
    this.line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    this.area = `${this.line} L${this.w} ${this.h} L0 ${this.h} Z`;
  }
  protected line = '';
  protected area = '';
}
