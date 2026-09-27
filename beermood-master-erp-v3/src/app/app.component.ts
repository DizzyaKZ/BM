import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from './services/master-erp.service';
import { KochCardItem, DairyCardItem } from './models/master-erp.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  erp = inject(MasterErpService);

  // Параметры калькуляторов рассолов
  meatWater = 10;
  meatBe = 10;
  cheeseWater = 15;
  cheesePct = 20;
  cheeseWeight = 1.0;

  openDrawer(item: KochCardItem | DairyCardItem): void {
    this.erp.activeTechCard.set(item);
    this.erp.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.erp.drawerOpen.set(false);
  }

  formatSeconds(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
}
