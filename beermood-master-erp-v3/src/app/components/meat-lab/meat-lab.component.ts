import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from '../../services/master-erp.service';
import {
  MeatLabRecord,
  MeatAnimalType,
  MeatThermalState,
  MeatQualityGrade,
  MeatQualityDefect
} from '../../models/meat-lab.model';

export interface PredefinedCutOption {
  code: string;
  name: string;
  animalType: MeatAnimalType;
  defaultPrice: number;
  isHalal: boolean;
}

export const PREDEFINED_CUTS: PredefinedCutOption[] = [
  { code: 'R1_HORSE', name: 'Конина в/с Жая (тазобедренный отруб для Билтонга BM-28)', animalType: 'HORSE', defaultPrice: 4000, isHalal: true },
  { code: 'R4_KAZY', name: 'Конина реберная мякоть под Казы (70/30)', animalType: 'HORSE', defaultPrice: 3900, isHalal: true },
  { code: 'R1_BEEF', name: 'Говядина в/с огузок / оковалок зачищенный', animalType: 'BEEF', defaultPrice: 3350, isHalal: true },
  { code: 'R2_BEEF', name: 'Говядина 1 сорта мякоть лопатки (для фаршей)', animalType: 'BEEF', defaultPrice: 2900, isHalal: true },
  { code: 'S1_PORK', name: 'Свинина окорок / карбонад бескостный', animalType: 'PORK', defaultPrice: 2200, isHalal: false },
  { code: 'S4B_BEACON', name: 'Грудинка свиная слоистая 50/50 (для бекона)', animalType: 'PORK', defaultPrice: 2400, isHalal: false },
  { code: 'S8_LARD', name: 'Шпик свиной хребтовый тугоплавкий (>35°C)', animalType: 'PORK', defaultPrice: 1800, isHalal: false },
  { code: 'RIBS_PORK', name: 'Ребра свиные мясные калиброванные ленты (кухня паба)', animalType: 'PORK', defaultPrice: 2600, isHalal: false }
];

