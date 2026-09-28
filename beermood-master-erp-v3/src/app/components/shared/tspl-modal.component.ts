import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MasterErpService } from '../../services/master-erp.service';

@Component({
  selector: 'app-tspl-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="erp.isTsplModalOpen()" (click)="erp.closeTsplModal()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="modal-title-zone">
            <span class="badge badge-amber">TSC TE310 • 300 DPI</span>
            <h3>{{ erp.selectedTsplTitle() || 'Предпросмотр команды печати TSPL' }}</h3>
          </div>
          <button class="btn-close" (click)="erp.closeTsplModal()">✕</button>
        </div>

        <div class="modal-body">
          <div class="printer-meta">
            <span><strong>Формат:</strong> ТермоТОП 58×60 мм (Зазор 2 мм)</span>
            <span><strong>Шлюз TCP:</strong> {{ erp.printerConfig().ip }}:{{ erp.printerConfig().port }}</span>
            <span><strong>Кодировка:</strong> CP1251 (Windows Cyrillic)</span>
          </div>

          <div class="code-container">
            <pre class="tspl-code">{{ erp.selectedTsplCode() }}</pre>
          </div>

          <div class="action-feedback" *ngIf="feedbackMsg()">
            {{ feedbackMsg() }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" (click)="copyToClipboard()">
            📋 Скопировать код в буфер
          </button>
          <button class="btn btn-primary" (click)="printDirect()">
            🖨️ Отправить на принтер (192.168.1.17)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 20px;
    }
    .modal-box {
      background: var(--bg-surface-elevated);
      border: 1px solid var(--accent-amber);
      border-radius: 12px;
      max-width: 720px;
      width: 100%;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }
    .modal-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-title-zone h3 {
      font-size: 1.05rem;
      margin-top: 4px;
      color: #fff;
    }
    .btn-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.3rem;
      cursor: pointer;
    }
    .btn-close:hover {
      color: #fff;
    }
    .modal-body {
      padding: 18px 20px;
      overflow-y: auto;
    }
    .printer-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 0.78rem;
      color: var(--text-secondary);
      background: var(--bg-surface);
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 14px;
    }
    .code-container {
      background: #090909;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px;
      overflow-x: auto;
    }
    .tspl-code {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: #34d399;
      line-height: 1.4;
      white-space: pre-wrap;
    }
    .action-feedback {
      margin-top: 10px;
      padding: 8px 12px;
      background: var(--accent-emerald-soft);
      border: 1px solid var(--accent-emerald);
      color: var(--accent-emerald);
      border-radius: 6px;
      font-size: 0.8rem;
    }
    .modal-footer {
      padding: 14px 20px;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `]
})
export class TsplModalComponent {
  erp = inject(MasterErpService);
  feedbackMsg = signal<string>('');

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.erp.selectedTsplCode());
      this.feedbackMsg.set('✓ TSPL код скопирован в буфер обмена!');
      setTimeout(() => this.feedbackMsg.set(''), 3000);
    } catch {
      this.feedbackMsg.set('Ошибка копирования. Выделите текст вручную.');
    }
  }

  async printDirect() {
    this.feedbackMsg.set('Передача команды на сокет 192.168.1.17:9100...');
    const res = await this.erp.sendTsplToPrinter(this.erp.selectedTsplCode());
    this.feedbackMsg.set(res.message);
  }
}
