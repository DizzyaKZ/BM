import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MasterErpService } from '../../services/master-erp.service';

@Component({
  selector: 'app-tspl-printer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="module-wrapper">
      <div class="module-header">
        <div>
          <h2>🏷️ Центр печати этикеток TSPL (TSC TE310)</h2>
          <p class="subtitle">
            Прямое управление промышленным термотрансферным принтером TSC TE310 (разрешение 300 DPI, печать этикеток ТермоТОП 58×60 мм и 58×40 мм). Сетевой TCP/IP сокет 192.168.1.17:9100.
          </p>
        </div>
      </div>

      <!-- Printer Hardware Status Card -->
      <section class="hw-card">
        <div class="hw-top">
          <div class="hw-info">
            <span class="badge badge-emerald">ОБОРУДОВАНИЕ ОНЛАЙН</span>
            <h3>TSC Auto ID TE310 (300 DPI)</h3>
            <div class="hw-params">
              <span>IP адрес: <strong>{{ erp.printerConfig().ip }}</strong></span>
              <span>TCP порт: <strong>{{ erp.printerConfig().port }}</strong></span>
              <span>Разрешение: <strong>11.8 точек/мм (300 DPI)</strong></span>
              <span>Ширина ленты: <strong>{{ erp.printerConfig().widthMm }} мм</strong></span>
              <span>Высота этикетки: <strong>{{ erp.printerConfig().heightMm }} мм</strong></span>
              <span>Зазор (GAP): <strong>{{ erp.printerConfig().gapMm }} мм</strong></span>
            </div>
          </div>
          <div class="hw-actions">
            <button class="btn btn-outline" (click)="calibrateSensor()">
              ⚙️ Калибровка (SET GAP)
            </button>
            <button class="btn btn-primary" (click)="printTest()">
              🖨️ Тестовая печать
            </button>
          </div>
        </div>
      </section>

      <!-- Interactive TSPL Studio & Preview -->
      <section class="editor-section">
        <div class="editor-header">
          <h3 class="sec-title">Интерактивный редактор команд TSPL</h3>
          <div class="tpl-buttons">
            <button class="tpl-btn" (click)="loadTemplate('PRODUCT')">Шаблон: Товар с весом</button>
            <button class="tpl-btn" (click)="loadTemplate('MILK')">Шаблон: Акт молока</button>
            <button class="tpl-btn" (click)="loadTemplate('ORDER')">Шаблон: Заказ ЖК «Арай»</button>
            <button class="tpl-btn" (click)="loadTemplate('BOX')">Шаблон: Маркировка короба</button>
          </div>
        </div>

        <div class="editor-grid">
          <div class="code-col">
            <label class="col-lbl">Код программы TSPL (CP1251):</label>
            <textarea class="tspl-textarea" [(ngModel)]="currentTsplCode" rows="22"></textarea>
            <div class="code-actions">
              <button class="btn btn-outline" (click)="copyCode()">📋 Копировать код</button>
              <button class="btn btn-primary" (click)="sendDirect()">🖨️ Отправить на принтер (TCP 9100)</button>
            </div>
            <div class="feedback" *ngIf="logMsg()">{{ logMsg() }}</div>
          </div>

          <div class="preview-col">
            <label class="col-lbl">Визуальная схема этикетки ТермоТОП (58×60 мм):</label>
            <div class="label-mockup">
              <div class="mockup-header">
                <span>MEAT & BREAD MOOD</span>
                <span class="badge-mini">СТ РК / ГОСТ</span>
              </div>
              <div class="mockup-title">БИЛТОНГ ИЗ КОНИНЫ (ЖАЯ)</div>
              <div class="mockup-divider"></div>
              <div class="mockup-meta">
                <div>Рецепт: BM-28 | PLU: 28</div>
                <div>Упаковано: 28.09.2026 | Годен: 27.11.2026</div>
                <div>Условия: +2...+4°C (влажность 75%)</div>
              </div>
              <div class="mockup-divider"></div>
              <div class="mockup-price-box">
                <div class="p-row"><span>ВЕС НЕТТО:</span> <strong>0.050 кг</strong></div>
                <div class="p-row"><span>ЦЕНА / КГ:</span> <strong>35 000 ₸</strong></div>
                <div class="p-row highlight"><span>ИТОГО:</span> <strong>1 750 ₸</strong></div>
              </div>
              <div class="mockup-divider"></div>
              <div class="mockup-barcode">
                <div class="mock-bars">||| | |||| | ||| || ||||</div>
                <div class="mock-ean font-mono">220028000050</div>
              </div>
              <div class="mockup-foot">
                MOOD GROUP • Алматы, ул. Жарокова 137/1
              </div>
            </div>
          </div>
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
    .hw-card {
      background: var(--bg-card);
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .hw-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;
    }
    .hw-info h3 { font-size: 1.25rem; color: #fff; margin: 6px 0 10px; }
    .hw-params {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 0.78rem;
      color: var(--text-secondary);
      background: var(--bg-surface);
      padding: 10px 14px;
      border-radius: 8px;
    }
    .hw-actions { display: flex; gap: 10px; }
    .editor-section { margin-bottom: 30px; }
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .tpl-buttons { display: flex; gap: 6px; flex-wrap: wrap; }
    .tpl-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      cursor: pointer;
    }
    .tpl-btn:hover { background: var(--bg-surface-elevated); color: #fff; }
    .editor-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
    }
    .col-lbl {
      display: block;
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .tspl-textarea {
      width: 100%;
      background: #090909;
      border: 1px solid var(--border-subtle);
      color: #34d399;
      padding: 12px;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      border-radius: 8px;
      line-height: 1.45;
      resize: vertical;
    }
    .code-actions { display: flex; gap: 10px; margin-top: 10px; justify-content: flex-end; }
    .feedback {
      margin-top: 10px;
      background: var(--accent-emerald-soft);
      border: 1px solid var(--accent-emerald);
      color: var(--accent-emerald);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .preview-col { display: flex; flex-direction: column; }
    .label-mockup {
      width: 320px;
      height: 380px;
      background: #fff;
      color: #000;
      border-radius: 6px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      font-family: Arial, sans-serif;
      margin: 0 auto;
    }
    .mockup-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.65rem;
      font-weight: bold;
    }
    .badge-mini {
      border: 1px solid #000;
      padding: 1px 4px;
      font-size: 0.6rem;
    }
    .mockup-title {
      font-size: 0.85rem;
      font-weight: 900;
      text-align: center;
      margin: 6px 0;
    }
    .mockup-divider {
      height: 1px;
      background: #000;
      margin: 4px 0;
    }
    .mockup-meta {
      font-size: 0.62rem;
      line-height: 1.35;
    }
    .mockup-price-box {
      font-size: 0.7rem;
    }
    .p-row { display: flex; justify-content: space-between; margin: 2px 0; }
    .p-row.highlight { font-size: 0.85rem; font-weight: bold; border-top: 1px dashed #000; padding-top: 2px; }
    .mockup-barcode {
      text-align: center;
      margin: 4px 0;
    }
    .mock-bars {
      font-size: 1.2rem;
      letter-spacing: 2px;
      font-weight: 900;
    }
    .mock-ean {
      font-size: 0.65rem;
      letter-spacing: 1px;
    }
    .mockup-foot {
      font-size: 0.55rem;
      text-align: center;
      color: #333;
    }
  `]
})
export class TsplPrinterComponent {
  erp = inject(MasterErpService);
  logMsg = signal<string>('');

  currentTsplCode = `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
REFERENCE 0, 0
CODEPAGE 1251
CLS
BOX 10,10,676,700,3
TEXT 25,25,"3",0,1,1,"MEAT&BREAD MOOD * MOOD GROUP"
TEXT 460,28,"2",0,1,1,"СТ РК / ГОСТ"
BAR 10,60,666,2
TEXT 25,75,"2",0,1,1,"ЖЫЛКЫ ЕТIНЕН (ЖАЯ) БИЛТОНГ"
TEXT 25,105,"3",0,1,1,"БИЛТОНГ ИЗ КОНИНЫ (ОТРУБ ЖАЯ)"
BAR 10,140,666,2
TEXT 25,155,"2",0,1,1,"Рецепт: BM-28 | PLU: PLU-28"
TEXT 25,185,"2",0,1,1,"Оболочка: Вакуум-пакет PA/PE по 50 г"
TEXT 25,215,"2",0,1,1,"Упаковано: 28.09.2026 | Годен: 27.11.2026"
TEXT 25,245,"2",0,1,1,"Хранить при t: +2...+4 C (влажн. 75%)"
BAR 10,275,666,2
TEXT 25,295,"3",0,1,1,"МАССА НЕТТО:"
TEXT 240,290,"4",0,1,1,"0.050 кг"
TEXT 25,345,"3",0,1,1,"ЦЕНА ЗА КГ:"
TEXT 240,345,"3",0,1,1,"35 000 KZT"
TEXT 25,385,"3",0,1,1,"ИТОГО К ОПЛАТЕ:"
TEXT 260,378,"4",0,1,1,"1 750 KZT"
TEXT 25,430,"2",0,1,1,"MOOD CLUB (-10%): 1 575 KZT"
BAR 10,465,666,2
BARCODE 55,485,"EAN13",90,2,0,3,3,"220028000050"
TEXT 25,605,"1",0,1,1,"Производитель: ТОО MOOD GROUP, г. Алматы, ул. Жарокова 137/1"
TEXT 25,630,"1",0,1,1,"Система контроля качества BEERMOOD ERP v3 * www.beermood.kz"
PRINT 1, 1`;

  loadTemplate(type: 'PRODUCT' | 'MILK' | 'ORDER' | 'BOX') {
    if (type === 'PRODUCT') {
      const card = this.erp.filteredKochCards()[0];
      if (card) this.currentTsplCode = this.erp.generateProductTspl(card, 0.050);
    } else if (type === 'MILK') {
      const rec = this.erp.milkLabRecords()[0];
      if (rec) this.currentTsplCode = this.erp.generateMilkActTspl(rec);
    } else if (type === 'ORDER') {
      const ord = this.erp.araiOrders()[0];
      if (ord) this.currentTsplCode = this.erp.generateOrderTspl(ord);
    } else {
      this.currentTsplCode = `SIZE 58 mm, 60 mm
GAP 2 mm, 0 mm
DIRECTION 1
CLS
BOX 10,10,676,700,4
TEXT 30,30,"4",0,1,1,"СКЛАД / ТАРА #4"
BAR 10,80,666,3
TEXT 30,110,"3",0,1,1,"ХОЛДИНГ MOOD GROUP"
TEXT 30,160,"2",0,1,1,"ЦЕХ: СЫРОВАРНЯ & КОЛБАСНЫЙ"
TEXT 30,200,"2",0,1,1,"УЛ. ЖАРОКОВА 137/1, БЛОК Г3"
BARCODE 80,260,"128",100,2,0,3,3,"BOX-MOOD-928"
TEXT 30,420,"2",0,1,1,"ДАТА ФОРМИРОВАНИЯ: 28.09.2026"
PRINT 1, 1`;
    }
    this.logMsg.set(`Загружен шаблон: ${type}`);
  }

  async sendDirect() {
    this.logMsg.set('Отправка пакета на 192.168.1.17:9100...');
    const res = await this.erp.sendTsplToPrinter(this.currentTsplCode);
    this.logMsg.set(res.message);
  }

  async calibrateSensor() {
    const cmd = `GAPDETECT
AUTODETECT
`;
    this.logMsg.set('Отправка команды калибровки датчика (GAPDETECT)...');
    const res = await this.erp.sendTsplToPrinter(cmd);
    this.logMsg.set(res.message);
  }

  printTest() {
    this.sendDirect();
  }

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.currentTsplCode);
      this.logMsg.set('✓ TSPL код скопирован!');
    } catch {
      this.logMsg.set('Скопируйте текст вручную.');
    }
  }
}