@Component({
  selector: 'app-meat-lab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-wrapper">
      <div class="module-header">
        <div>
          <h2>🥩 Лаборатория приемки мяса (Входной контроль ХАССП)</h2>
          <p class="subtitle">
            Входной контроль мясного сырья для BEERMOOD.PUB и цеха деликатесов. Замер температуры в толще отруба, pH-метрия (тестер Hanna), диагностика дефектов PSE/DFD, проверка ветеринарных клейм и автоматический расчет зачетной цены по СТ РК / Герману Коху.
          </p>
        </div>
      </div>

      <!-- Quick Entry Card -->
      <section class="analyzer-card">
        <div class="card-head">
          <div class="card-badges">
            <span class="badge badge-ruby font-bold">ХАССП: Контрольная критическая точка ККТ-1</span>
            <span class="badge badge-cyan">pH-тестер Hanna Meat & Cheese • Весы Масса-К</span>
          </div>
          <h3>Приемка и экспресс-анализ партии мяса</h3>
        </div>

        <div class="entry-grid">
          <!-- Поставщик -->
          <div class="field">
            <label>Поставщик / Фермерское хозяйство</label>
            <input type="text" [(ngModel)]="newSupplier" placeholder="КХ «Алатау Ет» / СПК «Жетысу Агро»">
          </div>

          <!-- Номер партии -->
          <div class="field">
            <label>Номер партии / ТТН</label>
            <input type="text" [(ngModel)]="newBatchCode" placeholder="LOT-MEAT-928">
          </div>

          <!-- Номер ветеринарного свидетельства -->
          <div class="field">
            <label>Ветеринарное свидетельство (ВетИС)</label>
            <input type="text" [(ngModel)]="newVetDoc" placeholder="ВетИС-KZ-092801 / форма №2">
          </div>

          <!-- Отруб / Сорт по стандарту -->
          <div class="field span-2">
            <label>Отруб и стандарт разделки (Кох / СТ РК / Halal)</label>
            <select [ngModel]="selectedCutCode" (ngModelChange)="onCutSelected($event)">
              <option *ngFor="let c of cutOptions" [value]="c.code">
                {{ c.name }} — {{ c.defaultPrice }} ₸/кг {{ c.isHalal ? '(Халяль)' : '' }}
              </option>
            </select>
          </div>

          <!-- Масса нетто -->
          <div class="field">
            <label>Масса нетто, кг (Весы Масса-К)</label>
            <input type="number" step="0.5" [(ngModel)]="newWeight" (input)="recalcLive()">
          </div>

          <!-- Температура в толще -->
          <div class="field">
            <label>Температура в толще мышцы, °C (Норма 0.0–4.0°C)</label>
            <input type="number" step="0.1" [(ngModel)]="newTemp" (input)="recalcLive()">
          </div>

          <!-- Термическое состояние -->
          <div class="field">
            <label>Термическое состояние</label>
            <select [(ngModel)]="newThermal" (ngModelChange)="recalcLive()">
              <option value="CHILLED">Охлажденное (0.0 – +4.0 °C)</option>
              <option value="FROZEN">Глубокая заморозка (≤ -18 °C)</option>
              <option value="WARM">Парное / Неохлажденное (> +4.0 °C)</option>
            </select>
          </div>

          <!-- Кислотность pH (Hanna) -->
          <div class="field">
            <label>Кислотность pH мяса (Hanna, норма 5.40–5.80)</label>
            <input type="number" step="0.02" [(ngModel)]="newPh" (input)="recalcLive()">
          </div>

          <!-- Влагосвязывающая способность -->
          <div class="field">
            <label>Влагосвязывающая способность, ВСС % (58–68%)</label>
            <input type="number" step="0.5" [(ngModel)]="newWbc" (input)="recalcLive()">
          </div>

          <!-- Цвет и плотность жира -->
          <div class="field">
            <label>Цвет и консистенция жира</label>
            <input type="text" [(ngModel)]="newFatColor" placeholder="Белый плотный / Тугоплавкий t>35°C">
          </div>

          <!-- Органолептика (1-10) -->
          <div class="field">
            <label>Органолептический балл (1–10)</label>
            <input type="number" min="1" max="10" [(ngModel)]="newOrganoleptic" (input)="recalcLive()">
          </div>

          <!-- Базовая цена -->
          <div class="field">
            <label>Базовая договорная цена (₸/кг)</label>
            <input type="number" [(ngModel)]="newBasePrice" (input)="recalcLive()">
          </div>

          <!-- Документы и клейма -->
          <div class="field-checks span-2">
            <label class="check-box">
              <input type="checkbox" [(ngModel)]="newHasVetStamp" (change)="recalcLive()">
              <span>Овальное ветеринарное клеймо РК читаемо и присутствует</span>
            </label>
            <label class="check-box">
              <input type="checkbox" [(ngModel)]="newIsHalal" (change)="recalcLive()">
              <span>Сертификат соответствия «Халяль ДУМК» (при поставке конины/говядины)</span>
            </label>
          </div>
        </div>

        <!-- Live Quality Verdict Strip -->
        <div class="verdict-strip">
          <div class="v-item">
            <span class="v-label">Сортность сырья:</span>
            <span class="v-val badge" [ngClass]="{
              'badge-emerald': liveGrade() === 'EXTRA_CRAFT',
              'badge-cyan': liveGrade() === 'FIRST_GRADE',
              'badge-amber': liveGrade() === 'PROCESSING_ONLY',
              'badge-ruby': liveGrade() === 'REJECT'
            }">
              {{ liveGrade() === 'EXTRA_CRAFT' ? 'ВЫСШИЙ КРАФТ (БИЛТОНГ/СЕРВЕЛАТ)' :
                 liveGrade() === 'FIRST_GRADE' ? '1 СОРТ (КОПЧЕНОСТИ/ПАБ)' :
                 liveGrade() === 'PROCESSING_ONLY' ? 'ТОЛЬКО В ФАРШ/ЭМУЛЬСИИ' : 'БРАК / КАРАНТИН' }}
            </span>
          </div>

          <div class="v-item">
            <span class="v-label">Диагностика ткани (pH):</span>
            <span class="v-val font-mono" [ngClass]="{
              'text-emerald': liveDefect() === 'NOR',
              'text-amber': liveDefect() === 'DFD',
              'text-ruby': liveDefect() === 'PSE'
            }">
              <strong>{{ liveDefect() === 'NOR' ? 'NOR (Нормальное созревание)' : liveDefect() === 'DFD' ? 'DFD (Темное, сухое pH>6.2)' : 'PSE (Бледное водянистое pH<5.3)' }}</strong>
            </span>
          </div>

          <div class="v-item">
            <span class="v-label">Индекс сыровяления:</span>
            <span class="v-val text-cyan"><strong>{{ liveScore() }} / 100</strong></span>
          </div>

          <div class="v-item">
            <span class="v-label">Зачетная цена:</span>
            <span class="v-val text-gold"><strong>{{ liveAdjustedPrice() }} ₸/кг</strong></span>
          </div>

          <div class="v-item">
            <span class="v-label">Итого к оплате поставщику:</span>
            <span class="v-val text-emerald font-bold"><strong>{{ (liveAdjustedPrice() * newWeight) | number }} ₸</strong></span>
          </div>

          <div class="v-actions">
            <button class="btn btn-primary" (click)="saveAndPrint()" [disabled]="liveGrade() === 'REJECT' && !newHasVetStamp">
              💾 Зафиксировать и распечатать Акт приемки
            </button>
          </div>
        </div>
      </section>

      <!-- History Table -->
      <section class="history-section">
        <div class="history-head">
          <h3 class="sec-title">Журнал входящих партий мясного сырья</h3>
          <span class="text-muted">Всего зафиксировано: {{ erp.meatLabRecords().length }} партий</span>
        </div>

        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Дата/Время</th>
                <th>Партия</th>
                <th>Отруб / Вид мяса</th>
                <th>Поставщик</th>
                <th>Вес нетто</th>
                <th>Температура</th>
                <th>pH (Hanna)</th>
                <th>Тип</th>
                <th>Сорт ХАССП</th>
                <th>Балл</th>
                <th>Зачет. цена</th>
                <th>Сумма партии</th>
                <th>Статус</th>
                <th>TSPL Акт</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of erp.meatLabRecords()">
                <td class="font-mono">{{ r.sampleTime }}</td>
                <td class="font-mono text-amber font-bold">{{ r.batchCode }}</td>
                <td>
                  <strong>{{ r.cutName }}</strong>
                  <div class="sub-vet">Вет: {{ r.vetDocNumber }}</div>
                </td>
                <td class="supplier-name">{{ r.supplier }}</td>
                <td class="font-mono font-bold">{{ r.weightKg }} кг</td>
                <td class="font-mono" [ngClass]="r.temperatureC > 4.0 ? 'text-amber' : 'text-emerald'">
                  {{ r.temperatureC }}°C
                </td>
                <td class="font-mono font-bold">{{ r.acidityPh }}</td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-emerald': r.defectType === 'NOR',
                    'badge-amber': r.defectType === 'DFD',
                    'badge-ruby': r.defectType === 'PSE'
                  }">{{ r.defectType }}</span>
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-emerald': r.calculatedGrade === 'EXTRA_CRAFT',
                    'badge-cyan': r.calculatedGrade === 'FIRST_GRADE',
                    'badge-ruby': r.calculatedGrade === 'REJECT'
                  }">{{ r.calculatedGrade === 'EXTRA_CRAFT' ? 'ВЫСШИЙ КРАФТ' : r.calculatedGrade }}</span>
                </td>
                <td><strong class="text-cyan">{{ r.craftSuitabilityScore }}</strong></td>
                <td class="font-mono">{{ r.adjustedPricePerKgKzt | number }} ₸</td>
                <td class="font-mono text-emerald font-bold">{{ r.totalSumKzt | number }} ₸</td>
                <td>
                  <span class="badge" [ngClass]="r.status === 'ACCEPTED' ? 'badge-emerald' : 'badge-ruby'">
                    {{ r.status }}
                  </span>
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
    .sec-title { font-size: 1.05rem; color: var(--accent-amber); font-weight: 700; margin: 0; }
    .history-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
    .analyzer-card {
      background: var(--bg-card);
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    }
    .card-head { margin-bottom: 18px; }
    .card-badges { display: flex; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .card-head h3 { font-size: 1.15rem; color: #fff; margin: 0; }
    .entry-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 14px;
      margin-bottom: 20px;
    }
    .span-2 { grid-column: span 2; }
    .field label {
      display: block;
      font-size: 0.72rem;
      color: var(--text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .field input, .field select {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      color: #fff;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 0.84rem;
      font-weight: 600;
    }
    .field-checks {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: var(--bg-surface);
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid var(--border-subtle);
    }
    .check-box {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.78rem;
      cursor: pointer;
      color: var(--text-primary);
    }
    .check-box input { width: auto; cursor: pointer; }
    .verdict-strip {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-subtle);
      border-left: 4px solid #e74c3c;
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
    .text-ruby { color: var(--accent-ruby); }
    .text-amber { color: var(--accent-amber); }
    .table-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
    }
    .data-table th, .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-subtle);
      text-align: left;
      vertical-align: middle;
    }
    .data-table th {
      background: var(--bg-surface);
      color: var(--accent-amber);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.70rem;
      white-space: nowrap;
    }
    .data-table tr:hover { background: rgba(255,255,255,0.02); }
    .sub-vet { font-size: 0.68rem; color: var(--text-muted); font-family: var(--font-mono); }
    .supplier-name { font-size: 0.75rem; color: var(--text-secondary); }
    .font-bold { font-weight: 700; }
    .btn-sm { padding: 4px 8px; font-size: 0.74rem; border-radius: 4px; cursor: pointer; }
  `]
})
export class MeatLabComponent {
  erp = inject(MasterErpService);

  cutOptions = PREDEFINED_CUTS;
  selectedCutCode = 'R1_HORSE';

  newSupplier = 'КХ «Алатау Ет» (Талгарский р-н)';
  newBatchCode = `LOT-MEAT-${new Date().getDate()}${new Date().getMonth() + 1}`;
  newVetDoc = 'ВетИС-KZ-092801 / форма №2';
  newCutName = 'Конина в/с Жая (тазобедренный отруб для Билтонга BM-28)';
  newAnimalType: MeatAnimalType = 'HORSE';
  newWeight = 120;
  newTemp = 2.6;
  newThermal: MeatThermalState = 'CHILLED';
  newPh = 5.62;
  newWbc = 64.0;
  newFatColor = 'Белый плотный (без желтизны)';
  newOrganoleptic = 9;
  newBasePrice = 4000;
  newHasVetStamp = true;
  newIsHalal = true;

  liveGrade = signal<MeatQualityGrade>('EXTRA_CRAFT');
  liveDefect = signal<MeatQualityDefect>('NOR');
  liveScore = signal<number>(95);
  liveAdjustedPrice = signal<number>(4200);

  constructor() {
    this.recalcLive();
  }

  onCutSelected(code: string) {
    this.selectedCutCode = code;
    const opt = this.cutOptions.find((c) => c.code === code);
    if (opt) {
      this.newCutName = opt.name;
      this.newAnimalType = opt.animalType;
      this.newBasePrice = opt.defaultPrice;
      this.newIsHalal = opt.isHalal;
    }
    this.recalcLive();
  }

  recalcLive() {
    let defect: MeatQualityDefect = 'NOR';
    if (this.newPh < 5.30) {
      defect = 'PSE';
    } else if (this.newPh > 6.20) {
      defect = 'DFD';
    }
    this.liveDefect.set(defect);

    let grade: MeatQualityGrade = 'EXTRA_CRAFT';
    if (this.newTemp > 6.0 || !this.newHasVetStamp || this.newOrganoleptic < 6) {
      grade = 'REJECT';
    } else if (defect !== 'NOR' || this.newWbc < 55.0 || this.newOrganoleptic < 8 || this.newTemp > 4.5) {
      grade = 'PROCESSING_ONLY';
    } else if (this.newOrganoleptic < 9 || this.newWbc < 60.0) {
      grade = 'FIRST_GRADE';
    }
    this.liveGrade.set(grade);

    let score = 80;
    if (this.newPh >= 5.50 && this.newPh <= 5.75) score += 12;
    if (this.newTemp <= 3.5) score += 8;
    if (defect !== 'NOR') score -= 35;
    if (!this.newHasVetStamp) score = 0;
    this.liveScore.set(Math.max(0, Math.min(100, score)));

    let adj = this.newBasePrice;
    if (grade === 'EXTRA_CRAFT') {
      adj = Math.round(this.newBasePrice * 1.05);
    } else if (grade === 'PROCESSING_ONLY') {
      adj = Math.round(this.newBasePrice * 0.85);
    } else if (grade === 'REJECT') {
      adj = 0;
    }
    this.liveAdjustedPrice.set(adj);
  }

  saveAndPrint() {
    const rec = this.erp.addMeatLabRecord({
      sampleTime: new Date().toISOString().replace('T', ' ').substring(0, 16),
      supplier: this.newSupplier,
      batchCode: this.newBatchCode,
      vetDocNumber: this.newVetDoc,
      animalType: this.newAnimalType,
      cutCode: this.selectedCutCode,
      cutName: this.newCutName,
      weightKg: this.newWeight,
      temperatureC: this.newTemp,
      thermalState: this.newThermal,
      acidityPh: this.newPh,
      defectType: this.liveDefect(),
      waterBindingCapacityPct: this.newWbc,
      fatColor: this.newFatColor,
      organolepticScore: this.newOrganoleptic,
      hasVetStamp: this.newHasVetStamp,
      isHalalCertified: this.newIsHalal,
      calculatedGrade: this.liveGrade(),
      craftSuitabilityScore: this.liveScore(),
      basePricePerKgKzt: this.newBasePrice,
      adjustedPricePerKgKzt: this.liveAdjustedPrice(),
      totalSumKzt: this.liveAdjustedPrice() * this.newWeight,
      status: this.liveGrade() === 'REJECT' ? 'REJECTED' : 'ACCEPTED',
      operator: 'Павел Спицын (BEERMOOD #68702)',
      notes: `Приемка мяса завершена. Сорт: ${this.liveGrade()}, pH: ${this.newPh}`
    });

    const tspl = this.erp.generateMeatActTspl(rec);
    this.erp.openTsplModal(tspl, `Акт приемки мяса ${rec.batchCode} (${rec.cutName})`);
  }

  openActModal(rec: MeatLabRecord) {
    const tspl = this.erp.generateMeatActTspl(rec);
    this.erp.openTsplModal(tspl, `Акт приемки мяса ${rec.batchCode} (${rec.cutName})`);
  }
}
