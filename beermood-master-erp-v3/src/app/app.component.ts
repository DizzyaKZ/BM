import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ErpStoreService } from './services/erp-store.service';
import { KpiBadgeComponent } from './components/kpi-badge.component';
import { PackEconComponent } from './components/pack-econ.component';
import { HaccpDrawerComponent } from './components/haccp-drawer.component';
import { OrderIntakeComponent } from './components/order-intake.component';
import { GiantLine, CustomerOrder } from './models/erp.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, KpiBadgeComponent, PackEconComponent, HaccpDrawerComponent, OrderIntakeComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {
  store = inject(ErpStoreService);
  readonly days30 = Array.from({ length: 30 }, (_, i) => i + 1);
  readonly depts = [
    { id: 'ALL', label: 'Все цеха (24)' },
    { id: 'CHEESY MOOD', label: '🧀 CHEESY MOOD (7)' },
    { id: 'Пекарня MEAT&BREAD', label: '🥖 Пекарня Unox (3)' },
    { id: 'Мясной цех MEAT&BREAD', label: '🥩 Мясной цех Ижица (9)' },
    { id: 'BEERMOOD & SPICE LAB', label: '🌶️ Соусы, Суп-киты, Специи, Пиво (5)' }
  ];

  getDow(day: number): string {
    return this.store.dowList[(day - 1) % 7];
  }
  filteredLines(): GiantLine[] {
    const d = this.store.giantDept();
    return d === 'ALL' ? this.store.lines() : this.store.lines().filter(x => x.dept === d);
  }
  getLinesByDept(dept: string): GiantLine[] {
    return this.store.lines().filter(x => x.dept === dept);
  }
  currentLine(): GiantLine | undefined {
    return this.store.lines().find(x => x.plu === this.store.selectedPlu());
  }
  openDrawer(plu: string): void {
    this.store.selectedPlu.set(plu);
    this.store.drawerOpen.set(true);
  }
  openInTspl(plu: string): void {
    this.store.selectedPlu.set(plu);
    this.store.drawerOpen.set(false);
    this.store.activeTab.set('tspl');
  }
  selectPluAndDay(plu: string, day: number): void {
    this.store.selectedPlu.set(plu);
    this.store.giantDay.set(day);
  }
  getAdjustedKg(p: GiantLine): number {
    if (!this.store.giantPivot()) return p.monthlyKg;
    if (p.shortRisk && p.pivotRatio) return p.monthlyKg - Math.round(p.monthlyKg * p.pivotRatio);
    if (p.isBuffer && p.bonusKg) return p.monthlyKg + p.bonusKg;
    return p.monthlyKg;
  }
  getCell(p: GiantLine, day: number) {
    const isSup = p.supplyDays.includes(day);
    const isProd = p.prodDays.includes(day);
    let lastProd: number | null = null;
    for (const d of p.prodDays) { if (d <= day) lastProd = d; }
    const rem = lastProd !== null ? (p.shelfDays - (day - lastProd)) : null;

    if (isSup && isProd) return { cls: 'c-sp', sym: 'S+P', label: 'Поставка+Варка', pill: 'pill-ok' };
    if (isProd) return { cls: 'c-prd', sym: 'P', label: 'Выработка', pill: 'pill-ok' };
    if (isSup) return { cls: 'c-sup', sym: 'S', label: 'Поставка сырья', pill: 'pill-ok' };
    if (this.store.giantPivot() && p.shortRisk && day % 3 === 0) return { cls: 'c-pvt', sym: '⇄', label: 'Маневр линии', pill: 'pill-pivot' };
    if (rem !== null && rem > 0) {
      if (rem <= 2) return { cls: 'c-crt', sym: rem + 'д!', label: 'КРИТИЧНО (' + rem + 'д)', pill: 'pill-crit' };
      if (rem / p.shelfDays <= 0.35) return { cls: 'c-wrn', sym: rem + 'д', label: 'Промо -10%', pill: 'pill-warn' };
      return { cls: 'c-ok', sym: rem + 'д', label: 'Свежий (' + rem + 'д)', pill: 'pill-ok' };
    }
    return { cls: '', sym: '', label: 'Ожидание', pill: 'pill-ok' };
  }
  getBrineSaltGrams(): number {
    const map: Record<number, number> = { 10: 10.8, 12: 13.0, 14: 15.2 };
    return Math.round((this.store.kochBatchKg() * 0.20 * 1000) * ((map[this.store.brineBe()] || 10.8) / 100));
  }
  acceptNewMilkBatch(): void {
    this.store.rawBatches.set([
      { batchId: 'Т-03-' + Math.floor(Math.random() * 899 + 100), supplier: 'КХ Береке (1 сорт)', category: 'Молоко сырое', qty: 210, unit: 'л', fatPct: 4.48, protPct: 3.32, phVal: 6.69, waterAddedPct: 0.00, verdict: 'PASSED', receivedAt: 'Сегодня' },
      ...this.store.rawBatches()
    ]);
  }
  recordQuickMovement(): void {
    const p = this.currentLine() || this.store.lines()[0];
    this.store.movements.set([
      { id: Date.now(), batchCode: this.store.tsplBatch(), plu: p.plu, productName: p.name, fromLoc: 'Цех -7.800', toLoc: 'Витрина Take-away -4.200', qtyUnits: 15, movedAt: 'Сейчас' },
      ...this.store.movements()
    ]);
  }
  addCustomerOrder(o: CustomerOrder): void {
    this.store.orders.set([o, ...this.store.orders()]);
  }
  packCustomerOrder(orderId: number): void {
    const ord = this.store.orders().find(x => x.orderId === orderId);
    if (ord && ord.status !== 'PACKED') {
      ord.status = 'PACKED';
      for (const it of ord.items) {
        const line = this.store.lines().find(l => l.plu === it.plu);
        if (line) line.shelfStockUnits = Math.max(0, line.shelfStockUnits - it.qty);
      }
      this.store.orders.set([...this.store.orders()]);
      this.store.lines.set([...this.store.lines()]);
    }
  }
  printCustomerOrder(o: CustomerOrder): void {
    const tspl = `SIZE 58 mm, 60 mm\r\nCLS\r\nTEXT 25,25,"3",0,1,1,"ДОСТАВКА ЖК АРАЙ #"${o.orderId}\r\nTEXT 25,65,"2",0,1,1,"${o.apt}"\r\nPRINT 1,1`;
    this.store.printTspl(tspl);
  }
  getKcal(p: GiantLine): number {
    return Math.round(p.prot * 4 + p.fat * 9 + p.carb * 4);
  }
  getEan12(p: GiantLine): string {
    return p.eanPrefix + String(p.packG).padStart(6, '0');
  }
  getClubPackPrice(p: GiantLine): number {
    return Math.round(((p.priceKg / 1000) * p.packG) * 0.90);
  }
  buildTsplCode(): string {
    if (this.store.tsplMode() === 'MILK_OK') {
      return `SIZE 58 mm, 60 mm\nGAP 2 mm, 0 mm\nCODEPAGE 1251\nCLS\nBOX 15,15,680,705,3\nTEXT 180,25,"3",0,1,1,"АКТ ПРИЕМКИ МОЛОКА"\nTEXT 25,70,"2",0,1,1,"Поставщик: КХ Береке | Жир: 4.53% | Белок: 3.30%"\nTEXT 25,110,"2",0,1,1,"Вода доб.: 0.00% (ЧИСТО) | pH: 6.70"\nTEXT 65,200,"3",0,1,1,"ВЕРДИКТ: [ СЫРЬЕ ГОДНО / 1 СОРТ ]"\nPRINT 1, 1`;
    }
    if (this.store.tsplMode() === 'MILK_BAD') {
      return `SIZE 58 mm, 60 mm\nGAP 2 mm, 0 mm\nCODEPAGE 1251\nCLS\nBOX 15,15,680,705,3\nTEXT 180,25,"3",0,1,1,"АКТ ПРИЕМКИ МОЛОКА"\nTEXT 25,70,"2",0,1,1,"Поставщик: Тест | Вода доб.: 8.50%"\nTEXT 40,160,"3",0,1,1,"ВЕРДИКТ: [ БРАК / ОБНАРУЖЕНА ВОДА ]"\nPRINT 1, 1`;
    }
    const p = this.currentLine() || this.store.lines()[1];
    return `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
CODEPAGE 1251
CLS
BOX 10, 10, 680, 705, 3
TEXT 20, 20, "2", 0, 1, 1, "${p.brand} * MOOD GROUP"
TEXT 30, 56, "3", 0, 1, 1, "${p.kzTitle}"
TEXT 20, 124, "1", 0, 1, 1, "Курамы/Состав: ${p.comp}"
TEXT 20, 142, "1", 0, 1, 1, "100г: Б-${p.prot}г, Ж-${p.fat}г. ${this.getKcal(p)} ккал. ${p.temp}"
TEXT 20, 160, "1", 0, 1, 1, "${p.kzPair}"
TEXT 20, 178, "1", 0, 1, 1, "${p.ruPair}"
TEXT 20, 208, "1", 0, 1, 1, "Партия: ${this.store.tsplBatch()} | Годен: ${p.shelfDays} сут."
QRCODE 25, 266, M, 5, A, 0, "${this.getEan12(p)};${this.store.tsplBatch()}"
TEXT 245, 288, "2", 0, 1, 1, "МАССА: ${(p.packG / 1000).toFixed(3)} кг"
TEXT 245, 316, "2", 0, 1, 1, "Клуб / MOOD Club: -10%"
TEXT 245, 352, "3", 0, 1, 1, "ИТОГО: ${this.getClubPackPrice(p)} T"
TEXT 20, 485, "1", 0, 1, 1, "Мастерская «MOOD GROUP»: г. Алматы, ЖК Арай, блок Г3"
PRINT 1, 1`;
  }
}
