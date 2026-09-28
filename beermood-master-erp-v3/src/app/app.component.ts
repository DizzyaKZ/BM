import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterErpService } from './services/master-erp.service';
import { NavbarComponent } from './components/shared/navbar.component';
import { KpiStripComponent } from './components/shared/kpi-strip.component';
import { TsplModalComponent } from './components/shared/tspl-modal.component';
import { MatrixDrawerComponent } from './components/shared/matrix-drawer.component';
import { MarketIntelligenceComponent } from './components/market-intelligence/market-intelligence.component';
import { GiantPlanningComponent } from './components/giant-planning/giant-planning.component';
import { MilkLabComponent } from './components/milk-lab/milk-lab.component';
import { MeatLabComponent } from './components/meat-lab/meat-lab.component';
import { AraiOrdersComponent } from './components/arai-orders/arai-orders.component';
import { KochCardsComponent } from './components/koch-cards/koch-cards.component';
import { CheeseBakeryComponent } from './components/cheese-bakery/cheese-bakery.component';
import { TsplPrinterComponent } from './components/tspl-printer/tspl-printer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    KpiStripComponent,
    TsplModalComponent,
    MatrixDrawerComponent,
    MarketIntelligenceComponent,
    GiantPlanningComponent,
    MilkLabComponent,
    MeatLabComponent,
    AraiOrdersComponent,
    KochCardsComponent,
    CheeseBakeryComponent,
    TsplPrinterComponent
  ],
  template: `
    <div class="app-layout">
      <app-navbar></app-navbar>
      <app-kpi-strip></app-kpi-strip>

      <main class="container app-main">
        <ng-container [ngSwitch]="erp.activeTab()">
          <app-market-intelligence *ngSwitchCase="'market_intelligence'"></app-market-intelligence>
          <app-giant-planning *ngSwitchCase="'giant_planning'"></app-giant-planning>
          <app-milk-lab *ngSwitchCase="'milk_lab'"></app-milk-lab>
          <app-meat-lab *ngSwitchCase="'meat_lab'"></app-meat-lab>
          <app-arai-orders *ngSwitchCase="'arai_orders'"></app-arai-orders>
          <app-koch-cards *ngSwitchCase="'koch_cards'"></app-koch-cards>
          <app-cheese-bakery *ngSwitchCase="'cheese_bakery'"></app-cheese-bakery>
          <app-tspl-printer *ngSwitchCase="'tspl_printer'"></app-tspl-printer>
        </ng-container>
      </main>

      <app-tspl-modal></app-tspl-modal>
      <app-matrix-drawer></app-matrix-drawer>

      <footer class="app-footer">
        <div class="container footer-content">
          <div>
            <strong>MOOD GROUP</strong> • BEERMOOD.PUB • MEAT & BREAD MOOD • CHEESY MOOD • SPICY MOOD LAB
          </div>
          <div class="footer-meta">
            <span>Алматы, ул. Жарокова 137/1 (ЖК «Арай»)</span>
            <span>Павел Николаевич Спицын (BEERMOOD №68702)</span>
            <span>Принтер: TSC TE310 (192.168.1.17:9100)</span>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .app-main { flex: 1; }
    .app-footer {
      background: var(--bg-surface);
      border-top: 1px solid var(--border-subtle);
      padding: 16px 0;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .footer-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }
    .footer-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
  `]
})
export class AppComponent {
  erp = inject(MasterErpService);
}
