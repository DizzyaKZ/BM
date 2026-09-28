import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from '../../services/master-erp.service';
import { AraiResidentOrder, OrderStatus, DeliverySlot, OrderItem } from '../../models/arai-order.model';

export interface CatalogItem {
  name: string;
  unit: string;
  priceKzt: number;
}

export interface CatalogCategory {
  key: string;
  label: string;
  shortLabel: string;
  items: CatalogItem[];
}

export interface OrderItemForm {
  productType: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPriceKzt: number;
  isCustomName?: boolean;
}

export const MOOD_CATALOG: CatalogCategory[] = [
  {
    key: 'DAIRY',
    label: '🧀 Сыры и молочная продукция (CHEESY MOOD)',
    shortLabel: 'Сыры/Молоко',
    items: [
      { name: 'Страчателла в свежих сливках (200 г)', unit: 'банка', priceKzt: 1800 },
      { name: 'Моцарелла Фиор ди Латте (шарик 125 г)', unit: 'шарик', priceKzt: 950 },
      { name: 'Сыр Сулугуни копченый на буке (400 г)', unit: 'головка', priceKzt: 1800 },
      { name: 'Сыр Сулугуни свежий классический (1 кг)', unit: 'кг', priceKzt: 4500 },
      { name: 'Маскарпоне домашний 80% (250 г)', unit: 'банка', priceKzt: 1450 },
      { name: 'Сыр Адыгейский нежный на сыворотке (400 г)', unit: 'упак', priceKzt: 1280 },
      { name: 'Творог пластовой фермерский 9% (400 г)', unit: 'пачка', priceKzt: 1100 },
      { name: 'Сметана фермерская 30% (350 г)', unit: 'банка', priceKzt: 950 }
    ]
  },
  {
    key: 'BAKERY',
    label: '🥖 Хлеб и ремесленная пекарня (BAKE MOOD)',
    shortLabel: 'Пекарня',
    items: [
      { name: 'Тартин подовый на ржаной закваске (650 г)', unit: 'буханка', priceKzt: 850 },
      { name: 'Чиабатта на сыворотке 82% гидратация (300 г)', unit: 'шт', priceKzt: 550 },
      { name: 'Тартин с оливками каламата и розмарином (600 г)', unit: 'буханка', priceKzt: 1200 },
      { name: 'Багет хрустящий на пулише (250 г)', unit: 'шт', priceKzt: 450 },
      { name: 'Хлеб Бородинский на солодовой заварке (500 г)', unit: 'буханка', priceKzt: 600 }
    ]
  },
  {
    key: 'MEAT',
    label: '🍖 Мясная гастрономия и колбасы (MEAT MOOD)',
    shortLabel: 'Мясо/Колбасы',
    items: [
      { name: 'Билтонг из конины Жая сыровяленый (50 г)', unit: 'пакет', priceKzt: 1750 },
      { name: 'Билтонг из говядины сушеный (100 г)', unit: 'пакет', priceKzt: 2200 },
      { name: 'Колбаски Охотничьи в/к (вакуум 320 г)', unit: 'упак', priceKzt: 3040 },
      { name: 'Ребра свиные копчено-вареные медовые (500 г)', unit: 'упак', priceKzt: 3500 },
      { name: 'Грудинка свиная копченая / Бекон в/к (350 г)', unit: 'упак', priceKzt: 1820 },
      { name: 'Сервелат Голштинский с/к (батон 450 г)', unit: 'батон', priceKzt: 3420 },
      { name: 'Карбонад запеченный деликатесный (400 г)', unit: 'упак', priceKzt: 3000 }
    ]
  },
  {
    key: 'SAUCES_SPICES',
    label: '🌶️ Соусы и смеси пряностей (SPICY LAB)',
    shortLabel: 'Соусы/Специи',
    items: [
      { name: 'Острый соус Piri-Piri MOOD фирменный (150 мл)', unit: 'бут', priceKzt: 1650 },
      { name: 'Крафтовый соус BBQ на стауте BEERMOOD (250 мл)', unit: 'бут', priceKzt: 1850 },
      { name: 'Ферментированная Шрирача «Жарокова Hot» (200 мл)', unit: 'бут', priceKzt: 1950 },
      { name: 'Фирменная смесь специй для вяления билтонга (200 г)', unit: 'банка', priceKzt: 1400 },
      { name: 'Пряная натирка для копченых ребер и грудинки (250 г)', unit: 'банка', priceKzt: 1250 }
    ]
  },
  {
    key: 'PUB',
    label: '🍺 Кухня и бар BEERMOOD.PUB',
    shortLabel: 'Паб/Кухня',
    items: [
      { name: 'Колбаски Нюрнбергские гриль с горчицей (300 г)', unit: 'порция', priceKzt: 2900 },
      { name: 'Суп-кит «Солянка Мясная Сборная на бульоне Коха»', unit: 'набор', priceKzt: 2400 },
      { name: 'Крафтовое пиво BEERMOOD Golden Ale (1 л)', unit: 'литр', priceKzt: 1600 },
      { name: 'Крафтовое пиво BEERMOOD Oatmeal Stout (1 л)', unit: 'литр', priceKzt: 1800 }
    ]
  },
  {
    key: 'CUSTOM',
    label: '✏️ Другое / Произвольный товар',
    shortLabel: 'Другое',
    items: []
  }
];

