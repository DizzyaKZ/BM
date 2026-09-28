import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterErpService } from '../../services/master-erp.service';

@Component({
  selector: 'app-matrix-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="drawer-backdrop" *ngIf="erp.isMatrixDrawerOpen()" (click)="erp.isMatrixDrawerOpen.set(false)">
      <div class="drawer-box" (click)="$event.stopPropagation()">
        <div class="drawer-header">
          <div>
            <div class="header-badges">
              <span class="badge badge-amber">СТ РК / ГОСТ ⇄ Немецкий стандарт Коха</span>
              <span class="badge badge-cyan">Сезон Осень 2026: Рынок Алматы</span>
            </div>
            <h3>Матрица соответствия сортов мясного сырья (Алматы 2026)</h3>
          </div>
          <button class="btn-close" (click)="erp.isMatrixDrawerOpen.set(false)">✕</button>
        </div>

        <div class="drawer-content">
          <div class="drawer-summary-bar">
            <span>🥩 <strong>Аналитика отрубов:</strong> Индикаторы цен за последние 30 дней и прогноз тенденций на месяц вперед (октябрь-ноябрь 2026).</span>
          </div>

          <div class="table-container">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th>Код</th>
                  <th>Стандарт Коха</th>
                  <th>Рынок Алматы (РК)</th>
                  <th>Халяль эквивалент</th>
                  <th>Цена РК (₸)</th>
                  <th>Цена Halal (₸)</th>
                  <th>Динамика</th>
                  <th>Тенденция на 1 месяц</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of meatList">
                  <td class="font-mono text-amber font-bold">{{ item.code }}</td>
                  <td class="col-desc">{{ item.de }}</td>
                  <td class="col-desc"><strong>{{ item.kz }}</strong></td>
                  <td class="col-desc text-cyan">{{ item.halal }}</td>
                  <td class="font-mono font-bold">{{ item.kzt | number }} ₸</td>
                  <td class="font-mono text-emerald font-bold">{{ item.halalKzt | number }} ₸</td>
                  <td>
                    <span class="trend-badge" [ngClass]="{
                      'trend-up': item.priceChangeTrend === 'UP',
                      'trend-down': item.priceChangeTrend === 'DOWN',
                      'trend-stable': item.priceChangeTrend === 'STABLE'
                    }">
                      {{ item.priceChangeTrend === 'UP' ? '▲ +' + item.priceChangePct + '%' : item.priceChangeTrend === 'DOWN' ? '▼ ' + item.priceChangePct + '%' : '▬ 0.0%' }}
                    </span>
                  </td>
                  <td>
                    <div class="forecast-block">
                      <span class="forecast-badge" [ngClass]="{
                        'fc-up': item.priceChangeTrend === 'UP',
                        'fc-down': item.priceChangeTrend === 'DOWN',
                        'fc-stable': item.priceChangeTrend === 'STABLE'
                      }">{{ item.forecast30d }}</span>
                      <small class="forecast-comment">{{ item.forecastComment }}</small>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      z-index: 150;
      display: flex;
      justify-content: flex-end;
    }
    .drawer-box {
      background: var(--bg-surface-elevated);
      width: 100%;
      max-width: 1100px;
      height: 100%;
      box-shadow: -4px 0 35px rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--border-strong);
    }
    .drawer-header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--bg-card);
    }
    .header-badges {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }
    .drawer-header h3 {
      font-size: 1.18rem;
      margin: 0;
      color: #fff;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
    }
    .btn-close:hover {
      color: var(--accent-ruby);
    }
    .drawer-content {
      padding: 20px 24px;
      overflow-y: auto;
      flex: 1;
    }
    .drawer-summary-bar {
      background: var(--bg-surface);
      border-left: 4px solid var(--accent-amber);
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 0.82rem;
      color: var(--text-secondary);
      margin-bottom: 18px;
    }
    .table-container {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      background: var(--bg-card);
    }
    .matrix-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.76rem;
    }
    .matrix-table th, .matrix-table td {
      border: 1px solid var(--border-subtle);
      padding: 9px 11px;
      text-align: left;
      vertical-align: middle;
    }
    .matrix-table th {
      background: var(--bg-surface);
      color: var(--accent-amber);
      font-weight: 700;
      white-space: nowrap;
      text-transform: uppercase;
      font-size: 0.70rem;
    }
    .matrix-table tr:hover {
      background: rgba(255, 255, 255, 0.03);
    }
    .col-desc {
      font-size: 0.74rem;
      line-height: 1.35;
      min-width: 130px;
    }
    .trend-badge {
      display: inline-block;
      padding: 3px 6px;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 700;
      font-family: var(--font-mono);
      white-space: nowrap;
    }
    .trend-up {
      background: var(--accent-ruby-soft);
      color: var(--accent-ruby);
    }
    .trend-down {
      background: var(--accent-emerald-soft);
      color: var(--accent-emerald);
    }
    .trend-stable {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-muted);
    }
    .forecast-block {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 170px;
    }
    .forecast-badge {
      font-weight: 700;
      font-size: 0.73rem;
    }
    .fc-up { color: var(--accent-gold); }
    .fc-down { color: var(--accent-emerald); }
    .fc-stable { color: var(--text-secondary); }
    .forecast-comment {
      font-size: 0.68rem;
      color: var(--text-muted);
      line-height: 1.3;
    }
    .text-amber { color: var(--accent-amber); }
    .text-cyan { color: var(--accent-cyan); }
    .text-emerald { color: var(--accent-emerald); }
    .font-bold { font-weight: 700; }
  `]
})
export class MatrixDrawerComponent {
  erp = inject(MasterErpService);

  get meatList() {
    return Object.values(this.erp.meatStandards());
  }
}
