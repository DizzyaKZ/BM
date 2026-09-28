import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterErpService } from '../../services/master-erp.service';
import { ActiveTab, CurrencyMode } from '../../models/erp.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="navbar">
      <div class="container nav-container">
        <div class="brand-zone">
          <div class="brand-logo">
            <span class="logo-b">B</span>
          </div>
          <div class="brand-text">
            <div class="brand-title">
              BEERMOOD <span class="badge-v">Master ERP v3</span>
            </div>
            <div class="brand-subtitle">
              MOOD GROUP • ЖК «Арай», ул. Жарокова 137/1 • Алматы
            </div>
          </div>
        </div>

        <nav class="nav-tabs">
          <button
            class="tab-btn"
            [class.active]="erp.activeTab() === 'market_intelligence'"
            (click)="setTab('market_intelligence')"
          >
            📊 Финансы & Рынок
            <span class="badge-count" *ngIf="erp.globalKpi().activeRecommendationsCount > 0">
              {{ erp.globalKpi().activeRecommendationsCount }}
            </span>
          </button>
          <button
            class="tab-btn"
            [class.active]="erp.activeTab() === 'giant_planning'"
            (click)="setTab('giant_planning')"
          >
            ⚡ GIANT-план
          </button>
          <button
            class="tab-btn"
            [class.active]="erp.activeTab() === 'milk_lab'"
            (click)="setTab('milk_lab')"
          >
            🧪 Молоко («Эксперт Профи»)
          </button>
          <button
            class="tab-btn"
            [class.active]="erp.activeTab() === 'meat_lab'"
            (click)="setTab('meat_lab')"
          >
            🥩 Приемка мяса (ХАССП)
          </button>
          <button
            class="tab-btn"
            [class.active]="erp.activeTab() === 'arai_orders'"
            (click)="setTab('arai_orders')"
          >
            🛍️ Заказы ЖК «Арай»
            <span class="badge-count" *ngIf="erp.globalKpi().araiOrdersPending > 0">
              {{ erp.globalKpi().araiOrdersPending }}
            </span>
          </button>
          <button
            class="tab-btn"
            [class.active]="erp.activeTab() === 'koch_cards'"
            (click)="setTab('koch_cards')"
          >
            🍖 Карты Г. Коха
          </button>
          <button
            class="tab-btn"
            [class.active]="erp.activeTab() === 'cheese_bakery'"
            (click)="setTab('cheese_bakery')"
          >
            🧀 Сыроварня & Хлеб
          </button>
          <button
            class="tab-btn"
            [class.active]="erp.activeTab() === 'tspl_printer'"
            (click)="setTab('tspl_printer')"
          >
            🏷️ TSC TE310
          </button>
        </nav>

        <div class="nav-controls">
          <button
            class="btn btn-matrix"
            *ngIf="erp.isMeatContext()"
            (click)="erp.isMatrixDrawerOpen.set(!erp.isMatrixDrawerOpen())"
            title="Открыть матрицу соответствия сортов мяса (Г. Кох ⇄ СТ РК ⇄ Halal)"
          >
            📋 Матрица сортов
          </button>

          <div class="currency-toggle">
            <button
              class="curr-btn"
              [class.active]="erp.currencyMode() === 'BOTH'"
              (click)="setCurrency('BOTH')"
            >
              ₸ / $
            </button>
            <button
              class="curr-btn"
              [class.active]="erp.currencyMode() === 'KZT'"
              (click)="setCurrency('KZT')"
            >
              ₸ KZT
            </button>
            <button
              class="curr-btn"
              [class.active]="erp.currencyMode() === 'USD'"
              (click)="setCurrency('USD')"
            >
              $ USD
            </button>
          </div>

          <div class="hardware-pill" title="TSC TE310 сетевой адрес">
            <span class="pulse-dot"></span>
            <span class="hw-text">TE310: {{ erp.printerConfig().ip }}</span>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      background: linear-gradient(180deg, #171513 0%, #100f0e 100%);
      border-bottom: 1px solid var(--border-strong);
      padding: 12px 0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
    }
    .nav-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .brand-zone { display: flex; align-items: center; gap: 12px; }
    .brand-logo {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--accent-amber) 0%, var(--accent-copper) 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px var(--accent-amber-glow);
    }
    .logo-b { font-size: 1.4rem; font-weight: 900; color: #fff; }
    .brand-title {
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge-v {
      font-size: 0.68rem;
      background: var(--accent-amber-glow);
      color: var(--accent-amber);
      border: 1px solid var(--accent-amber);
      padding: 1px 6px;
      border-radius: 4px;
    }
    .brand-subtitle { font-size: 0.72rem; color: var(--text-muted); }
    .nav-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--bg-surface);
      padding: 4px;
      border-radius: 8px;
      border: 1px solid var(--border-subtle);
      flex-wrap: wrap;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      padding: 7px 11px;
      font-size: 0.78rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.16s ease;
    }
    .tab-btn:hover {
      color: var(--text-primary);
      background: var(--bg-surface-elevated);
    }
    .tab-btn.active {
      background: var(--accent-amber);
      color: #fff;
      box-shadow: 0 2px 8px var(--accent-amber-glow);
    }
    .badge-count {
      background: var(--accent-ruby);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 10px;
    }
    .nav-controls { display: flex; align-items: center; gap: 10px; }
    .btn-matrix {
      background: var(--bg-surface-elevated);
      color: var(--accent-gold);
      border: 1px solid var(--accent-gold);
      padding: 6px 11px;
      border-radius: 6px;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-matrix:hover { background: var(--accent-gold); color: #000; }
    .currency-toggle {
      display: flex;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 6px;
      overflow: hidden;
    }
    .curr-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 5px 8px;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
    }
    .curr-btn.active { background: var(--accent-amber); color: #fff; }
    .hardware-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      padding: 5px 10px;
      border-radius: 20px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent-cyan);
    }
    .pulse-dot {
      width: 7px;
      height: 7px;
      background: var(--accent-emerald);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--accent-emerald);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
      100% { opacity: 1; transform: scale(1); }
    }
  `]
})
export class NavbarComponent {
  erp = inject(MasterErpService);

  setTab(tab: ActiveTab) {
    this.erp.activeTab.set(tab);
  }

  setCurrency(curr: CurrencyMode) {
    this.erp.currencyMode.set(curr);
  }
}
