import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from '../../services/master-erp.service';
import { ProfitGoal, SortOption, StandardMode, SalesChannel, EnrichedTechCard } from '../../models/koch.model';

@Component({
  selector: 'app-koch-cards',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-wrapper">
      <div class="module-header">
        <div>
          <h2>🍖 Навигатор рецептур Г. Коха и доходности (РК)</h2>
          <p class="subtitle">
            Адаптация 12+ промышленных рецептур Германа Коха под сырьевую базу Казахстана и Халяль (Жая, Казы, Жал). Мгновенный расчет себестоимости партии, маржинальности каналов Takeaway vs BEERMOOD.PUB и генерация этикеток TSPL.
          </p>
        </div>
      </div>

      <!-- Controls & Parameters Toolbar -->
      <section class="toolbar-box">
        <div class="tool-row">
          <div class="ctrl-group">
            <label>Размер партии (кг сырья):</label>
            <input
              type="number"
              min="1"
              max="500"
              [ngModel]="erp.batchKg()"
              (ngModelChange)="erp.batchKg.set($event || 20)"
            >
          </div>

          <div class="ctrl-group">
            <label>Сырьевой стандарт:</label>
            <select [ngModel]="erp.stdMode()" (ngModelChange)="erp.stdMode.set($event)">
              <option value="kz">Рынок РК (СТ РК / Алматы)</option>
              <option value="halal">Халяль (Конина Жая / Казы / Жал)</option>
              <option value="de">Германия (Оригинал Г. Коха)</option>
            </select>
          </div>

          <div class="ctrl-group">
            <label>Канал реализации:</label>
            <select [ngModel]="erp.channelMode()" (ngModelChange)="erp.channelMode.set($event)">
              <option value="takeaway">Вендинг 24/7 & Полка Takeaway</option>
              <option value="pub">Кухня и бар BEERMOOD.PUB</option>
            </select>
          </div>

          <div class="ctrl-group">
            <label>Сортировка:</label>
            <select [ngModel]="erp.sortMode()" (ngModelChange)="erp.sortMode.set($event)">
              <option value="profit_desc">Валовая прибыль (max)</option>
              <option value="markup_desc">Наценка % (max)</option>
              <option value="fc_asc">Food Cost % (min)</option>
              <option value="labor_asc">Трудоемкость (min)</option>
              <option value="code_asc">По коду рецепта</option>
            </select>
          </div>
        </div>

        <!-- Profit Goals Filters -->
        <div class="goals-strip">
          <span class="goals-label">Стратегическая цель:</span>
          <button class="goal-btn" [class.active]="erp.activeGoal() === 'all'" (click)="setGoal('all')">Все ({{ erp.techCards().length }})</button>
          <button class="goal-btn" [class.active]="erp.activeGoal() === 'SNACK_MAX'" (click)="setGoal('SNACK_MAX')">Снек-драйверы (Билтонг / Пивчики)</button>
          <button class="goal-btn" [class.active]="erp.activeGoal() === 'PUB_DRIVER'" (click)="setGoal('PUB_DRIVER')">Флагманы паба (Ребра)</button>
          <button class="goal-btn" [class.active]="erp.activeGoal() === 'LOW_LABOR'" (click)="setGoal('LOW_LABOR')">Низкая трудоемкость (Бекон / Карбонад)</button>
          <button class="goal-btn" [class.active]="erp.activeGoal() === 'TAKEAWAY_CORE'" (click)="setGoal('TAKEAWAY_CORE')">Семейная полка Арай (Сервелат / Мортаделла)</button>
          <button class="goal-btn" [class.active]="erp.activeGoal() === 'ZERO_WASTE'" (click)="setGoal('ZERO_WASTE')">Zero-Waste (Суп-киты / Специи)</button>
        </div>

        <div class="search-line">
          <input
            type="text"
            placeholder="Быстрый поиск по названию, коду Коха (3-066, BM-28), PLU или отрубу..."
            [ngModel]="erp.searchQuery()"
            (ngModelChange)="erp.searchQuery.set($event)"
          >
        </div>
      </section>

      <!-- KPI Summary for selection -->
      <div class="kpi-micro-summary" *ngIf="erp.kochSummaryKpi() as kpi">
        <span>Найдено карт: <strong>{{ kpi.count }}</strong></span>
        <span>Средняя наценка: <strong class="text-emerald">{{ kpi.avgMarkup | number:'1.0-1' }}%</strong></span>
        <span>Средний Food Cost: <strong class="text-cyan">{{ kpi.avgFc | number:'1.0-1' }}%</strong></span>
        <span *ngIf="kpi.topItem">Лидер маржи: <strong class="text-gold">{{ kpi.topItem.card.title }}</strong> (+{{ erp.formatMoney(kpi.topItem.econ.grossProfitKzt) }})</span>
      </div>

      <!-- Tech Cards Grid -->
      <div class="cards-grid">
        <div class="recipe-card" *ngFor="let item of erp.filteredKochCards()">
          <div class="card-top">
            <div class="badges-row">
              <span class="badge badge-amber font-mono font-bold">{{ item.card.code }}</span>
              <span class="badge badge-cyan font-mono font-bold">{{ item.card.plu }}</span>
              <span class="badge badge-emerald">{{ item.card.tierLabel }}</span>
            </div>
            <div class="labor-stars" title="Трудоемкость (1-легко, 5-сложно)">
              Трудоемкость: {{ item.card.laborScore }}/5
            </div>
          </div>

          <div class="card-titles">
            <h3 class="card-title">{{ item.card.title }}</h3>
            <div class="card-kz">{{ item.card.titleKz }}</div>
          </div>

          <!-- Economics Block -->
          <div class="econ-box">
            <div class="econ-grid">
              <div class="econ-cell">
                <span class="lbl">Выход готового:</span>
                <strong class="val">{{ item.econ.finishedKg | number:'1.1-2' }} кг ({{ item.card.yieldRatio * 100 }}%)</strong>
              </div>
              <div class="econ-cell">
                <span class="lbl">Себестоимость / кг:</span>
                <strong class="val">{{ erp.formatMoney(item.econ.cogsPerFinishedKgKzt) }}</strong>
              </div>
              <div class="econ-cell">
                <span class="lbl">Цена продажи / кг:</span>
                <strong class="val text-gold">{{ erp.formatMoney(item.econ.sellPricePerKgKzt) }}</strong>
              </div>
              <div class="econ-cell">
                <span class="lbl">Валовая прибыль:</span>
                <strong class="val text-emerald font-bold">+{{ erp.formatMoney(item.econ.grossProfitKzt) }}</strong>
              </div>
              <div class="econ-cell">
                <span class="lbl">Наценка:</span>
                <strong class="val text-emerald">{{ item.econ.markupPct | number:'1.0-1' }}%</strong>
              </div>
              <div class="econ-cell">
                <span class="lbl">Food Cost:</span>
                <strong class="val text-cyan">{{ item.econ.foodCostPct | number:'1.0-1' }}%</strong>
              </div>
            </div>
          </div>

          <!-- Ingredients Section -->
          <div class="ing-section">
            <div class="sec-label">Мясное сырье на партию {{ erp.batchKg() }} кг:</div>
            <table class="ing-table">
              <tbody>
                <tr *ngFor="let m of item.card.meats">
                  <td>
                    <span class="font-mono text-amber font-bold">{{ m.code }}</span>
                    {{ erp.getMeatLabel(m.code, m.forceHalal) }}
                  </td>
                  <td class="font-mono font-bold" style="text-align: right;">
                    {{ (m.kg * (erp.batchKg() / 100.0)) | number:'1.1-2' }} кг
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="sec-label" style="margin-top: 8px;">Пряности и специи:</div>
            <div class="spice-chips">
              <span class="spice-chip" *ngFor="let s of item.card.spices">
                {{ s.name }} ({{ s.g }} г/кг)
              </span>
            </div>
          </div>

          <div class="tech-note">
            <p><strong>Оболочка / упаковка:</strong> {{ item.card.casing }}</p>
            <p><strong>Техпроцесс:</strong> {{ item.card.tech }}</p>
          </div>

          <div class="card-actions">
            <button class="btn btn-outline" (click)="printProductLabel(item, 0.320)">
              🏷️ Этикетка 0.32 кг (TSC TE310)
            </button>
            <button class="btn btn-primary" (click)="printProductLabel(item, 0.050)" *ngIf="item.card.code.includes('BM')">
              🏷️ Билтонг 50 г
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .module-wrapper { padding: 24px 0 60px; }
    .module-header { margin-bottom: 24px; }
    .module-header h2 { font-size: 1.4rem; color: #fff; }
    .subtitle { font-size: 0.84rem; color: var(--text-secondary); margin-top: 4px; max-width: 900px; }
    .toolbar-box {
      background: var(--bg-card);
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 20px;
    }
    .tool-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
      margin-bottom: 14px;
    }
    .ctrl-group {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
    }
    .ctrl-group label { color: var(--text-muted); font-weight: 600; text-transform: uppercase; font-size: 0.7rem; }
    .ctrl-group input, .ctrl-group select {
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      color: var(--accent-amber);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 700;
    }
    .goals-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
      padding: 10px 0;
      border-top: 1px solid var(--border-subtle);
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 12px;
    }
    .goals-label { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-right: 6px; }
    .goal-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.74rem;
      font-weight: 600;
      cursor: pointer;
    }
    .goal-btn.active {
      background: var(--accent-emerald-soft);
      border-color: var(--accent-emerald);
      color: var(--accent-emerald);
      font-weight: 700;
    }
    .search-line input {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      color: #fff;
      padding: 9px 14px;
      border-radius: 6px;
      font-size: 0.84rem;
    }
    .kpi-micro-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      background: var(--bg-surface-elevated);
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 0.78rem;
      margin-bottom: 20px;
      border-left: 3px solid var(--accent-amber);
    }
    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 20px;
    }
    .recipe-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.16s ease;
    }
    .recipe-card:hover { border-color: var(--accent-amber); }
    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .badges-row { display: flex; gap: 6px; flex-wrap: wrap; }
    .labor-stars { font-size: 0.72rem; color: var(--accent-gold); font-weight: 600; }
    .card-titles { margin-bottom: 12px; }
    .card-title { font-size: 1.05rem; font-weight: 800; color: #fff; margin-bottom: 2px; }
    .card-kz { font-size: 0.78rem; color: var(--accent-cyan); }
    .econ-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-left: 3px solid var(--accent-emerald);
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }
    .econ-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; }
    .econ-cell .lbl { font-size: 0.68rem; color: var(--text-muted); display: block; text-transform: uppercase; }
    .econ-cell .val { font-size: 0.84rem; font-family: var(--font-mono); }
    .text-emerald { color: var(--accent-emerald); }
    .text-gold { color: var(--accent-gold); }
    .text-cyan { color: var(--accent-cyan); }
    .text-amber { color: var(--accent-amber); }
    .font-bold { font-weight: 700; }
    .ing-section { margin-bottom: 12px; font-size: 0.78rem; }
    .sec-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
    .ing-table { width: 100%; border-collapse: collapse; }
    .ing-table td { padding: 3px 0; border-bottom: 1px dashed rgba(255,255,255,0.06); }
    .spice-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    .spice-chip {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
    }
    .tech-note {
      background: rgba(0,0,0,0.25);
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 0.74rem;
      color: var(--text-secondary);
      margin-bottom: 14px;
      line-height: 1.4;
    }
    .card-actions { display: flex; gap: 8px; justify-content: flex-end; }
  `]
})
export class KochCardsComponent {
  erp = inject(MasterErpService);

  setGoal(goal: ProfitGoal) {
    this.erp.activeGoal.set(goal);
  }

  printProductLabel(item: EnrichedTechCard, weightKg: number) {
    const tspl = this.erp.generateProductTspl(item, weightKg);
    this.erp.openTsplModal(tspl, `Этикетка ${item.card.title} (${weightKg} кг)`);
  }
}
