import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from '../../services/master-erp.service';
import { RawMaterialMarketPrice, SectorFilter } from '../../models/market-intelligence.model';
import { StandardMode } from '../../models/koch.model';

type SubView = 'FORECASTS' | 'RAW_PRICES' | 'BENCHMARKS' | 'RECOMMENDATIONS';

@Component({
  selector: 'app-market-intelligence',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-wrapper">
      <div class="module-header">
        <div>
          <h2>📊 Сквозной мониторинг цен сырья и продукции • AI-аналитика MOOD GROUP</h2>
          <p class="subtitle">
            Операционный мониторинг рынка Алматы 2026: Мясной цех • Сыроварня CHEESY • Пекарня BAKE • Лаборатория соусов SPICY LAB • Ресторан BEERMOOD.PUB.
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-emerald" (click)="applyAllRecs()" [disabled]="unappliedRecsCount === 0">
            ⚡ Применить рекомендации ({{ unappliedRecsCount }})
          </button>
        </div>
      </div>

      <!-- Main Navigation Tabs -->
      <div class="sub-nav">
        <button class="sub-btn" [class.active]="activeSubView() === 'FORECASTS'" (click)="activeSubView.set('FORECASTS')">
          📈 P&L и Сводные прогнозы
        </button>
        <button class="sub-btn" [class.active]="activeSubView() === 'RAW_PRICES'" (click)="activeSubView.set('RAW_PRICES')">
          🥩🧀🥖🌶️ Сырье: Котировки Алматы и Прогноз на месяц
        </button>
        <button class="sub-btn" [class.active]="activeSubView() === 'BENCHMARKS'" (click)="activeSubView.set('BENCHMARKS')">
          🛒 Готовая продукция vs Конкуренты (Galmart / Paul / Magnum)
        </button>
        <button class="sub-btn" [class.active]="activeSubView() === 'RECOMMENDATIONS'" (click)="activeSubView.set('RECOMMENDATIONS')">
          💡 AI-рекомендации и Синхронизация
        </button>
      </div>

      <!-- Sector Filter Toolbar (shown for RAW, BENCHMARKS, RECS) -->
      <div class="sector-bar" *ngIf="activeSubView() !== 'FORECASTS'">
        <span class="sector-lbl">Производственный сектор:</span>
        <button class="sector-btn" [class.active]="erp.selectedMarketSector() === 'ALL'" (click)="setSector('ALL')">
          Все секторы ({{ erp.rawMaterialPrices().length }})
        </button>
        <button class="sector-btn sec-btn-meat" [class.active]="erp.selectedMarketSector() === 'MEAT'" (click)="setSector('MEAT')">
          🥩 Мясо и колбасы
        </button>
        <button class="sector-btn" [class.active]="erp.selectedMarketSector() === 'DAIRY'" (click)="setSector('DAIRY')">
          🧀 Молоко и сыры (CHEESY)
        </button>
        <button class="sector-btn" [class.active]="erp.selectedMarketSector() === 'BAKERY'" (click)="setSector('BAKERY')">
          🥖 Хлеб и пекарня (BAKE)
        </button>
        <button class="sector-btn" [class.active]="erp.selectedMarketSector() === 'SAUCES_SPICES'" (click)="setSector('SAUCES_SPICES')">
          🌶️ Соусы и смеси (SPICY LAB)
        </button>
      </div>

      <!-- Dedicated Meat Standards Switcher & Matrix Button (Shown ONLY when Sector is MEAT) -->
      <div class="meat-standards-toolbar" *ngIf="erp.selectedMarketSector() === 'MEAT' && activeSubView() !== 'FORECASTS'">
        <div class="std-switcher-zone">
          <span class="std-zone-title">Сорта мяса (Классификация):</span>
          <div class="std-btn-group">
            <button
              class="std-mode-btn"
              [class.active]="erp.stdMode() === 'kz'"
              (click)="setMeatStandard('kz')"
              title="Стандарт Казахстана: СТ РК, жилованная говядина и свинина"
            >
              🇰🇿 СТ РК (Алматы: Говядина / Свинина)
            </button>
            <button
              class="std-mode-btn"
              [class.active]="erp.stdMode() === 'halal'"
              (click)="setMeatStandard('halal')"
              title="Халяль-стандарт: Конина Жая / Казы / Жал"
            >
              🌙 Халяль-стандарт (Конина Жая / Казы / Жал)
            </button>
            <button
              class="std-mode-btn"
              [class.active]="erp.stdMode() === 'de'"
              (click)="setMeatStandard('de')"
              title="Немецкий стандарт Германа Коха: R 1–R 7, S 1–S 8"
            >
              🇩🇪 Стандарт Г. Коха (R 1–R 7 / S 1–S 8)
            </button>
          </div>
        </div>

        <button class="btn btn-matrix-inline" (click)="erp.isMatrixDrawerOpen.set(true)" title="Открыть полную матрицу соответствия сортов мяса">
          📋 Матрица сортов мяса
        </button>
      </div>

      <!-- Success Notification Banner -->
      <div class="sync-banner" *ngIf="syncSuccessMsg()">
        <span>✓ {{ syncSuccessMsg() }}</span>
      </div>

      <!-- 1. P&L FORECASTS -->
      <section *ngIf="activeSubView() === 'FORECASTS'" class="forecasts-grid">
        <div class="forecast-card" *ngFor="let p of erp.financialForecasts()">
          <div class="f-head">
            <span class="badge badge-amber font-mono font-bold">{{ p.periodLabel }}</span>
            <span class="badge badge-emerald">EBITDA: {{ p.ebitdaMarginPct }}%</span>
          </div>
          <div class="f-section">
            <div class="f-row"><span>BEERMOOD.PUB (кухня/бар):</span><strong>{{ erp.formatMoney(p.revenuePubKzt) }}</strong></div>
            <div class="f-row"><span>Takeaway & Вендинг 24/7:</span><strong>{{ erp.formatMoney(p.revenueTakeawayKzt) }}</strong></div>
            <div class="f-row"><span>Доставка ЖК «Арай»:</span><strong class="text-cyan">{{ erp.formatMoney(p.revenueAraiDeliveryKzt) }}</strong></div>
            <div class="f-row total-row"><span>ИТОГО ВЫРУЧКА:</span><strong class="text-gold font-bold">{{ erp.formatMoney(p.totalRevenueKzt) }}</strong></div>
          </div>
          <div class="f-section">
            <div class="f-row"><span>Себестоимость сырья:</span><span>{{ erp.formatMoney(p.rawMaterialCogsKzt) }}</span></div>
            <div class="f-row"><span>Упаковка и расходники:</span><span>{{ erp.formatMoney(p.packagingAndConsumablesKzt) }}</span></div>
            <div class="f-row text-emerald font-bold"><span>Валовая прибыль ({{ p.grossMarginPct }}%):</span><span>+{{ erp.formatMoney(p.grossProfitKzt) }}</span></div>
          </div>
          <div class="f-bottom">
            <div>Операционная прибыль (EBITDA): <strong class="text-emerald">+{{ erp.formatMoney(p.ebitdaKzt) }}</strong></div>
            <div class="breakeven-sub">Точка безубыточности: {{ erp.formatMoney(p.breakevenRevenueKzt) }} ({{ p.breakevenBatchesKg }} кг/мес)</div>
          </div>
        </div>
      </section>

      <!-- 2. RAW MATERIAL PRICES (MULTI-SECTOR) -->
      <section *ngIf="activeSubView() === 'RAW_PRICES'" class="table-card">
        <div class="table-meta-bar">
          <div>
            <span>Найдено позиций сырья: <strong>{{ filteredRawMaterials().length }}</strong></span>
            <span *ngIf="erp.selectedMarketSector() === 'MEAT'" class="active-std-tag">
              Активный стандарт мяса:
              <strong class="text-gold">
                {{ erp.stdMode() === 'kz' ? 'Казахстан (СТ РК)' : erp.stdMode() === 'halal' ? 'Халяль (Конина Жая/Казы)' : 'Германия (Г. Кох)' }}
              </strong>
            </span>
          </div>
          <span class="text-muted">Мониторинг обновлен: сентябрь–октябрь 2026 г.</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Сектор</th>
              <th>Код</th>
              <th>Сырьевой компонент</th>
              <th>Закупка в ERP</th>
              <th>Рынок Алматы</th>
              <th>Динамика (30 дн)</th>
              <th>Тенденция на 1 месяц (Прогноз)</th>
              <th>Поставщик / Источник</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let raw of filteredRawMaterials()">
              <td>
                <span class="sector-pill" [ngClass]="'sec-' + raw.sector">
                  {{ raw.sector === 'MEAT' ? 'Мясо' : raw.sector === 'DAIRY' ? 'Молоко' : raw.sector === 'BAKERY' ? 'Хлеб' : 'Соусы' }}
                </span>
              </td>
              <td class="font-mono text-amber font-bold">{{ raw.code }}</td>
              <td>
                <div class="raw-name-cell">
                  <strong>{{ getRawDisplayName(raw) }}</strong>
                  <span class="std-badge-inline" *ngIf="raw.sector === 'MEAT'">
                    {{ erp.stdMode() === 'halal' ? '🌙 Halal' : erp.stdMode() === 'kz' ? '🇰🇿 СТ РК' : '🇩🇪 Кох' }}
                  </span>
                </div>
              </td>
              <td>
                <div class="price-edit-box">
                  <input
                    type="number"
                    class="price-input font-mono font-bold"
                    [ngModel]="getRawDisplayCost(raw)"
                    (ngModelChange)="onRawCostInput(raw, $event)"
                  >
                  <span class="unit-txt"> ₸/{{ raw.unit }}</span>
                </div>
              </td>
              <td class="font-mono">{{ getRawMarketAvg(raw) | number }} ₸</td>
              <td>
                <span class="trend-badge" [ngClass]="{
                  'trend-up': raw.trend === 'UP',
                  'trend-down': raw.trend === 'DOWN',
                  'trend-stable': raw.trend === 'STABLE'
                }">
                  {{ raw.trend === 'UP' ? '▲ +' + raw.trendPct + '%' : raw.trend === 'DOWN' ? '▼ ' + raw.trendPct + '%' : '▬ 0.0%' }}
                </span>
              </td>
              <td>
                <div class="forecast-box">
                  <span class="forecast-trend" [ngClass]="{
                    'fc-up': raw.trend === 'UP',
                    'fc-down': raw.trend === 'DOWN',
                    'fc-stable': raw.trend === 'STABLE'
                  }">{{ raw.forecast30d }}</span>
                  <small class="forecast-note">{{ raw.forecastComment }}</small>
                </div>
              </td>
              <td class="text-secondary supplier-cell">{{ raw.supplier }}</td>
              <td>
                <button class="btn-sm btn-outline" (click)="saveRawPrice(raw)">💾 В ERP</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- 3. COMPETITOR BENCHMARKS (MULTI-SECTOR) -->
      <section *ngIf="activeSubView() === 'BENCHMARKS'" class="benchmarks-grid">
        <div class="bench-card" *ngFor="let b of filteredBenchmarks()">
          <div class="b-head">
            <div class="b-badges">
              <span class="sector-pill" [ngClass]="'sec-' + b.sector">
                {{ b.sector === 'MEAT' ? 'Мясо' : b.sector === 'DAIRY' ? 'Молоко' : b.sector === 'BAKERY' ? 'Пекарня' : 'Соусы' }}
              </span>
              <span class="badge badge-amber">{{ b.category }}</span>
              <span class="badge badge-cyan">{{ b.qualityTier }}</span>
            </div>
            <span class="trend-badge" [ngClass]="b.priceGapPct <= 0 ? 'trend-down' : 'trend-up'">
              {{ b.priceGapPct <= 0 ? 'Выгоднее на ' + (b.priceGapPct * -1) + '%' : '+' + b.priceGapPct + '%' }}
            </span>
          </div>

          <h4>{{ b.ourProductTitle }}</h4>

          <div class="b-comparison">
            <div class="comp-line">
              <span>MOOD GROUP (Жарокова 137/1):</span>
              <strong class="text-gold font-mono">{{ erp.formatMoney(b.ourPriceKzt) }}</strong> ({{ b.ourUnit }})
            </div>
            <div class="comp-line">
              <span>{{ b.competitorName }}:</span>
              <strong class="text-secondary font-mono">{{ erp.formatMoney(b.competitorPriceKzt) }}</strong>
            </div>
          </div>

          <div class="b-forecast-line">
            <span class="forecast-trend fc-up">{{ b.forecast30d }}</span>
            <small class="forecast-note">{{ b.forecastComment }}</small>
          </div>

          <p class="b-notes">{{ b.notes }}</p>
        </div>
      </section>

      <!-- 4. AI RECOMMENDATIONS & AUTO-SYNC -->
      <section *ngIf="activeSubView() === 'RECOMMENDATIONS'" class="recs-grid">
        <div class="rec-card" *ngFor="let r of filteredRecommendations()" [class.applied-card]="r.isApplied">
          <div class="rec-head">
            <div class="rec-badges">
              <span class="sector-pill" [ngClass]="'sec-' + r.sector">
                {{ r.sector === 'MEAT' ? 'Мясной цех' : r.sector === 'DAIRY' ? 'Сыроварня' : r.sector === 'BAKERY' ? 'Пекарня' : 'SPICY LAB' }}
              </span>
              <span class="badge" [ngClass]="{
                'badge-ruby': r.priority === 'HIGH',
                'badge-amber': r.priority === 'MEDIUM',
                'badge-emerald': r.priority === 'OPPORTUNITY'
              }">{{ r.priority }}</span>
            </div>
            <span *ngIf="r.isApplied" class="text-emerald font-bold">✓ Применено в ERP</span>
          </div>

          <h4>{{ r.title }}</h4>
          <p class="rec-desc">{{ r.rationale }}</p>

          <div class="rec-values">
            <div class="val-line">Текущий параметр: <strong>{{ r.currentValue | number }} {{ r.unit }}</strong></div>
            <div class="val-line">Рекомендуемый: <strong class="text-gold">{{ r.recommendedValue | number }} {{ r.unit }}</strong></div>
            <div class="val-line">Прогнозируемый эффект: <strong class="text-emerald font-bold">+{{ erp.formatMoney(r.financialImpactKzt) }}/мес</strong></div>
          </div>

          <button class="btn btn-emerald" *ngIf="!r.isApplied" (click)="applySingleRec(r.id)">
            ⚡ Применить к техкартам и ERP
          </button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .module-wrapper { padding: 20px 0 60px; }
    .module-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 14px; }
    .module-header h2 { font-size: 1.35rem; color: #fff; }
    .subtitle { font-size: 0.82rem; color: var(--text-secondary); margin-top: 4px; }
    .sub-nav { display: flex; gap: 6px; background: var(--bg-surface); padding: 6px; border-radius: 8px; margin-bottom: 14px; flex-wrap: wrap; }
    .sub-btn { background: transparent; border: none; color: var(--text-secondary); padding: 8px 14px; font-size: 0.80rem; font-weight: 600; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; }
    .sub-btn:hover { color: #fff; background: var(--bg-surface-elevated); }
    .sub-btn.active { background: var(--accent-amber); color: #fff; font-weight: 700; box-shadow: 0 2px 8px var(--accent-amber-glow); }
    .sector-bar { display: flex; align-items: center; gap: 6px; background: var(--bg-card); padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border-subtle); margin-bottom: 14px; flex-wrap: wrap; }
    .sector-lbl { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-right: 6px; }
    .sector-btn { background: var(--bg-surface); border: 1px solid var(--border-subtle); color: var(--text-secondary); padding: 5px 11px; border-radius: 6px; font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
    .sector-btn:hover { color: #fff; border-color: var(--accent-amber); }
    .sector-btn.active { background: var(--accent-amber-soft); border-color: var(--accent-amber); color: var(--accent-amber); font-weight: 700; }
    .sec-btn-meat.active { border-color: #e74c3c; color: #e74c3c; background: rgba(231, 76, 60, 0.15); }
    .meat-standards-toolbar {
      background: linear-gradient(90deg, rgba(231, 76, 60, 0.12) 0%, rgba(20, 20, 22, 0.95) 100%);
      border: 1px solid rgba(231, 76, 60, 0.35);
      border-left: 4px solid #e74c3c;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .std-switcher-zone { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .std-zone-title { font-size: 0.74rem; font-weight: 700; color: #e74c3c; text-transform: uppercase; }
    .std-btn-group { display: flex; gap: 6px; flex-wrap: wrap; }
    .std-mode-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      color: var(--text-secondary);
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.74rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .std-mode-btn:hover { color: #fff; border-color: #e74c3c; }
    .std-mode-btn.active { background: #e74c3c; color: #fff; border-color: #e74c3c; font-weight: 700; box-shadow: 0 2px 8px rgba(231, 76, 60, 0.4); }
    .btn-matrix-inline {
      background: var(--bg-surface-elevated);
      color: var(--accent-gold);
      border: 1px solid var(--accent-gold);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-matrix-inline:hover { background: var(--accent-gold); color: #000; }
    .sector-pill { padding: 2px 7px; border-radius: 4px; font-size: 0.68rem; font-weight: 800; text-transform: uppercase; }
    .sec-MEAT { background: rgba(231, 76, 60, 0.18); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.35); }
    .sec-DAIRY { background: rgba(52, 152, 219, 0.18); color: #3498db; border: 1px solid rgba(52, 152, 219, 0.35); }
    .sec-BAKERY { background: rgba(241, 196, 15, 0.18); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.35); }
    .sec-SAUCES_SPICES { background: rgba(39, 174, 96, 0.18); color: #2ecc71; border: 1px solid rgba(39, 174, 96, 0.35); }
    .sync-banner { background: var(--accent-emerald-soft); border: 1px solid var(--accent-emerald); color: var(--accent-emerald); padding: 10px 14px; border-radius: 8px; font-size: 0.82rem; margin-bottom: 16px; font-weight: 600; }
    .forecasts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px; }
    .forecast-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 16px; }
    .f-head { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .f-section { background: var(--bg-surface); padding: 10px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 0.78rem; }
    .f-row { display: flex; justify-content: space-between; padding: 2px 0; }
    .total-row { border-top: 1px solid var(--border-subtle); margin-top: 4px; padding-top: 4px; }
    .f-bottom { background: var(--bg-surface-elevated); padding: 10px 12px; border-radius: 6px; font-size: 0.8rem; border-left: 3px solid var(--accent-emerald); }
    .breakeven-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 4px; }
    .table-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; overflow-x: auto; }
    .table-meta-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--border-subtle); font-size: 0.78rem; gap: 10px; flex-wrap: wrap; }
    .active-std-tag { margin-left: 14px; font-size: 0.75rem; background: var(--bg-surface); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border-subtle); }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.78rem; }
    .data-table th, .data-table td { padding: 9px 12px; border-bottom: 1px solid var(--border-subtle); text-align: left; vertical-align: middle; }
    .data-table th { background: var(--bg-surface); color: var(--accent-amber); font-size: 0.70rem; text-transform: uppercase; font-weight: 700; white-space: nowrap; }
    .data-table tr:hover { background: rgba(255, 255, 255, 0.02); }
    .raw-name-cell { display: flex; flex-direction: column; gap: 2px; }
    .std-badge-inline { font-size: 0.65rem; color: var(--accent-gold); font-weight: 700; }
    .price-edit-box { display: flex; align-items: center; gap: 4px; }
    .price-input { width: 85px; background: var(--bg-surface-elevated); border: 1px solid var(--border-strong); color: var(--accent-amber); padding: 4px 6px; border-radius: 4px; }
    .unit-txt { font-size: 0.72rem; color: var(--text-muted); }
    .trend-badge { padding: 3px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 700; font-family: var(--font-mono); white-space: nowrap; }
    .trend-up { background: var(--accent-ruby-soft); color: var(--accent-ruby); }
    .trend-down { background: var(--accent-emerald-soft); color: var(--accent-emerald); }
    .trend-stable { background: rgba(255, 255, 255, 0.06); color: var(--text-muted); }
    .forecast-box { display: flex; flex-direction: column; gap: 2px; min-width: 170px; }
    .forecast-trend { font-weight: 700; font-size: 0.74rem; }
    .fc-up { color: var(--accent-gold); }
    .fc-down { color: var(--accent-emerald); }
    .fc-stable { color: var(--text-secondary); }
    .forecast-note { font-size: 0.68rem; color: var(--text-muted); line-height: 1.3; }
    .supplier-cell { font-size: 0.74rem; line-height: 1.3; max-width: 180px; }
    .benchmarks-grid, .recs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }
    .bench-card, .rec-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; }
    .b-head, .rec-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .b-badges, .rec-badges { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .b-comparison { background: var(--bg-surface); padding: 10px; border-radius: 6px; margin: 8px 0; font-size: 0.78rem; display: flex; flex-direction: column; gap: 5px; }
    .comp-line { display: flex; justify-content: space-between; align-items: center; }
    .b-forecast-line { background: rgba(0, 0, 0, 0.25); padding: 6px 10px; border-radius: 5px; margin-bottom: 8px; display: flex; flex-direction: column; gap: 2px; }
    .b-notes, .rec-desc { font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4; }
    .rec-values { background: var(--bg-surface); padding: 8px 10px; border-radius: 6px; font-size: 0.76rem; display: flex; flex-direction: column; gap: 4px; margin: 10px 0; }
    .val-line { display: flex; justify-content: space-between; }
    .text-emerald { color: var(--accent-emerald); }
    .text-cyan { color: var(--accent-cyan); }
    .text-amber { color: var(--accent-amber); }
    .text-gold { color: var(--accent-gold); }
    .font-bold { font-weight: 700; }
  `]
})
export class MarketIntelligenceComponent {
  erp = inject(MasterErpService);
  activeSubView = signal<SubView>('RAW_PRICES');
  syncSuccessMsg = signal<string>('');

  get unappliedRecsCount(): number {
    return this.erp.recommendations().filter((r) => !r.isApplied).length;
  }

  setSector(sec: SectorFilter) {
    this.erp.selectedMarketSector.set(sec);
  }

  setMeatStandard(mode: StandardMode) {
    this.erp.stdMode.set(mode);
    const modeName = mode === 'kz' ? 'Казахстан (СТ РК)' : mode === 'halal' ? 'Халяль (Конина Жая/Казы)' : 'Германия (Г. Кох)';
    this.syncSuccessMsg.set(`Стандарт мясного сырья переключен: ${modeName}`);
    setTimeout(() => this.syncSuccessMsg.set(''), 3000);
  }

  filteredRawMaterials = computed(() => {
    const sec = this.erp.selectedMarketSector();
    const list = this.erp.rawMaterialPrices();
    if (sec === 'ALL') return list;
    return list.filter((r) => r.sector === sec);
  });

  filteredBenchmarks = computed(() => {
    const sec = this.erp.selectedMarketSector();
    const list = this.erp.competitorBenchmarks();
    if (sec === 'ALL') return list;
    return list.filter((b) => b.sector === sec);
  });

  filteredRecommendations = computed(() => {
    const sec = this.erp.selectedMarketSector();
    const list = this.erp.recommendations();
    if (sec === 'ALL') return list;
    return list.filter((r) => r.sector === sec);
  });

  /**
   * Динамическое получение наименования мясного сырья в зависимости от активного стандарта
   */
  getRawDisplayName(raw: RawMaterialMarketPrice): string {
    if (raw.sector !== 'MEAT') return raw.name;
    const stdDict = this.erp.meatStandards();
    const mode = this.erp.stdMode();

    // Сопоставление кодов мониторинга со справочником стандартов Коха
    let stdKey: string | null = null;
    if (raw.code.startsWith('R1')) stdKey = 'R1';
    else if (raw.code.startsWith('R2')) stdKey = 'R2';
    else if (raw.code.startsWith('R4')) stdKey = 'R4';
    else if (raw.code.startsWith('S1')) stdKey = 'S1';
    else if (raw.code.startsWith('S2')) stdKey = 'S2';
    else if (raw.code.startsWith('S4B') || raw.code === 'S4b') stdKey = 'S4b';
    else if (raw.code.startsWith('S8')) stdKey = 'S8';
    else if (raw.code.startsWith('RIBS')) stdKey = 'RIBS';

    if (stdKey && stdDict[stdKey]) {
      const s = stdDict[stdKey];
      if (mode === 'halal') return s.halal;
      if (mode === 'de') return s.de;
      return s.kz;
    }
    return raw.name;
  }

  getRawDisplayCost(raw: RawMaterialMarketPrice): number {
    if (raw.sector !== 'MEAT') return raw.currentCostKzt;
    const stdDict = this.erp.meatStandards();
    const mode = this.erp.stdMode();

    let stdKey: string | null = null;
    if (raw.code.startsWith('R1')) stdKey = 'R1';
    else if (raw.code.startsWith('R2')) stdKey = 'R2';
    else if (raw.code.startsWith('R4')) stdKey = 'R4';
    else if (raw.code.startsWith('S1')) stdKey = 'S1';
    else if (raw.code.startsWith('S2')) stdKey = 'S2';
    else if (raw.code.startsWith('S4B') || raw.code === 'S4b') stdKey = 'S4b';
    else if (raw.code.startsWith('S8')) stdKey = 'S8';
    else if (raw.code.startsWith('RIBS')) stdKey = 'RIBS';

    if (stdKey && stdDict[stdKey]) {
      return mode === 'halal' ? stdDict[stdKey].halalKzt : stdDict[stdKey].kzt;
    }
    return raw.currentCostKzt;
  }

  getRawMarketAvg(raw: RawMaterialMarketPrice): number {
    if (raw.sector !== 'MEAT') return raw.marketAverageKzt;
    const mode = this.erp.stdMode();
    if (mode === 'halal') {
      if (raw.code.startsWith('R1')) return 4350;
      if (raw.code.startsWith('R4')) return 4200;
      if (raw.code.startsWith('S8')) return 3800; // Жал
      if (raw.code.startsWith('RIBS')) return 4200;
    }
    return raw.marketAverageKzt;
  }

  onRawCostInput(raw: RawMaterialMarketPrice, newCost: number) {
    raw.currentCostKzt = Number(newCost) || 0;
  }

  saveRawPrice(raw: RawMaterialMarketPrice) {
    this.erp.updateRawMaterialPrice(raw.code, raw.currentCostKzt);
    this.syncSuccessMsg.set(`Цена сырья [${raw.code}] обновлена: ${raw.currentCostKzt} ₸/${raw.unit} и пересчитана в ERP!`);
    setTimeout(() => this.syncSuccessMsg.set(''), 4000);
  }

  applySingleRec(recId: string) {
    if (this.erp.applyRecommendation(recId)) {
      this.syncSuccessMsg.set('Рекомендация применена, нормативы и рецептуры актуализированы!');
      setTimeout(() => this.syncSuccessMsg.set(''), 4000);
    }
  }

  applyAllRecs() {
    const n = this.erp.applyAllRecommendations();
    this.syncSuccessMsg.set(`Применено рекомендаций: ${n}. ERP полностью синхронизирован!`);
    setTimeout(() => this.syncSuccessMsg.set(''), 5000);
  }
}
