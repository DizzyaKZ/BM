import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerOrder, GiantLine } from '../models/erp.models';

@Component({
  selector: 'app-order-intake',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid-2">
      <!-- ФОРМА ПРИЕМА НОВОГО ЗАКАЗА (TELEGRAM ЖК АРАЙ / ПАБ) -->
      <div class="card">
        <h3><span>➕ Прием нового заказа (Telegram ЖК «Арай» 09:00–19:00 / Касса)</span><span class="pill pill-ok">Kaspi QR Prepay</span></h3>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px;">
          <label>Квартира / Стол:
            <input type="text" [(ngModel)]="newApt" style="width:100%; margin-top:3px;">
          </label>
          <label>Телефон клиента:
            <input type="text" [(ngModel)]="newPhone" style="width:100%; margin-top:3px;">
          </label>
          <label>Слот доставки:
            <select [(ngModel)]="newSlot" style="width:100%; margin-top:3px;">
              <option value="MORNING_0730">🌅 Утро 07:30–09:00 (Завтрак)</option>
              <option value="EVENING_1830">🌙 Вечер 18:30–20:00 (Ужин)</option>
            </select>
          </label>
        </div>

        <div style="display:flex; gap:8px; margin-bottom:10px;">
          <select [(ngModel)]="selectedPluToAdd" style="flex:1;">
            @for (p of lines(); track p.plu) {
              <option [ngValue]="p.plu">{{ p.plu }} — {{ p.name }} ({{ p.packG }} г)</option>
            }
          </select>
          <input type="number" [(ngModel)]="qtyToAdd" min="1" max="20" style="width:70px;">
          <button class="btn btn-green" (click)="submitQuickOrder()">+ Создать заказ в листе сборки</button>
        </div>

        <!-- ЛИСТ СБОРКИ И ДОСТАВКИ КУРЬЕРАМИ-ПОДРОСТКАМИ -->
        <h4 style="margin:12px 0 8px 0; color:var(--amber);">📋 Активные маршрутные листы сборки и доставки:</h4>
        @for (o of orders(); track o.orderId) {
          <div style="background:var(--panel-alt); border:1px solid var(--border); border-radius:8px; padding:10px; margin-bottom:8px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>Заказ #{{ o.orderId }} • 🚪 {{ o.apt }} ({{ o.slot === 'MORNING_0730' ? 'Утро 07:30' : 'Вечер 18:30' }})</strong>
              <span class="pill" [ngClass]="o.status === 'PACKED' ? 'pill-ok' : 'pill-warn'">{{ o.status }}</span>
            </div>
            <div style="font-size:11.5px; color:var(--muted); margin:4px 0;">
              @for (it of o.items; track it.plu) {
                <span>[{{ it.plu }} {{ it.name }} × {{ it.qty }} уп.] </span>
              }
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
              <strong style="color:#7ee787;">Итого (MOOD Club -10%): {{ getOrderTotal(o) | number }} ₸</strong>
              <div style="display:flex; gap:6px;">
                <button class="btn btn-sm btn-outline" (click)="packOrder.emit(o.orderId)">✓ Собрать и списать с полки</button>
                <button class="btn btn-sm" (click)="printOrderLabel.emit(o)">🖨️ Этикетка доставки</button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- МОНИТОРИНГ ПОТРЕБНОСТИ В ГОТОВОЙ ПРОДУКЦИИ И ЗАЩИТА ОТ ЗАТОВАРИВАНИЯ -->
      <div class="card">
        <h3><span>📊 Мониторинг потребности полки Take-away и рисков затоваривания</span><span class="pill pill-pivot">Real-Time Баланс</span></h3>
        <table class="mini-table">
          <thead>
            <tr><th>PLU / Продукт</th><th>На полке</th><th>В заказах</th><th>Баланс</th><th>Рекомендация ERP</th></tr>
          </thead>
          <tbody>
            @for (p of lines().slice(0, 14); track p.plu) {
              <tr>
                <td><strong>{{ p.plu }} {{ p.name }}</strong></td>
                <td>{{ p.shelfStockUnits }} уп.</td>
                <td>{{ getOrderedUnits(p.plu) }} уп.</td>
                <td [style.color]="p.shelfStockUnits - getOrderedUnits(p.plu) < 0 ? '#f85149' : '#7ee787'">
                  {{ p.shelfStockUnits - getOrderedUnits(p.plu) }} уп.
                </td>
                <td>
                  @if (p.shelfStockUnits - getOrderedUnits(p.plu) < 0) {
                    <span class="pill pill-crit">🔥 ДОВЫПУСК В СМЕНУ</span>
                  } @else if (p.shelfStockUnits > 25 && p.shelfDays <= 10) {
                    <span class="pill pill-pivot">⇄ МАНЕВР (АНТИ-ЗАТОВАРИВАНИЕ)</span>
                  } @else {
                    <span class="pill pill-ok">ОПТИМАЛЬНО</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class OrderIntakeComponent {
  orders = input.required<CustomerOrder[]>();
  lines = input.required<GiantLine[]>();
  createOrder = output<CustomerOrder>();
  packOrder = output<number>();
  printOrderLabel = output<CustomerOrder>();

  newApt = 'Кв. 215 (Блок Г3)';
  newPhone = '+7 701 888-99-00';
  newSlot: 'MORNING_0730' | 'EVENING_1830' = 'MORNING_0730';
  selectedPluToAdd = 'PLU-02';
  qtyToAdd = 2;

  getOrderTotal(o: CustomerOrder): number {
    return o.items.reduce((s, x) => s + x.qty * x.pricePackKzt, 0);
  }
  getOrderedUnits(plu: string): number {
    let sum = 0;
    for (const o of this.orders()) {
      if (o.status !== 'DELIVERED') {
        for (const it of o.items) { if (it.plu === plu) sum += it.qty; }
      }
    }
    return sum;
  }
  submitQuickOrder(): void {
    const line = this.lines().find(x => x.plu === this.selectedPluToAdd) || this.lines()[0];
    const packPrice = Math.round(((line.priceKg / 1000) * line.packG) * 0.90);
    this.createOrder.emit({
      orderId: Math.floor(Math.random() * 900 + 110),
      source: 'Telegram ЖК Арай',
      apt: this.newApt,
      phone: this.newPhone,
      slot: this.newSlot,
      isPrepaidKaspi: true,
      status: 'NEW',
      items: [{ plu: line.plu, name: line.name, qty: this.qtyToAdd, pricePackKzt: packPrice }]
    });
  }
}
