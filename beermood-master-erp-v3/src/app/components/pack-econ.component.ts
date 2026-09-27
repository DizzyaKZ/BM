import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GiantLine } from '../models/erp.models';

@Component({
  selector: 'app-pack-econ',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="econ-wrap">
      <div class="econ-top">
        <strong style="color:#7ee787; font-size:12px;">
          💰 Экономика упаковки ({{ totalPacks() }} уп. • FC: {{ foodCostPct() }}%)
        </strong>
        <div style="display:flex; gap:4px;">
          <button class="btn btn-outline btn-sm" (click)="adjustPriceKg(-500)">-500 ₸</button>
          <button class="btn btn-outline btn-sm" (click)="adjustPriceKg(500)">+500 ₸</button>
          <button class="btn btn-sm" (click)="openSteps.emit(line().plu)">📋 Техкарта ХАССП</button>
        </div>
      </div>

      <div class="econ-grid">
        <label>Вес 1 уп. (г):
          <input type="number" [ngModel]="line().packG" (ngModelChange)="onPackGChange(+$event)" step="10">
        </label>
        <label>Цена за 1 кг (₸):
          <input type="number" [ngModel]="line().priceKg" (ngModelChange)="onPriceKgChange(+$event)" step="100" style="color:var(--amber);">
        </label>
        <label>Цена за 1 уп. (₸):
          <input type="number" [ngModel]="packPriceKzt()" (ngModelChange)="onPackPriceChange(+$event)" step="50" style="color:#7ee787;">
        </label>
      </div>

      <div class="econ-foot">
        <span>Себест. 1 уп.: <strong style="color:#fff;">{{ costPerPackKzt() }} ₸</strong></span>
        <span>MOOD Club -10%: <strong style="color:#79c0ff;">{{ clubPriceKzt() }} ₸</strong></span>
        <span>Прибыль партии: <strong style="color:#7ee787;">+{{ batchProfitKzt() | number }} ₸</strong></span>
      </div>

      <button class="btn btn-outline btn-sm" style="width:100%; margin-top:7px;" (click)="openTspl.emit(line().plu)">
        🖨️ Маркировка {{ line().plu }} на принтере TSC TE310 →
      </button>
    </div>
  `,
  styles: [`
    .econ-wrap { background:#10161d; border:1px solid #283442; border-radius:8px; padding:10px 12px; margin-top:10px; }
    .econ-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:6px; }
    .econ-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:8px; font-size:11px; color:var(--muted); }
    .econ-grid input { width:100%; margin-top:2px; font-weight:700; }
    .econ-foot { display:flex; justify-content:space-between; font-size:11.5px; color:var(--muted); border-top:1px solid #26303c; padding-top:6px; }
  `]
})
export class PackEconComponent {
  line = input.required<GiantLine>();
  batchInputKg = input<number>(20);
  changed = output<void>();
  openSteps = output<string>();
  openTspl = output<string>();

  totalPacks(): number {
    const outKg = this.batchInputKg() * (this.line().yieldPct / 100);
    return Math.max(1, Math.floor((outKg * 1000) / this.line().packG));
  }
  packPriceKzt(): number {
    return Math.round((this.line().priceKg / 1000) * this.line().packG);
  }
  clubPriceKzt(): number {
    return Math.round(this.packPriceKzt() * 0.90);
  }
  costPerPackKzt(): number {
    return Math.round((this.line().costKg / 1000) * this.line().packG) + 40;
  }
  foodCostPct(): string {
    return ((this.costPerPackKzt() / Math.max(1, this.packPriceKzt())) * 100).toFixed(1);
  }
  batchProfitKzt(): number {
    return this.totalPacks() * (this.packPriceKzt() - this.costPerPackKzt());
  }
  adjustPriceKg(delta: number): void {
    this.line().priceKg = Math.max(300, this.line().priceKg + delta);
    this.changed.emit();
  }
  onPackGChange(val: number): void {
    this.line().packG = Math.max(20, val || 100);
    this.changed.emit();
  }
  onPriceKgChange(val: number): void {
    this.line().priceKg = Math.max(300, val || 1000);
    this.changed.emit();
  }
  onPackPriceChange(packPrice: number): void {
    this.line().priceKg = Math.max(300, Math.round(((packPrice || 500) / this.line().packG) * 1000));
    this.changed.emit();
  }
}
