import { Component, input } from '@angular/core';
@Component({
  selector: 'app-kpi-badge',
  standalone: true,
  template: `
    <div class="kpi-box">
      <div class="k-title">{{ title() }}</div>
      <div class="k-val" [style.color]="valColor()">{{ value() }}</div>
      <div class="k-sub">{{ subtitle() }}</div>
    </div>
  `,
  styles: [`
    .kpi-box { background:var(--panel); border:1px solid var(--border); padding:11px 14px; border-radius:8px; }
    .k-title { color:var(--muted); font-size:11px; text-transform:uppercase; }
    .k-val { font-size:16.5px; font-weight:800; margin-top:4px; color:#fff; }
    .k-sub { font-size:11px; color:#58a6ff; margin-top:2px; }
  `]
})
export class KpiBadgeComponent {
  title = input.required<string>();
  value = input.required<string>();
  subtitle = input<string>('');
  valColor = input<string>('#ffffff');
}