@Component({
  selector: 'app-arai-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-wrapper">
      <div class="module-header">
        <div>
          <h2>🛍️ Заказы жильцов ЖК «Арай» и Takeaway</h2>
          <p class="subtitle">
            Локальная доставка крафтовой гастрономии по подъездам и блокам (Г1, Г2, Г3, Г4) ЖК «Арай» (ул. Жарокова 137/1). Автоматический расчет скидки 10% программы MOOD CLUB, маркировка пакетов и печать стикеров на TSC TE310.
          </p>
        </div>
        <button class="btn btn-primary" (click)="toggleNewOrderModal()">
          + Новый заказ жильца
        </button>
      </div>

      <!-- Quick Stats Filter Bar -->
      <div class="order-stats-strip">
        <div class="filter-group">
          <button class="filter-btn" [class.active]="statusFilter() === 'ALL'" (click)="statusFilter.set('ALL')">
            Все заказы ({{ erp.araiOrders().length }})
          </button>
          <button class="filter-btn" [class.active]="statusFilter() === 'PENDING'" (click)="statusFilter.set('PENDING')">
            Активные / В сборке
          </button>
          <button class="filter-btn" [class.active]="statusFilter() === 'DELIVERED'" (click)="statusFilter.set('DELIVERED')">
            Доставленные
          </button>
        </div>

        <div class="search-box">
          <input type="text" [(ngModel)]="searchTxt" placeholder="Поиск по фамилии, телефону или квартире...">
        </div>
      </div>

      <!-- Order Cards List -->
      <div class="orders-grid">
        <div class="order-card" *ngFor="let ord of filteredOrders()">
          <div class="ord-head">
            <div class="ord-num-block">
              <span class="ord-number font-mono">{{ ord.orderNumber }}</span>
              <span class="badge badge-amber">БЛОК {{ ord.block }} • {{ ord.apartment }}</span>
            </div>
            <span class="badge" [ngClass]="{
              'badge-ruby': ord.status === 'NEW',
              'badge-amber': ord.status === 'PREPARING',
              'badge-cyan': ord.status === 'PACKED_LABELED',
              'badge-emerald': ord.status === 'DELIVERED'
            }">{{ ord.status }}</span>
          </div>

          <div class="customer-info">
            <div class="c-name"><strong>{{ ord.customerName }}</strong></div>
            <div class="c-phone">📞 {{ ord.phone }}</div>
            <div class="c-slot">🕒 Слот: <strong>{{ ord.deliverySlot }}</strong> ({{ ord.deliveryDate }})</div>
          </div>

          <div class="items-list">
            <div class="item-row" *ngFor="let it of ord.items">
              <span class="it-name">
                <span class="it-type-tag" *ngIf="it.productType">{{ getShortType(it.productType) }}</span>
                {{ it.productName }}
              </span>
              <span class="it-qty font-mono">x{{ it.quantity }} {{ it.unit }}</span>
              <span class="it-sum font-mono">{{ erp.formatMoney(it.totalKzt) }}</span>
            </div>
          </div>

          <div class="ord-calc">
            <div class="calc-line text-muted">
              <span>Сумма без скидки:</span>
              <span class="font-mono">{{ erp.formatMoney(ord.subtotalKzt) }}</span>
            </div>
            <div class="calc-line text-emerald">
              <span>Скидка жильца ({{ ord.moodClubDiscountPct }}%):</span>
              <span class="font-mono">-{{ erp.formatMoney(ord.discountSumKzt) }}</span>
            </div>
            <div class="calc-line total-line">
              <span>К оплате ({{ ord.paymentMethod }}):</span>
              <span class="font-mono text-gold font-bold">{{ erp.formatMoney(ord.finalTotalKzt) }}</span>
            </div>
          </div>

          <div class="ord-footer">
            <div class="status-ctrl">
              <select [ngModel]="ord.status" (ngModelChange)="onStatusChange(ord.id, $event)">
                <option value="NEW">Новый</option>
                <option value="PREPARING">В сборке</option>
                <option value="PACKED_LABELED">Маркирован</option>
                <option value="DELIVERED">Доставлен</option>
              </select>
            </div>
            <button class="btn btn-outline" (click)="printOrderLabel(ord)">
              🏷️ Стикер TSC TE310
            </button>
          </div>
        </div>
      </div>

      <!-- New Order Modal Drawer -->
      <section class="modal-box-overlay" *ngIf="isNewModalOpen()">
        <div class="new-order-panel">
          <div class="panel-head">
            <div>
              <h3>Оформление заказа жильца ЖК «Арай»</h3>
              <p class="panel-subtitle">Выбор продукции из каталога MOOD GROUP или свободный ввод</p>
            </div>
            <button class="btn-close" (click)="isNewModalOpen.set(false)">✕</button>
          </div>

          <div class="panel-body">
            <div class="form-row">
              <div class="field">
                <label>Имя и фамилия заказчика</label>
                <input type="text" [(ngModel)]="newCustName" placeholder="Например: Канат Ибрагимов">
              </div>
              <div class="field">
                <label>Контактный телефон (WhatsApp)</label>
                <input type="text" [(ngModel)]="newPhone" placeholder="+7 701 123 4567">
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label>Блок в ЖК «Арай»</label>
                <select [(ngModel)]="newBlock">
                  <option value="Г1">Блок Г1</option>
                  <option value="Г2">Блок Г2</option>
                  <option value="Г3">Блок Г3 (над пабом)</option>
                  <option value="Г4">Блок Г4</option>
                  <option value="Внешний клиент">Внешний клиент / Самовывоз</option>
                </select>
              </div>
              <div class="field">
                <label>Номер квартиры / Офиса</label>
                <input type="text" [(ngModel)]="newApartment" placeholder="кв. 85 / этаж 6">
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label>Дата доставки</label>
                <input type="date" [(ngModel)]="newDeliveryDate">
              </div>
              <div class="field">
                <label>Интервал доставки</label>
                <select [(ngModel)]="newSlot">
                  <option value="08:00 - 09:30">Утро: 08:00 – 09:30</option>
                  <option value="13:00 - 14:00">Обед: 13:00 – 14:00</option>
                  <option value="18:30 - 20:00">Вечер: 18:30 – 20:00</option>
                  <option value="TAKEAWAY_PUB">Самовывоз в BEERMOOD.PUB</option>
                </select>
              </div>
            </div>

            <!-- Items Builder with Product Type and Product Name Pickers -->
            <div class="items-picker">
              <div class="picker-header">
                <label class="sec-subtitle">Товары в заказе (Каталог MOOD GROUP)</label>
                <div class="quick-add-chips">
                  <span class="quick-add-title">Быстрое добавление:</span>
                  <button class="chip-btn" (click)="quickAddItem('DAIRY', 'Страчателла в свежих сливках (200 г)')">+ Страчателла</button>
                  <button class="chip-btn" (click)="quickAddItem('BAKERY', 'Тартин подовый на ржаной закваске (650 г)')">+ Тартин</button>
                  <button class="chip-btn" (click)="quickAddItem('MEAT', 'Билтонг из конины Жая сыровяленый (50 г)')">+ Билтонг Жая</button>
                  <button class="chip-btn" (click)="quickAddItem('SAUCES_SPICES', 'Острый соус Piri-Piri MOOD фирменный (150 мл)')">+ Piri-Piri</button>
                </div>
              </div>

              <div class="builder-table">
                <div class="builder-row header-row">
                  <div class="col-type">Тип продукции</div>
                  <div class="col-name">Название продукта</div>
                  <div class="col-qty">Кол-во</div>
                  <div class="col-unit">Ед.</div>
                  <div class="col-price">Цена (₸)</div>
                  <div class="col-total">Сумма</div>
                  <div class="col-act"></div>
                </div>

                <div class="builder-row" *ngFor="let it of newItems; let idx = index">
                  <!-- Поле 1: Тип продукции -->
                  <div class="col-type">
                    <select [(ngModel)]="it.productType" (ngModelChange)="onTypeChange(it)">
                      <option *ngFor="let cat of catalogCategories" [value]="cat.key">
                        {{ cat.shortLabel }}
                      </option>
                    </select>
                  </div>

                  <!-- Поле 2: Название продукта -->
                  <div class="col-name">
                    <ng-container *ngIf="it.productType !== 'CUSTOM' && !it.isCustomName">
                      <select [(ngModel)]="it.productName" (ngModelChange)="onProductNameSelect(it)">
                        <option value="" disabled>-- Выберите продукт --</option>
                        <option *ngFor="let p of getCategoryItems(it.productType)" [value]="p.name">
                          {{ p.name }} ({{ p.priceKzt }} ₸)
                        </option>
                      </select>
                      <button class="btn-icon" title="Ввести собственное название" (click)="it.isCustomName = true">✏️</button>
                    </ng-container>

                    <ng-container *ngIf="it.productType === 'CUSTOM' || it.isCustomName">
                      <input
                        type="text"
                        [(ngModel)]="it.productName"
                        placeholder="Введите название продукта..."
                      >
                      <button class="btn-icon" *ngIf="it.productType !== 'CUSTOM'" title="Выбрать из каталога" (click)="it.isCustomName = false; onTypeChange(it)">📋</button>
                    </ng-container>
                  </div>

                  <!-- Поле 3: Количество -->
                  <div class="col-qty">
                    <input
                      type="number"
                      min="1"
                      [(ngModel)]="it.quantity"
                      (input)="recalcNewSubtotal()"
                      placeholder="1"
                    >
                  </div>

                  <!-- Поле 4: Единица измерения -->
                  <div class="col-unit">
                    <input type="text" [(ngModel)]="it.unit" placeholder="шт">
                  </div>

                  <!-- Поле 5: Цена за единицу -->
                  <div class="col-price">
                    <input
                      type="number"
                      [(ngModel)]="it.unitPriceKzt"
                      (input)="recalcNewSubtotal()"
                      placeholder="0"
                    >
                  </div>

                  <!-- Сумма строки -->
                  <div class="col-total font-mono">
                    {{ erp.formatMoney(it.quantity * it.unitPriceKzt) }}
                  </div>

                  <!-- Удалить -->
                  <div class="col-act">
                    <button class="btn-del" (click)="removeItem(idx)" title="Удалить позицию">✕</button>
                  </div>
                </div>
              </div>

              <button class="btn-sm btn-outline" style="margin-top: 10px;" (click)="addItem()">
                + Добавить позицию
              </button>
            </div>

            <!-- Total Summary Card -->
            <div class="order-summary-box">
              <div class="summary-row">
                <span>Промежуточный итог:</span>
                <span class="font-mono">{{ erp.formatMoney(newSubtotal) }}</span>
              </div>
              <div class="summary-row text-emerald">
                <span>Скидка жильца MOOD CLUB (10%):</span>
                <span class="font-mono">-{{ erp.formatMoney(newSubtotal * 0.10) }}</span>
              </div>
              <div class="summary-row font-bold total-text">
                <span>Итого к оплате:</span>
                <span class="font-mono text-gold font-bold">{{ erp.formatMoney(newSubtotal * 0.90) }}</span>
              </div>
            </div>
          </div>

          <div class="panel-foot">
            <button class="btn btn-outline" (click)="isNewModalOpen.set(false)">Отмена</button>
            <button class="btn btn-primary" (click)="createOrder()" [disabled]="newItems.length === 0 || !newCustName">
              ✓ Сохранить и создать стикер TSC
            </button>
          </div>
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
    .order-stats-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      gap: 14px;
      flex-wrap: wrap;
    }
    .filter-group { display: flex; gap: 6px; }
    .filter-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
    }
    .filter-btn.active {
      background: var(--accent-amber);
      color: #fff;
      border-color: var(--accent-amber);
    }
    .search-box input {
      background: var(--bg-surface);
      border: 1px solid var(--border-strong);
      color: #fff;
      padding: 7px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      min-width: 320px;
    }
    .orders-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 18px;
    }
    .order-card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.16s ease;
    }
    .order-card:hover { border-color: var(--accent-amber); }
    .ord-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .ord-num-block { display: flex; align-items: center; gap: 8px; }
    .ord-number { font-weight: 800; font-size: 0.95rem; color: #fff; }
    .customer-info {
      background: var(--bg-surface);
      padding: 10px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 0.8rem;
    }
    .c-name { font-size: 0.9rem; color: #fff; }
    .c-phone { color: var(--accent-cyan); margin: 2px 0; }
    .c-slot { color: var(--text-secondary); font-size: 0.75rem; }
    .items-list {
      border-top: 1px dashed var(--border-subtle);
      border-bottom: 1px dashed var(--border-subtle);
      padding: 8px 0;
      margin-bottom: 12px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.76rem;
      padding: 3px 0;
    }
    .it-name { flex: 2; color: var(--text-primary); display: flex; align-items: center; gap: 6px; }
    .it-type-tag {
      font-size: 0.65rem;
      background: var(--bg-surface-elevated);
      color: var(--accent-amber);
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid var(--border-subtle);
    }
    .it-qty { flex: 1; text-align: center; color: var(--text-muted); }
    .it-sum { flex: 1; text-align: right; color: var(--accent-amber); }
    .ord-calc { font-size: 0.76rem; margin-bottom: 14px; }
    .calc-line { display: flex; justify-content: space-between; padding: 2px 0; }
    .total-line { font-size: 0.9rem; border-top: 1px solid var(--border-subtle); padding-top: 4px; margin-top: 4px; }
    .ord-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .status-ctrl select {
      background: var(--bg-surface);
      color: #fff;
      border: 1px solid var(--border-strong);
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 0.76rem;
    }
    .modal-box-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      z-index: 200;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .new-order-panel {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--accent-amber);
      border-radius: 12px;
      max-width: 860px;
      width: 100%;
      max-height: 92vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 10px 40px rgba(0,0,0,0.9);
    }
    .panel-head {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: var(--bg-card);
    }
    .panel-head h3 { font-size: 1.15rem; color: #fff; margin: 0; }
    .panel-subtitle { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .btn-close { background: none; border: none; color: var(--text-muted); font-size: 1.4rem; cursor: pointer; }
    .panel-body { padding: 20px; overflow-y: auto; flex: 1; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
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
      font-size: 0.82rem;
    }
    .items-picker {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 14px;
      margin: 16px 0;
    }
    .picker-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sec-subtitle { font-size: 0.78rem; color: var(--accent-amber); text-transform: uppercase; font-weight: 700; margin: 0; }
    .quick-add-chips { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .quick-add-title { font-size: 0.68rem; color: var(--text-muted); }
    .chip-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--accent-cyan);
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.70rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .chip-btn:hover { background: var(--accent-cyan); color: #000; }
    .builder-table { width: 100%; display: flex; flex-direction: column; gap: 6px; }
    .builder-row {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg-surface);
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid var(--border-subtle);
    }
    .header-row {
      background: transparent;
      border: none;
      padding: 0 10px;
      font-size: 0.68rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
    }
    .col-type { width: 140px; }
    .col-name { flex: 2; display: flex; align-items: center; gap: 4px; }
    .col-qty { width: 65px; }
    .col-unit { width: 55px; }
    .col-price { width: 90px; }
    .col-total { width: 85px; text-align: right; color: var(--accent-gold); font-size: 0.78rem; }
    .col-act { width: 28px; text-align: center; }
    .builder-row select, .builder-row input {
      width: 100%;
      background: var(--bg-surface-elevated);
      border: 1px solid var(--border-strong);
      color: #fff;
      padding: 6px 8px;
      border-radius: 5px;
      font-size: 0.78rem;
    }
    .btn-icon {
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 0.82rem;
      padding: 2px 4px;
    }
    .btn-del {
      background: transparent;
      border: none;
      color: var(--accent-ruby);
      cursor: pointer;
      font-size: 1.1rem;
      line-height: 1;
    }
    .btn-del:hover { color: #ff5555; }
    .order-summary-box {
      background: var(--bg-surface);
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 0.8rem;
      border-left: 3px solid var(--accent-emerald);
    }
    .summary-row { display: flex; justify-content: space-between; padding: 3px 0; }
    .total-text { font-size: 0.95rem; border-top: 1px solid var(--border-subtle); padding-top: 6px; margin-top: 4px; }
    .panel-foot {
      padding: 14px 20px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--bg-card);
    }
    .text-emerald { color: var(--accent-emerald); }
    .text-gold { color: var(--accent-gold); }
    .font-bold { font-weight: 700; }
  `]
})
export class AraiOrdersComponent {
  erp = inject(MasterErpService);

  catalogCategories = MOOD_CATALOG;
  statusFilter = signal<string>('ALL');
  searchTxt = '';
  isNewModalOpen = signal<boolean>(false);

  newCustName = '';
  newPhone = '+7 701 ';
  newBlock: AraiResidentOrder['block'] = 'Г3';
  newApartment = 'кв. ';
  newDeliveryDate = '2026-09-28';
  newSlot: DeliverySlot = '18:30 - 20:00';

  newItems: OrderItemForm[] = [
    {
      productType: 'DAIRY',
      productName: 'Страчателла в свежих сливках (200 г)',
      quantity: 1,
      unit: 'банка',
      unitPriceKzt: 1800
    },
    {
      productType: 'BAKERY',
      productName: 'Тартин подовый на ржаной закваске (650 г)',
      quantity: 1,
      unit: 'буханка',
      unitPriceKzt: 850
    }
  ];
  newSubtotal = 2650;

  getCategoryItems(typeKey: string): CatalogItem[] {
    const cat = this.catalogCategories.find((c) => c.key === typeKey);
    return cat ? cat.items : [];
  }

  getShortType(typeKey: string): string {
    const cat = this.catalogCategories.find((c) => c.key === typeKey);
    return cat ? cat.shortLabel : typeKey;
  }

  filteredOrders = () => {
    const f = this.statusFilter();
    const q = this.searchTxt.toLowerCase().trim();
    return this.erp.araiOrders().filter((o) => {
      const matchFilter =
        f === 'ALL' ||
        (f === 'PENDING' && o.status !== 'DELIVERED') ||
        (f === 'DELIVERED' && o.status === 'DELIVERED');

      const matchQ =
        !q ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.apartment.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q);

      return matchFilter && matchQ;
    });
  };

  toggleNewOrderModal() {
    this.isNewModalOpen.set(!this.isNewModalOpen());
    if (this.isNewModalOpen()) {
      this.recalcNewSubtotal();
    }
  }

  onTypeChange(it: OrderItemForm) {
    const items = this.getCategoryItems(it.productType);
    if (items.length > 0) {
      it.productName = items[0].name;
      it.unit = items[0].unit;
      it.unitPriceKzt = items[0].priceKzt;
    } else {
      it.productName = '';
      it.unit = 'шт';
      it.unitPriceKzt = 1000;
    }
    this.recalcNewSubtotal();
  }

  onProductNameSelect(it: OrderItemForm) {
    const items = this.getCategoryItems(it.productType);
    const found = items.find((p) => p.name === it.productName);
    if (found) {
      it.unit = found.unit;
      it.unitPriceKzt = found.priceKzt;
    }
    this.recalcNewSubtotal();
  }

  quickAddItem(typeKey: string, productName: string) {
    const items = this.getCategoryItems(typeKey);
    const found = items.find((p) => p.name === productName);
    if (found) {
      this.newItems.push({
        productType: typeKey,
        productName: found.name,
        quantity: 1,
        unit: found.unit,
        unitPriceKzt: found.priceKzt
      });
    } else {
      this.newItems.push({
        productType: typeKey,
        productName,
        quantity: 1,
        unit: 'шт',
        unitPriceKzt: 1000
      });
    }
    this.recalcNewSubtotal();
  }

  addItem() {
    this.newItems.push({
      productType: 'DAIRY',
      productName: 'Страчателла в свежих сливках (200 г)',
      quantity: 1,
      unit: 'банка',
      unitPriceKzt: 1800
    });
    this.recalcNewSubtotal();
  }

  removeItem(index: number) {
    this.newItems.splice(index, 1);
    this.recalcNewSubtotal();
  }

  recalcNewSubtotal() {
    this.newSubtotal = this.newItems.reduce(
      (sum, it) => sum + (it.quantity || 0) * (it.unitPriceKzt || 0),
      0
    );
  }

  onStatusChange(orderId: string, status: OrderStatus) {
    this.erp.updateOrderStatus(orderId, status);
  }

  createOrder() {
    if (!this.newCustName) return;
    const items: OrderItem[] = this.newItems.map((it, idx) => ({
      id: String(idx + 1),
      productType: it.productType,
      productName: it.productName,
      unit: it.unit,
      quantity: it.quantity,
      unitPriceKzt: it.unitPriceKzt,
      totalKzt: it.quantity * it.unitPriceKzt
    }));

    const created = this.erp.addAraiOrder({
      customerName: this.newCustName,
      phone: this.newPhone,
      block: this.newBlock,
      apartment: this.newApartment,
      deliveryDate: this.newDeliveryDate,
      deliverySlot: this.newSlot,
      items,
      subtotalKzt: this.newSubtotal,
      moodClubDiscountPct: 10,
      paymentMethod: 'KASPI_QR',
      status: 'NEW'
    });

    this.isNewModalOpen.set(false);
    this.printOrderLabel(created);
  }

  printOrderLabel(order: AraiResidentOrder) {
    const tspl = this.erp.generateOrderTspl(order);
    this.erp.openTsplModal(tspl, `Стикер доставки: ${order.orderNumber} (${order.customerName})`);
  }
}
