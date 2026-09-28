import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from '../../services/master-erp.service';
import { MilkLabRecord, MilkGrade } from '../../models/milk-lab.model';

@Component({
  selector: 'app-milk-lab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-wrapper">
      <div class="module-header">
        <div>
          <h2>🧪 Лаборатория приемки сырья («Эксперт Профи»)</h2>
          <p class="subtitle">
            Входной контроль сырого коровьего молока для сыроварни CHEESY MOOD. Экспресс-анализ ультразвуковым анализатором «Эксперт Профи», проверка плотности, точки замерзания, фальсификации водой и автоматический пересчет зачетной цены по ГОСТ / СТ РК.
          </p>
        </div>
      </div>

      <!-- Quick Entry Analyzer Card -->
      <section class="analyzer-card">
        <div class="card-head">
          <span class="badge badge-cyan">Эксперт Профи • Порт RS-232 / Ручной ввод</span>
          <h3>Новая проба сырого молока (Входной контроль)</h3>
        </div>

        <div class="entry-grid">
          <div class="field">
            <label>Поставщик / Фермерское хозяйство</label>
            <input type="text" [(ngModel)]="newSupplier" placeholder="КХ «Жетісу-Сүт» / Алатау">
          </div>
          <div class="field">
            <label>Номер партии / Танка</label>
            <input type="text" [(ngModel)]="newBatchCode" placeholder="LOT-MILK-928">
          </div>
          <div class="field">
            <label>Объем партии (литров)</label>
            <input type="number" [(ngModel)]="newVolume" (input)="recalcLive()">
          </div>
          <div class="field">
            <label>Жирность, % (База 3.6%)</label>
            <input type="number" step="0.05" [(ngModel)]="newFat" (input)="recalcLive()">
          </div>
          <div class="field">
            <label>Белок, % (База 3.2%)</label>
            <input type="number" step="0.05" [(ngModel)]="newProtein" (input)="recalcLive()">
          </div>
          <div class="field">
            <label>СОМО / SNF, % (Норма ≥ 8.2%)</label>
            <input type="number" step="0.05" [(ngModel)]="newSnf" (input)="recalcLive()">
          </div>
          <div class="field">
            <label>Плотность, °А (Норма ≥ 27.0 °A)</label>
            <input type="number" step="0.1" [(ngModel)]="newDensity" (input)="recalcLive()">
          </div>
          <div class="field">
            <label>Добавленная вода, % (Норма 0.0%)</label>
            <input type="number" step="0.1" [(ngModel)]="newWater" (input)="recalcLive()">
          </div>
          <div class="field">
            <label>Точка замерзания, °C (≤ -0.520)</label>
            <input type="number" step="0.005" [(ngModel)]="newFreezing" (input)="recalcLive()">
          </div>
          <div class="field">
            <label>Температура приемки, °C (4–8°C)</label>
            <input type="number" step="0.5" [(ngModel)]="newTemp">
          </div>
          <div class="field">
            <label>Кислотность pH (Норма 6.60–6.80)</label>
            <input type="number" step="0.02" [(ngModel)]="newPh">
          </div>
          <div class="field">
            <label>Кислотность °Т (Норма 16–18 °Т)</label>
            <input type="number" step="0.5" [(ngModel)]="newTurner">
          </div>
          <div class="field">
            <label>Базовая цена договора (₸/л)</label>
            <input type="number" [(ngModel)]="newBasePrice" (input)="recalcLive()">
          </div>
        </div>

        <!-- Live Quality Verdict Strip -->
        <div class="verdict-strip">
          <div class="v-item">
            <span class="v-label">Сортность сырья:</span>
            <span class="v-val badge" [ngClass]="{
              'badge-emerald': liveGrade() === 'EXTRA',
              'badge-cyan': liveGrade() === 'FIRST',
              'badge-amber': liveGrade() === 'SECOND',
              'badge-ruby': liveGrade() === 'REJECT'
            }">{{ liveGrade() === 'EXTRA' ? 'ВЫСШИЙ СОРТ' : liveGrade() }}</span>
          </div>
          <div class="v-item">
            <span class="v-label">Индекс сыропригодности:</span>
            <span class="v-val text-cyan"><strong>{{ liveScore() }} / 100</strong> (Казеин {{ (newProtein * 0.78) | number:'1.2-2' }}%)</span>
          </div>
          <div class="v-item">
            <span class="v-label">Зачетная цена с жиро/белковой премией:</span>
            <span class="v-val text-gold"><strong>{{ liveAdjustedPrice() }} ₸/л</strong></span>
          </div>
          <div class="v-item">
            <span class="v-label">Сумма к оплате фермеру:</span>
            <span class="v-val text-emerald"><strong>{{ (liveAdjustedPrice() * newVolume) | number }} ₸</strong></span>
          </div>
          <div class="v-actions">
            <button class="btn btn-primary" (click)="saveAndPrint()">
              💾 Зафиксировать и распечатать Акт
            </button>
          </div>
        </div>
      </section>

      <!-- History Table -->
      <section class="history-section">
        <h3 class="sec-title">Журнал входящих партий молока</h3>
        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Дата/Время</th>
                <th>Партия</th>
                <th>Поставщик</th>
                <th>Объем</th>
                <th>Жирность</th>
                <th>Белок</th>
                <th>СОМО</th>
                <th>Плотн.</th>
                <th>Сорт</th>
                <th>Балл</th>
                <th>Зачет. цена</th>
                <th>Сумма партии</th>
                <th>Статус</th>
                <th>TSPL Акт</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of erp.milkLabRecords()">
                <td class="font-mono">{{ r.sampleTime }}</td>
                <td class="font-mono text-amber font-bold">{{ r.batchCode }}</td>
                <td>{{ r.supplier }}</td>
                <td class="font-mono font-bold">{{ r.volumeLiters }} л</td>
                <td class="font-mono">{{ r.fatPct }}%</td>
                <td class="font-mono">{{ r.proteinPct }}%</td>
                <td class="font-mono">{{ r.snfPct }}%</td>
                <td class="font-mono">{{ r.densityDegree }}°A</td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-emerald': r.calculatedGrade === 'EXTRA',
                    'badge-cyan': r.calculatedGrade === 'FIRST',
                    'badge-ruby': r.calculatedGrade === 'REJECT'
                  }">{{ r.calculatedGrade }}</span>
                </td>
                <td><strong class="text-cyan">{{ r.cheeseSuitabilityScore }}</strong></td>
                <td class="font-mono">{{ r.adjustedPricePerLiterKzt }} ₸</td>
                <td class="font-mono text-emerald font-bold">{{ r.totalSumKzt | number }} ₸</td>
                <td>
                  <span class="badge badge-emerald">{{ r.status }}</span>
                </td>
                <td>
                  <button class="btn-sm btn-outline" (click)="openActModal(r)">
                    🖨️ Акт TSPL
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
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
    .analyzer-card {
      background: var(--bg-card);
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .card-head { margin-bottom: 18px; }
    .card-head h3 { font-size: 1.15rem; color: #fff; margin-top: 4px; }
    .entry-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    .field label {
      display: block;
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .field input {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      color: #fff;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 0.84rem;
      font-weight: 600;
    }
    .verdict-strip {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-left: 4px solid var(--accent-emerald);
      border-radius: 8px;
      padding: 14px 18px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .v-item { display: flex; flex-direction: column; gap: 2px; }
    .v-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
    .v-val { font-size: 0.95rem; }
    .text-cyan { color: var(--accent-cyan); }
    .text-gold { color: var(--accent-gold); }
    .text-emerald { color: var(--accent-emerald); }
    .table-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }
    .data-table th, .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-subtle);
      text-align: left;
    }
    .data-table th {
      background: var(--bg-surface);
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.72rem;
    }
    .data-table tr:hover { background: rgba(255,255,255,0.02); }
    .font-bold { font-weight: 700; }
    .text-amber { color: var(--accent-amber); }
    .btn-sm { padding: 4px 8px; font-size: 0.74rem; border-radius: 4px; cursor: pointer; }
  `]
})
export class MilkLabComponent {
  erp = inject(MasterErpService);

  newSupplier = 'КХ «Жетісу-Сүт» (Талгар)';
  newBatchCode = `LOT-MILK-${new Date().getDate()}${new Date().getMonth() + 1}`;
  newVolume = 150;
  newFat = 3.90;
  newProtein = 3.32;
  newSnf = 8.65;
  newDensity = 28.5;
  newWater = 0.0;
  newFreezing = -0.535;
  newTemp = 5.4;
  newPh = 6.68;
  newTurner = 17.0;
  newBasePrice = 260;

  liveGrade = signal<MilkGrade>('EXTRA');
  liveScore = signal<number>(94);
  liveAdjustedPrice = signal<number>(284);

  constructor() {
    this.recalcLive();
  }

  recalcLive() {
    let g: MilkGrade = 'EXTRA';
    if (this.newDensity < 27.0 || this.newSnf < 8.2 || this.newWater > 0 || this.newTurner > 19) {
      g = 'REJECT';
    } else if (this.newDensity < 28.0 || this.newProtein < 3.0 || this.newTurner > 18) {
      g = 'SECOND';
    } else if (this.newFat < 3.4 || this.newProtein < 3.1) {
      g = 'FIRST';
    }
    this.liveGrade.set(g);

    const ratio = this.newProtein / (this.newFat || 1);
    let s = 80;
    if (ratio >= 0.80 && ratio <= 0.88) s += 15;
    if (this.newDensity >= 28.0) s += 5;
    if (this.newWater > 0) s = 0;
    this.liveScore.set(Math.min(100, s));

    const fatCoeff = this.newFat / 3.6;
    const proteinCoeff = this.newProtein / 3.2;
    const adj = Math.round(this.newBasePrice * ((fatCoeff + proteinCoeff) / 2));
    this.liveAdjustedPrice.set(adj);
  }

  saveAndPrint() {
    const rec = this.erp.addMilkLabRecord({
      sampleTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      supplier: this.newSupplier,
      batchCode: this.newBatchCode,
      volumeLiters: this.newVolume,
      fatPct: this.newFat,
      proteinPct: this.newProtein,
      snfPct: this.newSnf,
      densityDegree: this.newDensity,
      addedWaterPct: this.newWater,
      freezingPoint: this.newFreezing,
      temperatureC: this.newTemp,
      acidityPh: this.newPh,
      acidityTurner: this.newTurner,
      basePricePerLiterKzt: this.newBasePrice,
      status: 'ACCEPTED',
      notes: `Приемка выполнена успешно. Сорт: ${this.liveGrade()}`
    });

    const tspl = this.erp.generateMilkActTspl(rec);
    this.erp.openTsplModal(tspl, `Акт приемки молока ${rec.batchCode}`);
  }

  openActModal(rec: MilkLabRecord) {
    const tspl = this.erp.generateMilkActTspl(rec);
    this.erp.openTsplModal(tspl, `Акт приемки молока ${rec.batchCode}`);
  }
}
