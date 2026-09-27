import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from './services/master-erp.service';
import { GiantLineItem, KochCardItem, DairyCardItem, BreadCardItem } from './models/master-erp.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  erp = inject(MasterErpService);
  readonly days30 = Array.from({ length: 30 }, (_, i) => i + 1);
  readonly giantDepts = [
    { id: 'ALL', label: 'Все цеха (24)' },
    { id: 'CHEESY MOOD', label: '🧀 CHEESY MOOD (7)' },
    { id: 'Пекарня MEAT&BREAD', label: '🥖 Пекарня Unox (3)' },
    { id: 'Мясной цех MEAT&BREAD', label: '🥩 Мясной цех Ижица (9)' },
    { id: 'BEERMOOD & SPICE LAB', label: '🌶️ Соусы, Суп-киты, Специи, Пиво (5)' }
  ];

  ngOnInit(): void {
    this.erp.initConnection();
  }

  getDow(day: number): string {
    return this.erp.dowList[(day - 1) % 7];
  }

  filteredGiantLines(): GiantLineItem[] {
    const d = this.erp.giantDept();
    return d === 'ALL' ? this.erp.giantLines() : this.erp.giantLines().filter(x => x.dept === d);
  }

  shortRiskLines(): GiantLineItem[] {
    return this.erp.giantLines().filter(x => x.shortRisk);
  }

  currentSelectedLine(): GiantLineItem | undefined {
    return this.erp.giantLines().find(x => x.plu === this.erp.selectedPlu());
  }

  selectGiantPlu(plu: string, dayOpt?: number): void {
    this.erp.selectedPlu.set(plu);
    if (dayOpt) this.erp.giantDay.set(dayOpt);
  }

  getAdjustedMonthlyKg(p: GiantLineItem): number {
    if (!this.erp.giantPivot()) return p.monthlyKg;
    if (p.shortRisk && p.pivotRatio) return p.monthlyKg - Math.round(p.monthlyKg * p.pivotRatio);
    if (p.isBuffer && p.bonusKg) return p.monthlyKg + p.bonusKg;
    return p.monthlyKg;
  }

  getSupplyEventsForDay(day: number): string[] {
    return this.erp.supplyLog[day] || ['Плановых внешних поставок сырья нет — работа на складском буфере цеха.'];
  }

  getActiveLinesForDay(day: number): GiantLineItem[] {
    return this.erp.giantLines().filter(p => p.prodDays.includes(day));
  }

  getGiantCellState(p: GiantLineItem, day: number) {
    const isSup = p.supplyDays.includes(day);
    let lastProd: number | null = null;
    for (const d of p.prodDays) { if (d <= day) lastProd = d; }
    const isProdStart = p.prodDays.includes(day);
    const isInCycle = lastProd !== null && day >= lastProd && day < lastProd + Math.min(p.cycleDays, 3);
    const elapsed = lastProd !== null ? (day - lastProd) : null;
    const remDays = elapsed !== null ? (p.shelfDays - elapsed) : null;
    const isPivot = this.erp.giantPivot() && p.shortRisk && (day % 3 === 0) && !isProdStart;

    let cls = '', sym = '', txt = 'Ожидание', pill = 'pill-ok';
    if (isSup && isProdStart) { cls = 'c-sp'; sym = 'S+P'; txt = 'Поставка + Варка'; }
    else if (isProdStart || isInCycle) { cls = 'c-prd'; sym = isProdStart ? 'P' : '⚙'; txt = 'В производстве'; }
    else if (isSup) { cls = 'c-sup'; sym = 'S'; txt = 'Поставка сырья'; }
    else if (isPivot) { cls = 'c-pvt'; sym = '⇄'; txt = 'Маневр сырья'; pill = 'pill-pivot'; }
    else if (remDays !== null && remDays > 0) {
      if (remDays <= 2) { cls = 'c-crt'; sym = `${remDays}д!`; txt = 'КРИТИЧНО'; pill = 'pill-crit'; }
      else if (remDays / p.shelfDays <= 0.38) { cls = 'c-wrn'; sym = `${remDays}д`; txt = 'Промо -10%'; pill = 'pill-warn'; }
      else { cls = 'c-ok'; sym = `${remDays}д`; txt = 'Свежая полка'; pill = 'pill-ok'; }
    }
    return { cls, sym, txt, pill };
  }

  filteredKochCards(): KochCardItem[] {
    return this.erp.kochCards();
  }

  getKochPacksCount(c: KochCardItem): number {
    return Math.floor(((this.erp.kochBatchKg() || 20) * (c.yieldPct / 100) * 1000) / c.packGrams);
  }

  getKochPackPrice(c: KochCardItem): number {
    return Math.round((c.retailPricePerKgKzt / 1000) * c.packGrams);
  }

  getKochBatchProfit(c: KochCardItem): number {
    const costPack = Math.round(((c.rawCostPerKgKzt / (c.yieldPct / 100)) / 1000) * c.packGrams) + 45;
    return this.getKochPacksCount(c) * (this.getKochPackPrice(c) - costPack);
  }

  getDairyPacksCount(d: DairyCardItem): number {
    return Math.floor((d.yieldKgPer100L * ((this.erp.dairyBatchLiters() || 100) / 100) * 1000) / d.packGrams);
  }

  getDairyPackPrice(d: DairyCardItem): number {
    return Math.round((d.retailPricePerKgKzt / 1000) * d.packGrams);
  }

  getBreadLoafPrice(b: BreadCardItem): number {
    return Math.round((b.retailPricePerKgKzt / 1000) * b.bakedLoafWeightG);
  }

  openPluInTspl(plu: string): void {
    this.erp.selectedPlu.set(plu);
    const p = this.erp.giantLines().find(x => x.plu === plu) || this.erp.giantLines()[1];
    this.erp.tsplMassKg.set(Number((p.packG / 1000).toFixed(3)));
    this.erp.tsplPriceKg.set(p.priceKg);
    this.erp.tsplProtVal.set(p.prot);
    this.erp.tsplFatVal.set(p.fat);
    this.erp.activeTab.set('tspl');
  }

  getTsplKcal(p: GiantLineItem): number {
    return Math.round(this.erp.tsplProtVal() * 4 + this.erp.tsplFatVal() * 9 + (p.carb || 2) * 4);
  }

  getTsplTotalClubKzt(): number {
    return Math.round(this.erp.tsplPriceKg() * this.erp.tsplMassKg() * 0.90);
  }

  getTsplEan12(p: GiantLineItem): string {
    const gramsStr = String(Math.round(this.erp.tsplMassKg() * 1000)).padStart(5, '0');
    return `${p.eanPrefix}${gramsStr}`;
  }

  buildTsplPayload(): string {
    const p = this.currentSelectedLine() || this.erp.giantLines()[1];
    const ean12 = this.getTsplEan12(p);
    const totalClub = this.getTsplTotalClubKzt();

    return `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
REFERENCE 0, 0
CODEPAGE 1251
CLS
BOX 10, 10, 680, 705, 3
TEXT 20, 20, "2", 0, 1, 1, "${p.brand} * MOOD GROUP"
TEXT 460, 22, "1", 0, 1, 1, "СТ РК / ГОСТ"
BAR 10, 48, 670, 2
TEXT 30, 56, "3", 0, 1, 1, "${p.kzTitle}"
BAR 10, 116, 670, 2
TEXT 20, 124, "1", 0, 1, 1, "100г: Б-${this.erp.tsplProtVal()}г, Ж-${this.erp.tsplFatVal()}г. ${this.getTsplKcal(p)} ккал. ${p.temp}"
TEXT 20, 160, "1", 0, 1, 1, "${p.kzPair}"
TEXT 20, 178, "1", 0, 1, 1, "${p.ruPair}"
BAR 10, 198, 670, 1
TEXT 20, 208, "1", 0, 1, 1, "Партия: ${this.erp.tsplBatchInput()} | Годен: ${p.shelfDays} сут."
BAR 10, 254, 670, 2
QRCODE 25, 266, M, 5, A, 0, "${ean12};${this.erp.tsplBatchInput()}"
TEXT 35, 428, "2", 0, 1, 1, "${ean12}"
BAR 230, 254, 2, 221
TEXT 245, 260, "1", 0, 1, 1, "Цена: ${this.erp.tsplPriceKg()} T/кг"
TEXT 245, 288, "1", 0, 1, 1, "МАССА: ${this.erp.tsplMassKg().toFixed(3)} кг"
TEXT 245, 316, "1", 0, 1, 1, "Клуб / MOOD Club: -10%"
BAR 230, 340, 450, 1
TEXT 245, 352, "2", 0, 1, 1, "ИТОГО: ${totalClub} T"
BAR 10, 475, 670, 2
TEXT 20, 485, "1", 0, 1, 1, "«MOOD GROUP» шеберханасы: Алматы к., Арай ТК, Г3 блогы"
PRINT 1, 1`;
  }

  printDirectNow(): void {
    const p = this.currentSelectedLine() || this.erp.giantLines()[1];
    this.erp.sendTsplToPrinterOrServer(
      this.buildTsplPayload(),
      p.plu,
      this.erp.tsplBatchInput(),
      this.erp.tsplMassKg(),
      this.getTsplTotalClubKzt()
    );
  }
}