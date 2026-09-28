import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterErpService } from '../../services/master-erp.service';

@Component({
  selector: 'app-kpi-strip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="kpi-strip">
      <div class="container kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Сумма заказов сегодня (ЖК «Арай»)</div>
          <div class="kpi-value text-emerald">
            {{ erp.formatMoney(erp.globalKpi().todayRevenueKzt) }}
          </div>
          <div class="kpi-foot">
            {{ erp.globalKpi().araiOrdersPending }} активных заказов на сборку/доставку
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Прогноз EBITDA на октябрь 2026</div>
          <div class="kpi-value text-gold">
            +{{ erp.formatMoney(erp.globalKpi().monthlyProjectedEbitdaKzt) }}
          </div>
          <div class="kpi-foot">
            Операционная рентабельность 19.8% (с учетом аренды)
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Принято сырого молока («Эксперт Профи»)</div>
          <div class="kpi-value text-cyan">
            {{ erp.globalKpi().milkProcessedLiters }} литров
          </div>
          <div class="kpi-foot">
            100% сортовое молоко на сыр, творог и сыворотку
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-label">Рекомендации по ценам & сырью</div>
          <div class="kpi-value text-amber">
            {{ erp.globalKpi().activeRecommendationsCount }} готово к синхронизации
          </div>
          <div class="kpi-foot">
            Средняя наценка линейки: {{ erp.globalKpi().averageMarkupPct | number:'1.0-1' }}%
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .kpi-strip {
      padding: 14px 0;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
    }
    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px 16px;
      transition: border-color 0.16s ease;
    }
    .kpi-card:hover { border-color: var(--border-strong); }
    .kpi-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 1.3rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 4px;
      font-family: var(--font-sans);
    }
    .kpi-foot { font-size: 0.74rem; color: var(--text-secondary); }
    .text-emerald { color: var(--accent-emerald); }
    .text-cyan { color: var(--accent-cyan); }
    .text-amber { color: var(--accent-amber); }
    .text-gold { color: var(--accent-gold); }
  `]
})
export class KpiStripComponent {
  erp = inject(MasterErpService);
}
