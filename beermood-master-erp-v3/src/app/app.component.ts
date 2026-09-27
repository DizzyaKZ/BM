import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from './services/master-erp.service';
import { KochCardItem, DairyCardItem, TechStep } from './models/master-erp.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  erp = inject(MasterErpService);

  meatBrineWater = 10;
  meatBrineBe = 10;
  showMeatBrineCalc = false;

  cheeseBrineWater = 15;
  cheeseBrinePct = 20;
  cheeseBrineWeight = 1.0;
  showCheeseBrineCalc = false;

  openProductTtk(product: KochCardItem | DairyCardItem): void {
    this.erp.selectedProduct.set(product);
    this.erp.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.erp.drawerOpen.set(false);
  }

  toggleStep(step: TechStep): void {
    step.completed = !step.completed;
  }

  calcProgress(steps: TechStep[]): number {
    if (!steps || !steps.length) return 0;
    const done = steps.filter(s => s.completed).length;
    return Math.round((done / steps.length) * 100);
  }

  formatTime(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    const mStr = m < 10 ? '0' + m : '' + m;
    const sStr = s < 10 ? '0' + s : '' + s;
    return mStr + ':' + sStr;
  }

  getMeatCardBrine(card: KochCardItem) {
    const waterL = Math.max(1, Math.round((this.erp.kochBatchKg() * (card.brineInjectionPct || 10)) / 100));
    return this.erp.calcMeatBrine(waterL, card.brineBe || 10);
  }

  getCheeseCardBrine(card: DairyCardItem) {
    return this.erp.calcCheeseBrine(10, card.brinePct || 18, card.packGrams / 1000);
  }
}
