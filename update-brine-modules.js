const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'beermood-master-erp-v3', 'src', 'app');

const files = {
  // 1. Модели данных
  'models/brine-process.model.ts': `export interface TechStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationMinutes: number;
  criticalHaccpPoint?: string;
}

export interface MeatBrineCalcResult {
  waterLiters: number;
  beDegrees: number;
  nitriteSaltGrams: number;
  dextroseGrams: number;
  phosphateGrams: number;
  targetMeatKg: number;
  injectionPct: number;
}

export interface CheeseBrineCalcResult {
  waterLiters: number;
  saltPct: number;
  saltGrams: number;
  cacl2Grams: number;
  targetPh: number;
  tempCelsius: number;
  cheeseWeightKg: number;
  recommendedHours: number;
}
`,

  // 2. Сервис расчетов и звукового таймера
  'services/brine-timer.service.ts': `import { Injectable, signal } from '@angular/core';
import { MeatBrineCalcResult, CheeseBrineCalcResult, TechStep } from '../models/brine-process.model';

@Injectable({ providedIn: 'root' })
export class BrineTimerService {
  private readonly KOCH_BE_TABLE: Record<number, number> = {
    8: 87, 9: 99, 10: 112, 11: 126, 12: 139, 13: 153, 14: 167, 16: 198, 18: 231, 20: 265
  };

  timerActive = signal<boolean>(false);
  remainingSeconds = signal<number>(0);
  currentStepIndex = signal<number>(0);
  private timerInterval: any = null;

  calculateMeatBrine(waterLiters: number, beDegrees: number = 10, meatKg: number = 0, injectionPct: number = 10): MeatBrineCalcResult {
    const saltPerLiter = this.KOCH_BE_TABLE[beDegrees] || 112;
    return {
      waterLiters,
      beDegrees,
      nitriteSaltGrams: Math.round(waterLiters * saltPerLiter),
      dextroseGrams: Math.round(waterLiters * 4.0),
      phosphateGrams: Math.round(waterLiters * 3.5),
      targetMeatKg: meatKg,
      injectionPct
    };
  }

  calculateCheeseBrine(waterLiters: number, saltPct: number = 20, cheeseWeightKg: number = 1.0): CheeseBrineCalcResult {
    const saltPerLiter = saltPct === 20 ? 250 : 190;
    const recommendedHours = Math.round(cheeseWeightKg * (saltPct === 20 ? 5.5 : 7.0) * 10) / 10;
    return {
      waterLiters,
      saltPct,
      saltGrams: Math.round(waterLiters * saltPerLiter),
      cacl2Grams: Math.round(waterLiters * 1.5),
      targetPh: 5.2,
      tempCelsius: 11,
      cheeseWeightKg,
      recommendedHours
    };
  }

  startStep(step: TechStep, index: number): void {
    this.stopTimer();
    this.currentStepIndex.set(index);
    this.remainingSeconds.set(step.durationMinutes * 60);
    this.timerActive.set(true);

    this.timerInterval = setInterval(() => {
      const cur = this.remainingSeconds();
      if (cur > 1) {
        this.remainingSeconds.set(cur - 1);
      } else {
        this.remainingSeconds.set(0);
        this.stopTimer();
        this.playAlarmSignal();
      }
    }, 1000);
  }

  pauseTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.timerActive.set(false);
    }
  }

  stopTimer(): void {
    this.pauseTimer();
    this.timerActive.set(false);
  }

  playAlarmSignal(): void {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [0, 0.25, 0.5].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.20);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.22);
      });
    } catch (e) {
      console.warn('Audio Context error', e);
    }
  }
}
`,

  // 3. UI-компонент
  'components/tech-brine-panel.component.ts': `import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrineTimerService } from '../services/brine-timer.service';
import { TechStep } from '../models/brine-process.model';

@Component({
  selector: 'app-tech-brine-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: \`
    <div class="panel-container">
      <div class="tabs">
        <button class="tab-btn" [class.active]="tab() === 'meat'" (click)="tab.set('meat')">🥩 Рассолы для мяса (°Bé)</button>
        <button class="tab-btn" [class.active]="tab() === 'cheese'" (click)="tab.set('cheese')">🧀 Рассолы для сыра</button>
        <button class="tab-btn" [class.active]="tab() === 'timer'" (click)="tab.set('timer')">⏱️ Пошаговый таймер техпроцесса</button>
      </div>

      @if (tab() === 'meat') {
        <div class="calc-card">
          <h3>Калькулятор мясного рассола по шкале Бёме Г. Коха</h3>
          <div class="input-grid">
            <label>Объем воды (л):
              <input type="number" [(ngModel)]="meatWater" min="1" max="100">
            </label>
            <label>Крепость рассола (°Bé):
              <select [(ngModel)]="meatBe">
                <option [value]="8">8 °Bé (87 г/л) — Филе птицы</option>
                <option [value]="10">10 °Bé (112 г/л) — Ребра, грудинка, бекон</option>
                <option [value]="12">12 °Bé (139 г/л) — Окорок, ветчина</option>
                <option [value]="14">14 °Bé (167 г/л) — Мокрый посол шпика</option>
              </select>
            </label>
          </div>
          @let m = svc.calculateMeatBrine(meatWater, meatBe);
          <div class="result-box">
            <div class="res-item"><span>Вода:</span><strong>{{ m.waterLiters }} л</strong></div>
            <div class="res-item"><span>Нитритная соль:</span><strong style="color:#7ee787;">{{ m.nitriteSaltGrams }} г</strong></div>
            <div class="res-item"><span>Декстроза/Сахар:</span><strong>{{ m.dextroseGrams }} г</strong></div>
            <div class="res-item"><span>Фосфат пищевой:</span><strong>{{ m.phosphateGrams }} г</strong></div>
          </div>
        </div>
      }

      @if (tab() === 'cheese') {
        <div class="calc-card">
          <h3>Параметры рассола для сыроделия (Casaro)</h3>
          <div class="input-grid">
            <label>Объем воды (л):
              <input type="number" [(ngModel)]="cheeseWater" min="1" max="200">
            </label>
            <label>Концентрация:
              <select [(ngModel)]="cheesePct">
                <option [value]="16">16% (190 г/л) — Сулугуни, Моцарелла</option>
                <option [value]="20">20% (250 г/л) — Качотта, Гауда</option>
              </select>
            </label>
            <label>Масса головки (кг):
              <input type="number" [(ngModel)]="cheeseWeight" step="0.1" min="0.2">
            </label>
          </div>
          @let c = svc.calculateCheeseBrine(cheeseWater, cheesePct, cheeseWeight);
          <div class="result-box">
            <div class="res-item"><span>Нейодированная соль:</span><strong style="color:#7ee787;">{{ c.saltGrams }} г</strong></div>
            <div class="res-item"><span>Сухой CaCl₂:</span><strong>{{ c.cacl2Grams }} г</strong> (защита от ослизнения)</div>
            <div class="res-item"><span>Целевой pH:</span><strong>{{ c.targetPh }}</strong> (сыворотка/молочная кислота)</div>
            <div class="res-item"><span>Время выдержки:</span><strong style="color:#58a6ff;">~{{ c.recommendedHours }} ч</strong> (t: 10–12°C)</div>
          </div>
        </div>
      }

      @if (tab() === 'timer') {
        <div class="calc-card">
          <h3>Пошаговый регламент с таймером и звуковым сигналом</h3>
          <div class="timer-display" [class.running]="svc.timerActive()">
            <div class="digits">{{ formatTime(svc.remainingSeconds()) }}</div>
            <div class="timer-ctrls">
              @if (!svc.timerActive()) {
                <button class="btn btn-green" (click)="resumeOrStart()">▶ Старт</button>
              } @else {
                <button class="btn btn-warn" (click)="svc.pauseTimer()">⏸ Пауза</button>
              }
              <button class="btn btn-outline" (click)="svc.stopTimer()">⏹ Сброс</button>
              <button class="btn btn-blue" (click)="svc.playAlarmSignal()">🔊 Тест звука</button>
            </div>
          </div>

          <div class="steps-list">
            @for (step of demoSteps; track step.stepNumber; let idx = $index) {
              <div class="step-row" [class.active-row]="svc.currentStepIndex() === idx && svc.timerActive()">
                <div class="s-info">
                  <strong>Шаг {{ step.stepNumber }}: {{ step.title }}</strong>
                  <div class="s-inst">{{ step.instruction }}</div>
                  @if (step.criticalHaccpPoint) {
                    <div class="s-kkt">⚠️ ККТ ХАССП: {{ step.criticalHaccpPoint }}</div>
                  }
                </div>
                <div class="s-action">
                  <span>{{ step.durationMinutes }} мин</span>
                  <button class="btn btn-sm btn-blue" (click)="svc.startStep(step, idx)">Запустить</button>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  \`,
  styles: [\`
    .panel-container { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; color: #c9d1d9; }
    .tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid #30363d; padding-bottom: 10px; }
    .tab-btn { background: #21262d; color: #8b949e; border: 1px solid #30363d; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .tab-btn.active { background: #388bfd26; color: #58a6ff; border-color: #58a6ff; }
    .calc-card h3 { font-size: 15px; color: #f0883e; margin-bottom: 12px; }
    .input-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 14px; }
    .input-grid label { display: flex; flex-direction: column; font-size: 12px; color: #8b949e; gap: 4px; }
    .input-grid input, .input-grid select { background: #0d1117; border: 1px solid #30363d; color: #c9d1d9; padding: 6px 10px; border-radius: 6px; }
    .result-box { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; }
    .res-item span { display: block; font-size: 11px; color: #8b949e; }
    .res-item strong { font-size: 15px; color: #f0f6fc; }
    .timer-display { text-align: center; background: #0d1117; border: 2px solid #30363d; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .timer-display.running { border-color: #7ee787; box-shadow: 0 0 10px rgba(126, 231, 135, 0.2); }
    .digits { font-size: 40px; font-family: monospace; font-weight: 700; color: #7ee787; letter-spacing: 2px; margin-bottom: 10px; }
    .timer-ctrls { display: flex; justify-content: center; gap: 8px; }
    .btn { padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; border: 1px solid transparent; font-size: 12px; }
    .btn-green { background: #238636; color: #fff; }
    .btn-warn { background: #d29922; color: #fff; }
    .btn-blue { background: #1f6feb; color: #fff; }
    .btn-outline { background: transparent; border-color: #30363d; color: #c9d1d9; }
    .btn-sm { padding: 3px 8px; font-size: 11px; }
    .step-row { display: flex; justify-content: space-between; align-items: center; background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; }
    .step-row.active-row { border-color: #58a6ff; background: #162235; }
    .s-inst { font-size: 12px; color: #8b949e; margin-top: 2px; }
    .s-kkt { font-size: 11px; color: #f0883e; margin-top: 3px; font-weight: 600; }
    .s-action { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  \`]
})
export class TechBrinePanelComponent {
  svc = inject(BrineTimerService);
  tab = signal<'meat' | 'cheese' | 'timer'>('meat');
  meatWater = 10;
  meatBe = 10;
  cheeseWater = 15;
  cheesePct = 20;
  cheeseWeight = 1.0;

  demoSteps: TechStep[] = [
    { stepNumber: 1, title: 'Внесение закваски и созревание', instruction: 'Внесение культур Sacco при 38 °C', durationMinutes: 45, criticalHaccpPoint: 'Температура 38±0.5 °C, pH 6.55' },
    { stepNumber: 2, title: 'Ферментация и сгусток', instruction: 'Внесение молокосвертывающего фермента', durationMinutes: 30, criticalHaccpPoint: 'Точка схватывания (мультипликатор 3)' },
    { stepNumber: 3, title: 'Нарезка и постановка зерна', instruction: 'Нарезка лирой до 8-10 мм, вымешивание', durationMinutes: 20 },
    { stepNumber: 4, title: 'Посолка в рассоле', instruction: 'Погружение головки в 20% рассол (11 °C)', durationMinutes: 180, criticalHaccpPoint: 'Температура рассола 10-12 °C, pH 5.2' }
  ];

  formatTime(totalSec: number): string {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return \`\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
  }

  resumeOrStart(): void {
    if (this.svc.remainingSeconds() === 0 && this.demoSteps.length > 0) {
      this.svc.startStep(this.demoSteps[0], 0);
    } else {
      const idx = this.svc.currentStepIndex();
      this.svc.startStep({ ...this.demoSteps[idx], durationMinutes: this.svc.remainingSeconds() / 60 }, idx);
    }
  }
}
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('✅ Модули рассолов и таймера успешно сгенерированы в проекте!');