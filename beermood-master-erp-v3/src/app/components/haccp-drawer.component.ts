import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GiantLine } from '../models/erp.models';

@Component({
  selector: 'app-haccp-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen() && line(); as c) {
      <div class="drawer-backdrop" (click)="closed.emit()"></div>
      <aside class="drawer-box">
        <header class="drawer-head">
          <div>
            <span class="plu-tag">{{ c.plu }} • {{ c.brand }}</span>
            <h2 style="margin:4px 0 0 0; font-size:16px; color:#fff;">{{ c.name }}</h2>
            <div style="font-size:11.5px; color:var(--muted);">Оборудование: {{ c.equipment }}</div>
          </div>
          <button class="btn btn-outline btn-sm" (click)="closed.emit()">✕ Закрыть</button>
        </header>

        <div class="drawer-content">
          <div style="display:flex; justify-content:space-between; font-size:12px;">
            <strong>Треккинг выполнения технологической карты ХАССП:</strong>
            <span style="font-weight:800; color:var(--amber);">{{ progressPct() }}%</span>
          </div>
          <div class="prog-bg"><div class="prog-fill" [style.width.%]="progressPct()"></div></div>

          <div class="card" style="padding:10px 12px; font-size:11.5px;">
            <div><strong>📦 Фасовка и хранение:</strong> {{ c.packG }} г | Режим: {{ c.temp }} | Срок: {{ c.shelfDays }} суток</div>
            <div style="margin-top:4px; color:#d2a8ff;"><strong>🔄 Защита от затоваривания:</strong> {{ c.pivotAction }}</div>
          </div>

          <h4 style="margin:12px 0 6px 0; color:var(--amber);">🥩 Норма закладки сырья на партию:</h4>
          <table class="mini-table" style="margin-bottom:14px;">
            <thead><tr><th>Сырье / Ингредиент</th><th>Норма на замес</th></tr></thead>
            <tbody>
              @for (r of c.rawNorms; track r.name) {
                <tr><td><strong>{{ r.name }}</strong></td><td>{{ r.qty }}</td></tr>
              }
            </tbody>
          </table>

          <h4 style="margin:12px 0 8px 0; color:#7ee787;">📋 Пошаговый операционный контроль (ККТ ХАССП):</h4>
          @for (st of c.steps; track st.id) {
            <div class="step-card" [class.done]="st.done" (click)="toggleStep(st.id)">
              <div style="display:flex; align-items:center; gap:8px; font-weight:700;">
                <input type="checkbox" [checked]="st.done" (click)="$event.stopPropagation()" (change)="toggleStep(st.id)">
                <span [style.textDecoration]="st.done ? 'line-through' : 'none'">Шаг {{ st.id }}. {{ st.title }}</span>
              </div>
              <div style="font-size:11.5px; color:var(--muted); margin:4px 0 0 24px;">{{ st.desc }}</div>
              <div style="margin:5px 0 0 24px; display:flex; gap:6px; flex-wrap:wrap;">
                @if (st.ccp) { <span class="pill pill-crit">🛡️ {{ st.ccp }}</span> }
                @if (st.tempTime) { <span class="pill pill-ok">⏱️ {{ st.tempTime }}</span> }
              </div>
            </div>
          }
        </div>

        <footer class="drawer-foot">
          <button class="btn btn-green" style="width:100%;" (click)="goToPrint.emit(c.plu)">
            🖨️ Партия выполнена: Перейти к печати этикетки Вариант №2 (TSC TE310) →
          </button>
        </footer>
      </aside>
    }
  `,
  styles: [`
    .drawer-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:999; }
    .drawer-box { position:fixed; top:0; right:0; width:560px; max-width:92vw; height:100vh; background:#121820; border-left:1px solid var(--border); z-index:1000; display:flex; flex-direction:column; box-shadow:-8px 0 30px rgba(0,0,0,0.7); }
    .drawer-head, .drawer-foot { padding:14px 18px; background:#0b0f14; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
    .drawer-foot { border-top:1px solid var(--border); border-bottom:none; }
    .drawer-content { padding:16px 18px; overflow-y:auto; flex:1; }
    .prog-bg { width:100%; height:8px; background:#1c2430; border-radius:4px; overflow:hidden; margin:6px 0 14px 0; }
    .prog-fill { height:100%; background:linear-gradient(90deg,#f0883e,#2ea043); transition:width 0.25s; }
    .step-card { background:var(--panel); border:1px solid var(--border); border-radius:8px; padding:10px 12px; margin-bottom:8px; cursor:pointer; }
    .step-card.done { border-color:var(--green); background:rgba(46,160,67,0.08); }
  `]
})
export class HaccpDrawerComponent {
  isOpen = input.required<boolean>();
  line = input<GiantLine>();
  closed = output<void>();
  stepChanged = output<void>();
  goToPrint = output<string>();

  progressPct(): number {
    const l = this.line();
    if (!l || !l.steps.length) return 0;
    return Math.round((l.steps.filter(s => s.done).length / l.steps.length) * 100);
  }
  toggleStep(id: number): void {
    const l = this.line();
    const s = l?.steps.find(x => x.id === id);
    if (s) { s.done = !s.done; this.stepChanged.emit(); }
  }
}
