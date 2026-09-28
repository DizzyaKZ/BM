import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from '../../services/master-erp.service';
import { DairyRecipe, BakeryRecipe } from '../../models/dairy-bakery.model';

@Component({
  selector: 'app-cheese-bakery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-wrapper">
      <div class="module-header">
        <div>
          <h2>🧀 Сыроварня CHEESY MOOD & Пекарня MEAT & BREAD MOOD</h2>
          <p class="subtitle">
            Безотходная синергия молочного и мучного производств: Свежие сыры на итальянских заквасках Sacco (MS062, MS064) и ремесленные Тартины в печи Unox, замешанные на 100% подсырной сыворотке вместо воды.
          </p>
        </div>
      </div>

      <!-- Zero-Waste Synergy Banner -->
      <section class="synergy-banner">
        <div class="syn-left">
          <span class="badge badge-emerald">ZERO-WASTE СИНЕРГИЯ • 100% УТИЛИЗАЦИЯ СЫВОРОТКИ</span>
          <h3>Калькулятор баланса: Сыроварня ➔ Пекарня</h3>
          <p>
            При варке 100 л молока в ванне Casaro образуется ~12 кг Сулугуни и <strong>85 л теплой подсырной сыворотки</strong>.
            Сыворотка богата альбумином, глобулином и молочным сахаром (лактозой). Замешивание теста тартинов и чиабатты на этой сыворотке полностью исключает сброс отходов и дает карамелизированную корочку без сахара!
          </p>
        </div>
        <div class="syn-calc">
          <div class="syn-input">
            <label>Объем варки молока:</label>
            <input type="number" [(ngModel)]="milkLitersInput" (input)="recalcWhey()">
            <span class="unit">литров</span>
          </div>
          <div class="syn-result">
            <div>🧀 Сыр на выходе: <strong class="text-amber">{{ cheeseKgOutput }} кг</strong></div>
            <div>🥖 Сыворотка в пекарню: <strong class="text-cyan">{{ wheyLitersOutput }} л</strong></div>
            <div>🍞 Хлеб Тартин (на 100% сыворотке): <strong class="text-emerald">{{ breadLoavesOutput }} булок (по 750г)</strong></div>
          </div>
        </div>
      </section>

      <!-- Dairy Section -->
      <section class="dairy-section">
        <h3 class="sec-title">Технологические карты сыроделия (Закваски Sacco)</h3>
        <div class="recipes-grid">
          <div class="recipe-card" *ngFor="let d of erp.dairyRecipes()">
            <div class="card-top">
              <span class="badge badge-amber">{{ d.category }}</span>
              <span class="badge badge-emerald font-mono">Выход: {{ d.targetYieldPct }}%</span>
            </div>
            <div class="card-titles">
              <h4 class="card-title">{{ d.name }}</h4>
              <div class="card-kz">{{ d.nameKz }}</div>
            </div>

            <div class="recipe-meta">
              <div><strong>Закваска:</strong> <span class="text-cyan">{{ d.starterCulture }}</span> ({{ d.starterDosagePer100L }})</div>
              <div><strong>Фермент:</strong> {{ d.enzyme }}</div>
              <div><strong>Коагуляция:</strong> {{ d.tempCoagulationC }}°C | Выдержка: {{ d.cuttingTimeMinutes }} мин</div>
              <div><strong>Сыворотка:</strong> ~{{ d.wheyYieldLitersPer100L }} л с каждых 100 л молока</div>
              <div><strong>Упаковка / Срок:</strong> {{ d.packaging }} ({{ d.shelfLifeDays }} суток)</div>
            </div>

            <div class="tech-steps-box">
              <div class="steps-title">Технологический регламент:</div>
              <ol class="steps-list">
                <li *ngFor="let step of d.techSteps">{{ step }}</li>
              </ol>
            </div>

            <div class="card-actions">
              <button class="btn btn-outline" (click)="printDairyLabel(d)">
                🏷️ Этикетка на баночку/вакуум (TE310)
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Bakery Section -->
      <section class="bakery-section">
        <h3 class="sec-title">Ремесленный хлеб на закваске и сыворотке (Печь Unox)</h3>
        <div class="recipes-grid">
          <div class="recipe-card" *ngFor="let b of erp.bakeryRecipes()">
            <div class="card-top">
              <span class="badge badge-cyan">Пекарня MEAT & BREAD</span>
              <span class="badge badge-emerald">Сыворотка: {{ b.wheyUsedPct }}%</span>
            </div>
            <div class="card-titles">
              <h4 class="card-title">{{ b.name }}</h4>
              <div class="card-kz">{{ b.nameKz }}</div>
            </div>

            <div class="recipe-meta">
              <div><strong>Мучная смесь:</strong> {{ b.flourBlend }}</div>
              <div><strong>Гидратация:</strong> {{ b.hydrationPct }}% (100% замена воды сывороткой)</div>
              <div><strong>Ферментация:</strong> {{ b.fermentationHours }} ч при +4°C (холодная)</div>
              <div><strong>Выпечка в Unox:</strong> {{ b.ovenTempC }}°C с пароувлажнением</div>
              <div><strong>Вес булки:</strong> {{ b.targetWeightG }} г</div>
              <div class="price-row">
                <span>Себестоимость: <strong class="text-amber">{{ erp.formatMoney(b.cogsPerLoafKzt) }}</strong></span>
                <span>Розница: <strong class="text-gold">{{ erp.formatMoney(b.retailPriceKzt) }}</strong></span>
              </div>
            </div>

            <div class="tech-note">
              {{ b.zeroWasteNotes }}
            </div>

            <div class="card-actions">
              <button class="btn btn-primary" (click)="printBakeryLabel(b)">
                🏷️ Этикетка на крафт-пакет (TE310)
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .module-wrapper { padding: 24px 0 60px; }
    .module-header { margin-bottom: 24px; }
    .module-header h2 { font-size: 1.4rem; color: #fff; }
    .subtitle { font-size: 0.84rem; color: var(--text-secondary); margin-top: 4px; max-width: 900px; }
    .sec-title { font-size: 1.05rem; color: var(--accent-amber); margin-bottom: 14px; font-weight: 700; }
    .synergy-banner {
      background: linear-gradient(135deg, #18281f 0%, #121915 100%);
      border: 1px solid var(--accent-emerald);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 24px;
      align-items: center;
    }
    .syn-left h3 { font-size: 1.15rem; color: #fff; margin: 6px 0; }
    .syn-left p { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45; }
    .syn-calc {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 16px;
    }
    .syn-input { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 0.8rem; }
    .syn-input label { color: var(--text-muted); text-transform: uppercase; font-size: 0.72rem; }
    .syn-input input {
      width: 90px;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-strong);
      color: var(--accent-amber);
      padding: 6px 10px;
      border-radius: 5px;
      font-weight: 800;
      font-size: 0.95rem;
    }
    .syn-result { font-size: 0.82rem; display: flex; flex-direction: column; gap: 6px; }
    .text-emerald { color: var(--accent-emerald); }
    .text-cyan { color: var(--accent-cyan); }
    .text-amber { color: var(--accent-amber); }
    .text-gold { color: var(--accent-gold); }
    .dairy-section, .bakery-section { margin-bottom: 34px; }
    .recipes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
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
    }
    .recipe-card:hover { border-color: var(--accent-amber); }
    .card-top { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .card-titles { margin-bottom: 10px; }
    .card-title { font-size: 1.05rem; color: #fff; margin-bottom: 2px; }
    .card-kz { font-size: 0.76rem; color: var(--accent-cyan); }
    .recipe-meta {
      background: var(--bg-surface);
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 12px;
    }
    .price-row { display: flex; justify-content: space-between; border-top: 1px dashed var(--border-subtle); padding-top: 6px; margin-top: 4px; }
    .tech-steps-box {
      background: rgba(0,0,0,0.2);
      padding: 10px 12px;
      border-radius: 6px;
      font-size: 0.74rem;
      margin-bottom: 14px;
    }
    .steps-title { font-weight: 700; color: var(--accent-gold); margin-bottom: 4px; font-size: 0.72rem; text-transform: uppercase; }
    .steps-list { padding-left: 18px; color: var(--text-secondary); line-height: 1.4; }
    .tech-note {
      background: rgba(0,0,0,0.25);
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 0.74rem;
      color: var(--text-secondary);
      margin-bottom: 14px;
      line-height: 1.4;
    }
    .card-actions { display: flex; justify-content: flex-end; }
  `]
})
export class CheeseBakeryComponent {
  erp = inject(MasterErpService);

  milkLitersInput = 100;
  cheeseKgOutput = 12.0;
  wheyLitersOutput = 85.0;
  breadLoavesOutput = 18;

  recalcWhey() {
    this.cheeseKgOutput = Number((this.milkLitersInput * 0.12).toFixed(1));
    this.wheyLitersOutput = Number((this.milkLitersInput * 0.85).toFixed(1));
    // 1 булка тартина 750 г берет ~0.35 л сыворотки (при гидратации 78%)
    this.breadLoavesOutput = Math.floor(this.wheyLitersOutput / 0.35);
  }

  printDairyLabel(d: DairyRecipe) {
    const tspl = `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
REFERENCE 0, 0
CODEPAGE 1251
CLS
BOX 10,10,676,700,3
TEXT 25,25,"3",0,1,1,"CHEESY MOOD * MOOD GROUP"
TEXT 460,25,"2",0,1,1,"ГОСТ / СТ РК"
BAR 10,60,666,2
TEXT 25,75,"2",0,1,1,"${d.nameKz.toUpperCase()}"
TEXT 25,105,"3",0,1,1,"${d.name.substring(0, 26).toUpperCase()}"
BAR 10,140,666,2
TEXT 25,155,"2",0,1,1,"Закваска: ${d.starterCulture}"
TEXT 25,185,"2",0,1,1,"Фермент: ${d.enzyme.substring(0, 36)}"
TEXT 25,215,"2",0,1,1,"Срок годности: ${d.shelfLifeDays} суток (хранить при t: +2...+4 C)"
TEXT 25,245,"2",0,1,1,"Упаковка: ${d.packaging.substring(0, 38)}"
BAR 10,275,666,2
TEXT 25,300,"3",0,1,1,"МАССА НЕТТО:"
TEXT 240,295,"4",0,1,1,"0.250 кг"
TEXT 25,350,"3",0,1,1,"ЦЕНА:"
TEXT 240,345,"4",0,1,1,"2 800 KZT"
TEXT 25,395,"2",0,1,1,"MOOD CLUB (-10%): 2 520 KZT"
BAR 10,430,666,2
BARCODE 60,450,"EAN13",90,2,0,3,3,"220031000250"
TEXT 25,570,"1",0,1,1,"Изготовлено из 100% цельного фермерского молока Алматинской обл."
TEXT 25,595,"1",0,1,1,"Производитель: CHEESY MOOD, г. Алматы, ул. Жарокова 137/1 (ЖК Арай)"
TEXT 25,620,"1",0,1,1,"Контроль качества: «Эксперт Профи» * www.beermood.pub"
PRINT 1, 1`;
    this.erp.openTsplModal(tspl, `Этикетка ${d.name}`);
  }

  printBakeryLabel(b: BakeryRecipe) {
    const tspl = `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
REFERENCE 0, 0
CODEPAGE 1251
CLS
BOX 10,10,676,700,3
TEXT 25,25,"3",0,1,1,"MEAT & BREAD MOOD"
TEXT 460,25,"2",0,1,1,"РЕМЕСЛЕННЫЙ"
BAR 10,60,666,2
TEXT 25,75,"2",0,1,1,"${b.nameKz.toUpperCase()}"
TEXT 25,105,"3",0,1,1,"${b.name.substring(0, 26).toUpperCase()}"
BAR 10,140,666,2
TEXT 25,155,"2",0,1,1,"Состав: ${b.flourBlend.substring(0, 36)}"
TEXT 25,185,"2",0,1,1,"Основа: 100% подсырная сыворотка сыроварни"
TEXT 25,215,"2",0,1,1,"Ферментация: ${b.fermentationHours} ч на диких дрожжах"
TEXT 25,245,"2",0,1,1,"Выпечка в печи Unox при ${b.ovenTempC} C с паром"
BAR 10,275,666,2
TEXT 25,300,"3",0,1,1,"МАССА НЕТТО:"
TEXT 240,295,"4",0,1,1,"${(b.targetWeightG / 1000).toFixed(3)} кг"
TEXT 25,350,"3",0,1,1,"ЦЕНА:"
TEXT 240,345,"4",0,1,1,"${b.retailPriceKzt.toLocaleString('ru-RU')} KZT"
TEXT 25,395,"2",0,1,1,"MOOD CLUB (-10%): ${Math.round(b.retailPriceKzt * 0.90).toLocaleString('ru-RU')} KZT"
BAR 10,430,666,2
BARCODE 60,450,"EAN13",90,2,0,3,3,"220041000750"
TEXT 25,570,"1",0,1,1,"Без промышленных дрожжей и улучшителей * Хранить при t: +15...+22 C"
TEXT 25,595,"1",0,1,1,"Пекарня MEAT & BREAD, г. Алматы, ул. Жарокова 137/1 (ЖК Арай)"
TEXT 25,620,"1",0,1,1,"BEERMOOD Master ERP v3 * www.beermood.kz"
PRINT 1, 1`;
    this.erp.openTsplModal(tspl, `Этикетка ${b.name}`);
  }
}
