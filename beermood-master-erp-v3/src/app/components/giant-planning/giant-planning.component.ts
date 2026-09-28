import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from '../../services/master-erp.service';
import { EquipmentType, ProductionTask } from '../../models/giant-plan.model';

@Component({
  selector: 'app-giant-planning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-wrapper">
      <div class="module-header">
        <div>
          <h2>⚡ Модуль GIANT-планирования и загрузки мощностей</h2>
          <p class="subtitle">
            Сквозное планирование цехов холдинга MOOD GROUP: Сыроварня Casaro, коптильня Ижица Varmen Mini, вялочная камера, печи Unox и кухня BEERMOOD.PUB.
          </p>
        </div>
        <button class="btn btn-primary" (click)="toggleNewTaskModal()">
          + Запланировать смену
        </button>
      </div>

      <!-- Equipment Status Matrix -->
      <section class="equip-section">
        <h3 class="sec-title">Мониторинг оборудования и текущих циклов</h3>
        <div class="equip-grid">
          <div class="equip-card" *ngFor="let eq of erp.equipmentStatuses()">
            <div class="eq-top">
              <div class="eq-name">{{ eq.name }}</div>
              <span class="badge" [ngClass]="{
                'badge-emerald': eq.status === 'RUNNING',
                'badge-amber': eq.status === 'IDLE',
                'badge-ruby': eq.status === 'MAINTENANCE'
              }">{{ eq.status }}</span>
            </div>
            <div class="eq-loc">📍 {{ eq.location }}</div>
            <div class="eq-meta">
              <span>Лимит: <strong>{{ eq.capacityMax }}</strong></span>
              <span>Мощность: <strong>{{ eq.powerKw }} кВт</strong></span>
            </div>
            <div class="eq-cycle">
              <div class="cycle-label">Текущий процесс:</div>
              <div class="cycle-name">{{ eq.currentCycle }}</div>
            </div>
            <div class="progress-bar-bg" *ngIf="eq.status === 'RUNNING'">
              <div class="progress-bar-fill" [style.width.%]="eq.progressPct"></div>
            </div>
            <div class="eq-footer">
              <span>Прогресс: {{ eq.progressPct }}%</span>
              <span>Завершение: {{ eq.estimatedFinishTime }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Task Dispatcher Schedule -->
      <section class="tasks-section">
        <div class="tasks-header">
          <h3 class="sec-title">Производственные наряд-задания на смену</h3>
          <div class="filter-pills">
            <button class="pill-btn" [class.active]="filterEq() === 'ALL'" (click)="filterEq.set('ALL')">Все цеха</button>
            <button class="pill-btn" [class.active]="filterEq() === 'CHEESE'" (click)="filterEq.set('CHEESE')">Сыроварня</button>
            <button class="pill-btn" [class.active]="filterEq() === 'SMOKER'" (click)="filterEq.set('SMOKER')">Коптильня Varmen</button>
            <button class="pill-btn" [class.active]="filterEq() === 'BILTONG'" (click)="filterEq.set('BILTONG')">Вяление Жая</button>
            <button class="pill-btn" [class.active]="filterEq() === 'BAKERY'" (click)="filterEq.set('BAKERY')">Пекарня Unox</button>
          </div>
        </div>

        <div class="table-card">
          <table class="data-table">
            <thead>
              <tr>
                <th>Дата смены</th>
                <th>Оборудование</th>
                <th>Продукт / Рецептура</th>
                <th>Сырье (вход)</th>
                <th>Выход (план)</th>
                <th>Трудоемкость</th>
                <th>Ответственный</th>
                <th>Приоритет</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of filteredTasks()">
                <td class="font-mono">{{ t.shiftDate }}</td>
                <td><span class="badge badge-cyan">{{ t.equipment }}</span></td>
                <td><strong>{{ t.productName }}</strong></td>
                <td class="font-mono">{{ t.batchInputKgOrL }} кг/л</td>
                <td class="font-mono text-emerald"><strong>{{ t.expectedOutputKg }} кг</strong></td>
                <td>{{ t.laborHours }} ч</td>
                <td>{{ t.operator }}</td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-ruby': t.priority === 'HIGH' || t.priority === 'URGENT',
                    'badge-amber': t.priority === 'NORMAL',
                    'badge-cyan': t.priority === 'LOW'
                  }">{{ t.priority }}</span>
                </td>
                <td>
                  <select
                    class="status-select"
                    [ngModel]="t.status"
                    (ngModelChange)="onStatusChange(t.id, $event)"
                  >
                    <option value="PLANNED">Запланирован</option>
                    <option value="IN_PROGRESS">В работе</option>
                    <option value="DONE">Завершен</option>
                  </select>
                </td>
                <td>
                  <button class="btn-sm btn-outline" (click)="printTaskSticker(t)" title="Печать наряда на TSC TE310">
                    🖨️ Наряд
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- New Shift Planning Form (Collapsible) -->
      <section class="planner-box" *ngIf="isNewTaskModalOpen()">
        <div class="box-head">
          <h4>Формирование нового наряд-задания в план смены</h4>
          <button class="btn-close" (click)="isNewTaskModalOpen.set(false)">✕</button>
        </div>
        <div class="planner-grid">
          <div class="field">
            <label>Дата смены</label>
            <input type="date" [(ngModel)]="newTaskDate">
          </div>
          <div class="field">
            <label>Оборудование</label>
            <select [(ngModel)]="newTaskEquipment">
              <option value="CASARO_CHEESE_VAT">Сыроизготовитель Casaro 100л</option>
              <option value="IZHITZA_SMOKER">Коптильня Ижица Varmen Mini (25кг)</option>
              <option value="BILTONG_CHAMBER">Климатическая камера сушки Билтонга</option>
              <option value="UNOX_OVEN">Печь Unox BakerLux</option>
              <option value="PUB_KITCHEN">Кухня BEERMOOD.PUB</option>
            </select>
          </div>
          <div class="field">
            <label>Наименование продукта</label>
            <input type="text" [(ngModel)]="newTaskProduct" placeholder="Например: Билтонг сыровяленый Жая BM-28">
          </div>
          <div class="field">
            <label>Объем сырья (кг или л)</label>
            <input type="number" [(ngModel)]="newBatchInput" (input)="calcOutput()">
          </div>
          <div class="field">
            <label>Ожидаемый выход (кг)</label>
            <input type="number" [(ngModel)]="newBatchOutput">
          </div>
          <div class="field">
            <label>Трудоемкость (часов)</label>
            <input type="number" [(ngModel)]="newLaborHours">
          </div>
          <div class="field">
            <label>Оператор / Мастер</label>
            <input type="text" [(ngModel)]="newOperator" placeholder="Спицын П. Н. / Технолог">
          </div>
          <div class="field">
            <label>Приоритет</label>
            <select [(ngModel)]="newPriority">
              <option value="NORMAL">Обычный</option>
              <option value="HIGH">Высокий</option>
              <option value="URGENT">Срочный</option>
            </select>
          </div>
        </div>
        <div class="box-actions">
          <button class="btn btn-outline" (click)="isNewTaskModalOpen.set(false)">Отмена</button>
          <button class="btn btn-primary" (click)="saveNewTask()">Добавить в план смены</button>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .module-wrapper { padding: 24px 0 60px; }
    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .module-header h2 { font-size: 1.4rem; color: #fff; }
    .subtitle { font-size: 0.84rem; color: var(--text-secondary); margin-top: 4px; max-width: 900px; }
    .sec-title { font-size: 1.05rem; color: var(--accent-amber); margin-bottom: 14px; font-weight: 700; }
    .equip-section { margin-bottom: 30px; }
    .equip-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    .equip-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .eq-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .eq-name { font-weight: 700; font-size: 0.95rem; color: #fff; }
    .eq-loc { font-size: 0.74rem; color: var(--text-muted); margin-bottom: 10px; }
    .eq-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.76rem;
      color: var(--text-secondary);
      background: var(--bg-surface);
      padding: 6px 10px;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .eq-cycle { margin-bottom: 10px; }
    .cycle-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
    .cycle-name { font-size: 0.82rem; font-weight: 600; color: var(--accent-cyan); margin-top: 2px; }
    .progress-bar-bg {
      width: 100%;
      height: 6px;
      background: var(--bg-surface-elevated);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent-emerald) 0%, var(--accent-cyan) 100%);
      border-radius: 3px;
    }
    .eq-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .tasks-section { margin-bottom: 30px; }
    .tasks-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .filter-pills { display: flex; gap: 6px; }
    .pill-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .pill-btn.active {
      background: var(--accent-amber);
      color: #fff;
      border-color: var(--accent-amber);
    }
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
      padding: 10px 14px;
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
    .status-select {
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border-strong);
      padding: 4px 8px;
      border-radius: 5px;
      font-size: 0.76rem;
    }
    .btn-sm {
      padding: 4px 8px;
      font-size: 0.74rem;
      border-radius: 4px;
      cursor: pointer;
    }
    .planner-box {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--accent-amber);
      border-radius: 10px;
      padding: 20px;
      margin-top: 20px;
    }
    .box-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .box-head h4 { font-size: 1.05rem; color: #fff; }
    .btn-close { background: none; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; }
    .planner-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 16px;
    }
    .field label {
      display: block;
      font-size: 0.74rem;
      color: var(--text-muted);
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .field input, .field select {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      color: #fff;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 0.82rem;
    }
    .box-actions { display: flex; justify-content: flex-end; gap: 10px; }
  `]
})
export class GiantPlanningComponent {
  erp = inject(MasterErpService);
  filterEq = signal<string>('ALL');
  isNewTaskModalOpen = signal<boolean>(false);

  newTaskDate = '2026-09-29';
  newTaskEquipment: EquipmentType = 'IZHITZA_SMOKER';
  newTaskProduct = 'Колбаски Дебреценские (3-138)';
  newBatchInput = 25;
  newBatchOutput = 21.2;
  newLaborHours = 3.0;
  newOperator = 'Спицын П. Н.';
  newPriority: ProductionTask['priority'] = 'HIGH';

  filteredTasks = () => {
    const f = this.filterEq();
    return this.erp.productionTasks().filter((t) => {
      if (f === 'ALL') return true;
      if (f === 'CHEESE') return t.equipment === 'CASARO_CHEESE_VAT';
      if (f === 'SMOKER') return t.equipment === 'IZHITZA_SMOKER';
      if (f === 'BILTONG') return t.equipment === 'BILTONG_CHAMBER';
      if (f === 'BAKERY') return t.equipment === 'UNOX_OVEN';
      return true;
    });
  };

  toggleNewTaskModal() {
    this.isNewTaskModalOpen.set(!this.isNewTaskModalOpen());
  }

  calcOutput() {
    if (this.newTaskEquipment === 'BILTONG_CHAMBER') {
      this.newBatchOutput = Number((this.newBatchInput * 0.50).toFixed(1));
    } else if (this.newTaskEquipment === 'IZHITZA_SMOKER') {
      this.newBatchOutput = Number((this.newBatchInput * 0.85).toFixed(1));
    } else if (this.newTaskEquipment === 'CASARO_CHEESE_VAT') {
      this.newBatchOutput = Number((this.newBatchInput * 0.12).toFixed(1));
    } else {
      this.newBatchOutput = Number((this.newBatchInput * 0.80).toFixed(1));
    }
  }

  onStatusChange(taskId: string, newStatus: ProductionTask['status']) {
    this.erp.updateTaskStatus(taskId, newStatus);
  }

  saveNewTask() {
    const newTask: ProductionTask = {
      id: `TASK-${Date.now().toString().slice(-4)}`,
      shiftDate: this.newTaskDate,
      equipment: this.newTaskEquipment,
      productName: this.newTaskProduct,
      batchInputKgOrL: this.newBatchInput,
      expectedOutputKg: this.newBatchOutput,
      laborHours: this.newLaborHours,
      operator: this.newOperator,
      status: 'PLANNED',
      priority: this.newPriority
    };
    this.erp.productionTasks.update((list) => [newTask, ...list]);
    this.isNewTaskModalOpen.set(false);
  }

  printTaskSticker(t: ProductionTask) {
    const tspl = `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
REFERENCE 0, 0
CODEPAGE 1251
CLS
BOX 10,10,676,700,3
TEXT 25,25,"3",0,1,1,"НАРЯД-ЗАДАНИЕ: СМЕНА"
TEXT 25,60,"2",0,1,1,"ЦЕХ: ${t.equipment}"
BAR 10,90,666,2
TEXT 25,110,"3",0,1,1,"${t.productName.substring(0, 26)}"
TEXT 25,145,"2",0,1,1,"Дата смены: ${t.shiftDate}"
TEXT 25,175,"2",0,1,1,"Мастер: ${t.operator}"
BAR 10,210,666,2
TEXT 25,230,"3",0,1,1,"ВХОД СЫРЬЯ: ${t.batchInputKgOrL} кг/л"
TEXT 25,270,"3",0,1,1,"ПЛАН ВЫХОДА: ${t.expectedOutputKg} кг"
TEXT 25,310,"2",0,1,1,"Норматив времени: ${t.laborHours} ч"
TEXT 25,340,"2",0,1,1,"Приоритет: ${t.priority}"
BAR 10,380,666,2
BARCODE 120,410,"128",70,1,0,2,2,"${t.id}"
TEXT 25,520,"2",0,1,1,"Статус контроля: ПРИНЯТО К ИСПОЛНЕНИЮ"
TEXT 25,550,"1",0,1,1,"BEERMOOD Master ERP v3 * ул. Жарокова 137/1"
PRINT 1, 1`;
    this.erp.openTsplModal(tspl, `Наряд-задание ${t.id} (${t.productName})`);
  }
}
