import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tech-brine-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="background:#161b22; border:1px solid #30363d; border-radius:10px; padding:20px; color:#c9d1d9;">
      <div style="display:flex; gap:10px; margin-bottom:18px; border-bottom:1px solid #30363d; padding-bottom:12px;">
        <button class="sub-tab" [class.act]="subTab() === 'meat'" (click)="subTab.set('meat')">🥩 Рассолы для мяса (°Bé Коха)</button>
        <button class="sub-tab" [class.act]="subTab() === 'cheese'" (click)="subTab.set('cheese')">🧀 Рассолы для сыра (Casaro)</button>
        <button class="sub-tab" [class.act]="subTab() === 'timer'" (click)="subTab.set('timer')">⏱️ Пошаговый таймер техпроцесса</button>
      </div>

      <!-- МЯСНЫЕ РАССОЛЫ -->
      @if (subTab() === 'meat') {
        <div>
          <h3 style="color:#f0883e; margin-bottom:10px;">Калькулятор посолочного рассола по шкале Бёме (°Bé) Г. Коха</h3>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:14px;">
            <label style="font-size:12px; color:#8b949e;">Объем воды (литров):
              <input type="number" [(ngModel)]="meatWater" min="1" max="100" style="width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:6px; border-radius:5px;">
            </label>
            <label style="font-size:12px; color:#8b949e;">Плотность рассола (°Bé):
              <select [(ngModel)]="meatBe" style="width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:6px; border-radius:5px;">
                <option [value]="8">8 °Bé (87 г/л) — Деликатный посол птицы/вырезки</option>
                <option [value]="10">10 °Bé (112 г/л) — Стандарт Коха: ребра (1-002), грудинка (1-032)</option>
                <option [value]="12">12 °Bé (139 г/л) — Окорок, ветчина, карбонад</option>
                <option [value]="14">14 °Bé (167 г/л) — Мокрый посол шпика</option>
                <option [value]="18">18 °Bé (231 г/л) — Насыщенный доливочный рассол</option>
              </select>
            </label>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; background:#0d1117; padding:14px; border-radius:6px; border:1px solid #30363d;">
            <div><span style="font-size:11px; color:#8b949e;">Вода:</span> <strong style="font-size:16px;">{{ meatWater }} л</strong></div>
            <div><span style="font-size:11px; color:#8b949e;">Нитритная соль:</span> <strong style="font-size:16px; color:#7ee787;">{{ getMeatSalt() }} г</strong></div>
            <div><span style="font-size:11px; color:#8b949e;">Декстроза / Сахар:</span> <strong style="font-size:16px;">{{ meatWater * 4 }} г</strong></div>
            <div><span style="font-size:11px; color:#8b949e;">Пищевой фосфат:</span> <strong style="font-size:16px;">{{ meatWater * 3.5 }} г</strong></div>
          </div>
          <div style="margin-top:10px; font-size:12px; color:#8b949e; background:#1f242c; padding:8px 12px; border-radius:4px;">
            💡 Температура рассола и сырья при шприцевании: <strong>+2...+4 °C</strong>. Давление шприца: не более <strong>1.5 атм</strong>.
          </div>
        </div>
      }

      <!-- СЫРНЫЕ РАССОЛЫ -->
      @if (subTab() === 'cheese') {
        <div>
          <h3 style="color:#f0883e; margin-bottom:10px;">Калькулятор рассола для сыроделия (Casaro)</h3>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:14px;">
            <label style="font-size:12px; color:#8b949e;">Объем воды (литров):
              <input type="number" [(ngModel)]="chWater" min="1" max="200" style="width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:6px; border-radius:5px;">
            </label>
            <label style="font-size:12px; color:#8b949e;">Концентрация соли:
              <select [(ngModel)]="chPct" style="width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:6px; border-radius:5px;">
                <option [value]="16">16% (190 г/л) — Сулугуни, Моцарелла</option>
                <option [value]="20">20% (250 г/л) — Качотта, полутвердые сыры</option>
              </select>
            </label>
            <label style="font-size:12px; color:#8b949e;">Масса головки сыра (кг):
              <input type="number" [(ngModel)]="chWeight" step="0.1" min="0.2" style="width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:6px; border-radius:5px;">
            </label>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; background:#0d1117; padding:14px; border-radius:6px; border:1px solid #30363d;">
            <div><span style="font-size:11px; color:#8b949e;">Нейодированная соль:</span> <strong style="font-size:16px; color:#7ee787;">{{ getCheeseSalt() }} г</strong></div>
            <div><span style="font-size:11px; color:#8b949e;">Сухой CaCl₂:</span> <strong style="font-size:16px;">{{ chWater * 1.5 }} г</strong> (защита от ослизнения)</div>
            <div><span style="font-size:11px; color:#8b949e;">Целевой pH:</span> <strong style="font-size:16px;">5.1 – 5.3</strong></div>
            <div><span style="font-size:11px; color:#8b949e;">Рекомендуемое время посолки:</span> <strong style="font-size:16px; color:#58a6ff;">~{{ getSaltingHours() }} ч</strong> (при 10–12°C)</div>
          </div>
        </div>
      }

      <!-- ТАЙМЕР ТЕХПРОЦЕССА -->
      @if (subTab() === 'timer') {
        <div style="text-align:center; padding:15px 0;">
          <div style="font-size:54px; font-family:monospace; font-weight:800; color:#7ee787; letter-spacing:2px; margin-bottom:6px;">
            {{ formatTime(remainSec()) }}
          </div>
          <div style="font-size:13px; color:#8b949e; margin-bottom:14px;">
            {{ stepTitle() || 'Таймер остановлен. Выберите этап производства ниже:' }}
          </div>
          <div style="display:flex; justify-content:center; gap:8px; margin-bottom:20px;">
            @if (!timerRunning()) {
              <button class="btn btn-green" (click)="resumeTimer()">▶ Старт / Продолжить</button>
            } @else {
              <button class="btn btn-warn" (click)="pauseTimer()">⏸ Пауза</button>
            }
            <button class="btn btn-outline" (click)="resetTimer()">⏹ Сброс</button>
            <button class="btn btn-blue" (click)="playBeep()">🔊 Тест звука (880 Гц)</button>
          </div>

          <div style="text-align:left;">
            @for (s of sampleSteps; track s.name; let idx = $index) {
              <div style="background:#0d1117; border:1px solid #30363d; border-radius:6px; padding:10px 14px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong style="color:#f0f6fc;">Шаг {{ idx + 1 }}: {{ s.name }}</strong>
                  <div style="font-size:11.5px; color:#8b949e;">{{ s.desc }}</div>
                  <div style="font-size:11px; color:#f0883e; margin-top:2px;">⚠️ ККТ ХАССП: {{ s.kkt }}</div>
                </div>
                <button class="btn btn-sm btn-blue" (click)="startStep(s.name, s.min)">Запустить ({{ s.min }} мин)</button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sub-tab { background:#21262d; color:#8b949e; border:1px solid #30363d; padding:7px 14px; border-radius:6px; cursor:pointer; font-weight:600; font-size:12.5px; }
    .sub-tab.act { background:#388bfd26; color:#58a6ff; border-color:#58a6ff; }
    .btn { padding:6px 14px; border-radius:6px; font-weight:600; cursor:pointer; border:1px solid transparent; font-size:12px; }
    .btn-green { background:#238636; color:#fff; }
    .btn-warn { background:#d29922; color:#fff; }
    .btn-blue { background:#1f6feb; color:#fff; }
    .btn-outline { background:transparent; border:1px solid #30363d; color:#c9d1d9; }
    .btn-sm { padding:3px 8px; font-size:11.5px; }
  `]
})
export class TechBrinePanelComponent {
  subTab = signal<'meat' | 'cheese' | 'timer'>('meat');
  meatWater = 10;
  meatBe = 10;
  chWater = 15;
  chPct = 20;
  chWeight = 1.0;

  remainSec = signal<number>(0);
  timerRunning = signal<boolean>(false);
  stepTitle = signal<string>('');
  private timerId: any = null;

  sampleSteps = [
    { name: 'Внесение закваски Sacco (Casaro)', min: 45, desc: 'Нагрев молока до 36 °C, внесение закваски', kkt: 't = 36±0.5 °C, pH 6.55' },
    { name: 'Ферментация и сгусток', min: 30, desc: 'Внесение сычужного фермента, мультипликатор 3.0', kkt: 'Точка схватывания сгустка' },
    { name: 'Чеддеризация сырной массы', min: 120, desc: 'Выдержка под сывороткой до точки плавления', kkt: 'pH 5.2 – 5.3' },
    { name: 'Шприцевание и мокрый посол ребер', min: 60, desc: 'Введение рассола 10°Bé (112 г/л), выдержка', kkt: 't рассола +2...+4 °C' },
    { name: 'Сушка в камере Ижица Varmen Mini', min: 30, desc: 'Обдув горячим воздухом при 55 °C', kkt: 'Сухая поверхность продукта' },
    { name: 'Копчение и паровая варка', min: 90, desc: 'Дым 65 °C, затем пар 75 °C до +72 °C внутри', kkt: 't в центре продукта +72 °C' }
  ];

  getMeatSalt(): number {
    const table: Record<number, number> = { 8: 87, 10: 112, 12: 139, 14: 167, 18: 231 };
    return Math.round(this.meatWater * (table[this.meatBe] || 112));
  }

  getCheeseSalt(): number {
    return Math.round(this.chWater * (this.chPct === 20 ? 250 : 190));
  }

  getSaltingHours(): number {
    return Math.round(this.chWeight * (this.chPct === 20 ? 5.5 : 7.0) * 10) / 10;
  }

  startStep(name: string, min: number): void {
    this.stopTimer();
    this.stepTitle.set(name);
    this.remainSec.set(min * 60);
    this.timerRunning.set(true);

    this.timerId = setInterval(() => {
      if (this.remainSec() > 1) {
        this.remainSec.set(this.remainSec() - 1);
      } else {
        this.remainSec.set(0);
        this.stopTimer();
        this.playBeep();
      }
    }, 1000);
  }

  resumeTimer(): void {
    if (this.remainSec() === 0 && this.sampleSteps.length) {
      this.startStep(this.sampleSteps[0].name, this.sampleSteps[0].min);
    } else if (!this.timerRunning() && this.remainSec() > 0) {
      this.timerRunning.set(true);
      this.timerId = setInterval(() => {
        if (this.remainSec() > 1) {
          this.remainSec.set(this.remainSec() - 1);
        } else {
          this.remainSec.set(0);
          this.stopTimer();
          this.playBeep();
        }
      }, 1000);
    }
  }

  pauseTimer(): void {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
    this.timerRunning.set(false);
  }

  stopTimer(): void {
    this.pauseTimer();
    this.timerRunning.set(false);
  }

  resetTimer(): void {
    this.stopTimer();
    this.remainSec.set(0);
    this.stepTitle.set('');
  }

  formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  playBeep(): void {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [0, 0.28, 0.56].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.24);
      });
    } catch (e) { console.warn('Audio error', e); }
  }
}
EOFmkdir -p beermood-master-erp-v3/src/app/components

cat << 'EOF' > beermood-master-erp-v3/src/app/components/tech-brine-panel.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tech-brine-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="background:#161b22; border:1px solid #30363d; border-radius:10px; padding:20px; color:#c9d1d9;">
      <div style="display:flex; gap:10px; margin-bottom:18px; border-bottom:1px solid #30363d; padding-bottom:12px;">
        <button class="sub-tab" [class.act]="subTab() === 'meat'" (click)="subTab.set('meat')">🥩 Рассолы для мяса (°Bé Коха)</button>
        <button class="sub-tab" [class.act]="subTab() === 'cheese'" (click)="subTab.set('cheese')">🧀 Рассолы для сыра (Casaro)</button>
        <button class="sub-tab" [class.act]="subTab() === 'timer'" (click)="subTab.set('timer')">⏱️ Пошаговый таймер техпроцесса</button>
      </div>

      <!-- МЯСНЫЕ РАССОЛЫ -->
      @if (subTab() === 'meat') {
        <div>
          <h3 style="color:#f0883e; margin-bottom:10px;">Калькулятор посолочного рассола по шкале Бёме (°Bé) Г. Коха</h3>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:14px;">
            <label style="font-size:12px; color:#8b949e;">Объем воды (литров):
              <input type="number" [(ngModel)]="meatWater" min="1" max="100" style="width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:6px; border-radius:5px;">
            </label>
            <label style="font-size:12px; color:#8b949e;">Плотность рассола (°Bé):
              <select [(ngModel)]="meatBe" style="width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:6px; border-radius:5px;">
                <option [value]="8">8 °Bé (87 г/л) — Деликатный посол птицы/вырезки</option>
                <option [value]="10">10 °Bé (112 г/л) — Стандарт Коха: ребра (1-002), грудинка (1-032)</option>
                <option [value]="12">12 °Bé (139 г/л) — Окорок, ветчина, карбонад</option>
                <option [value]="14">14 °Bé (167 г/л) — Мокрый посол шпика</option>
                <option [value]="18">18 °Bé (231 г/л) — Насыщенный доливочный рассол</option>
              </select>
            </label>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; background:#0d1117; padding:14px; border-radius:6px; border:1px solid #30363d;">
            <div><span style="font-size:11px; color:#8b949e;">Вода:</span> <strong style="font-size:16px;">{{ meatWater }} л</strong></div>
            <div><span style="font-size:11px; color:#8b949e;">Нитритная соль:</span> <strong style="font-size:16px; color:#7ee787;">{{ getMeatSalt() }} г</strong></div>
            <div><span style="font-size:11px; color:#8b949e;">Декстроза / Сахар:</span> <strong style="font-size:16px;">{{ meatWater * 4 }} г</strong></div>
            <div><span style="font-size:11px; color:#8b949e;">Пищевой фосфат:</span> <strong style="font-size:16px;">{{ meatWater * 3.5 }} г</strong></div>
          </div>
          <div style="margin-top:10px; font-size:12px; color:#8b949e; background:#1f242c; padding:8px 12px; border-radius:4px;">
            💡 Температура рассола и сырья при шприцевании: <strong>+2...+4 °C</strong>. Давление шприца: не более <strong>1.5 атм</strong>.
          </div>
        </div>
      }

      <!-- СЫРНЫЕ РАССОЛЫ -->
      @if (subTab() === 'cheese') {
        <div>
          <h3 style="color:#f0883e; margin-bottom:10px;">Калькулятор рассола для сыроделия (Casaro)</h3>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:14px;">
            <label style="font-size:12px; color:#8b949e;">Объем воды (литров):
              <input type="number" [(ngModel)]="chWater" min="1" max="200" style="width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:6px; border-radius:5px;">
            </label>
            <label style="font-size:12px; color:#8b949e;">Концентрация соли:
              <select [(ngModel)]="chPct" style="width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:6px; border-radius:5px;">
                <option [value]="16">16% (190 г/л) — Сулугуни, Моцарелла</option>
                <option [value]="20">20% (250 г/л) — Качотта, полутвердые сыры</option>
              </select>
            </label>
            <label style="font-size:12px; color:#8b949e;">Масса головки сыра (кг):
              <input type="number" [(ngModel)]="chWeight" step="0.1" min="0.2" style="width:100%; background:#0d1117; border:1px solid #30363d; color:#fff; padding:6px; border-radius:5px;">
            </label>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; background:#0d1117; padding:14px; border-radius:6px; border:1px solid #30363d;">
            <div><span style="font-size:11px; color:#8b949e;">Нейодированная соль:</span> <strong style="font-size:16px; color:#7ee787;">{{ getCheeseSalt() }} г</strong></div>
            <div><span style="font-size:11px; color:#8b949e;">Сухой CaCl₂:</span> <strong style="font-size:16px;">{{ chWater * 1.5 }} г</strong> (защита от ослизнения)</div>
            <div><span style="font-size:11px; color:#8b949e;">Целевой pH:</span> <strong style="font-size:16px;">5.1 – 5.3</strong></div>
            <div><span style="font-size:11px; color:#8b949e;">Рекомендуемое время посолки:</span> <strong style="font-size:16px; color:#58a6ff;">~{{ getSaltingHours() }} ч</strong> (при 10–12°C)</div>
          </div>
        </div>
      }

      <!-- ТАЙМЕР ТЕХПРОЦЕССА -->
      @if (subTab() === 'timer') {
        <div style="text-align:center; padding:15px 0;">
          <div style="font-size:54px; font-family:monospace; font-weight:800; color:#7ee787; letter-spacing:2px; margin-bottom:6px;">
            {{ formatTime(remainSec()) }}
          </div>
          <div style="font-size:13px; color:#8b949e; margin-bottom:14px;">
            {{ stepTitle() || 'Таймер остановлен. Выберите этап производства ниже:' }}
          </div>
          <div style="display:flex; justify-content:center; gap:8px; margin-bottom:20px;">
            @if (!timerRunning()) {
              <button class="btn btn-green" (click)="resumeTimer()">▶ Старт / Продолжить</button>
            } @else {
              <button class="btn btn-warn" (click)="pauseTimer()">⏸ Пауза</button>
            }
            <button class="btn btn-outline" (click)="resetTimer()">⏹ Сброс</button>
            <button class="btn btn-blue" (click)="playBeep()">🔊 Тест звука (880 Гц)</button>
          </div>

          <div style="text-align:left;">
            @for (s of sampleSteps; track s.name; let idx = $index) {
              <div style="background:#0d1117; border:1px solid #30363d; border-radius:6px; padding:10px 14px; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong style="color:#f0f6fc;">Шаг {{ idx + 1 }}: {{ s.name }}</strong>
                  <div style="font-size:11.5px; color:#8b949e;">{{ s.desc }}</div>
                  <div style="font-size:11px; color:#f0883e; margin-top:2px;">⚠️ ККТ ХАССП: {{ s.kkt }}</div>
                </div>
                <button class="btn btn-sm btn-blue" (click)="startStep(s.name, s.min)">Запустить ({{ s.min }} мин)</button>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sub-tab { background:#21262d; color:#8b949e; border:1px solid #30363d; padding:7px 14px; border-radius:6px; cursor:pointer; font-weight:600; font-size:12.5px; }
    .sub-tab.act { background:#388bfd26; color:#58a6ff; border-color:#58a6ff; }
    .btn { padding:6px 14px; border-radius:6px; font-weight:600; cursor:pointer; border:1px solid transparent; font-size:12px; }
    .btn-green { background:#238636; color:#fff; }
    .btn-warn { background:#d29922; color:#fff; }
    .btn-blue { background:#1f6feb; color:#fff; }
    .btn-outline { background:transparent; border:1px solid #30363d; color:#c9d1d9; }
    .btn-sm { padding:3px 8px; font-size:11.5px; }
  `]
})
export class TechBrinePanelComponent {
  subTab = signal<'meat' | 'cheese' | 'timer'>('meat');
  meatWater = 10;
  meatBe = 10;
  chWater = 15;
  chPct = 20;
  chWeight = 1.0;

  remainSec = signal<number>(0);
  timerRunning = signal<boolean>(false);
  stepTitle = signal<string>('');
  private timerId: any = null;

  sampleSteps = [
    { name: 'Внесение закваски Sacco (Casaro)', min: 45, desc: 'Нагрев молока до 36 °C, внесение закваски', kkt: 't = 36±0.5 °C, pH 6.55' },
    { name: 'Ферментация и сгусток', min: 30, desc: 'Внесение сычужного фермента, мультипликатор 3.0', kkt: 'Точка схватывания сгустка' },
    { name: 'Чеддеризация сырной массы', min: 120, desc: 'Выдержка под сывороткой до точки плавления', kkt: 'pH 5.2 – 5.3' },
    { name: 'Шприцевание и мокрый посол ребер', min: 60, desc: 'Введение рассола 10°Bé (112 г/л), выдержка', kkt: 't рассола +2...+4 °C' },
    { name: 'Сушка в камере Ижица Varmen Mini', min: 30, desc: 'Обдув горячим воздухом при 55 °C', kkt: 'Сухая поверхность продукта' },
    { name: 'Копчение и паровая варка', min: 90, desc: 'Дым 65 °C, затем пар 75 °C до +72 °C внутри', kkt: 't в центре продукта +72 °C' }
  ];

  getMeatSalt(): number {
    const table: Record<number, number> = { 8: 87, 10: 112, 12: 139, 14: 167, 18: 231 };
    return Math.round(this.meatWater * (table[this.meatBe] || 112));
  }

  getCheeseSalt(): number {
    return Math.round(this.chWater * (this.chPct === 20 ? 250 : 190));
  }

  getSaltingHours(): number {
    return Math.round(this.chWeight * (this.chPct === 20 ? 5.5 : 7.0) * 10) / 10;
  }

  startStep(name: string, min: number): void {
    this.stopTimer();
    this.stepTitle.set(name);
    this.remainSec.set(min * 60);
    this.timerRunning.set(true);

    this.timerId = setInterval(() => {
      if (this.remainSec() > 1) {
        this.remainSec.set(this.remainSec() - 1);
      } else {
        this.remainSec.set(0);
        this.stopTimer();
        this.playBeep();
      }
    }, 1000);
  }

  resumeTimer(): void {
    if (this.remainSec() === 0 && this.sampleSteps.length) {
      this.startStep(this.sampleSteps[0].name, this.sampleSteps[0].min);
    } else if (!this.timerRunning() && this.remainSec() > 0) {
      this.timerRunning.set(true);
      this.timerId = setInterval(() => {
        if (this.remainSec() > 1) {
          this.remainSec.set(this.remainSec() - 1);
        } else {
          this.remainSec.set(0);
          this.stopTimer();
          this.playBeep();
        }
      }, 1000);
    }
  }

  pauseTimer(): void {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
    this.timerRunning.set(false);
  }

  stopTimer(): void {
    this.pauseTimer();
    this.timerRunning.set(false);
  }

  resetTimer(): void {
    this.stopTimer();
    this.remainSec.set(0);
    this.stepTitle.set('');
  }

  formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  playBeep(): void {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [0, 0.28, 0.56].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.24);
      });
    } catch (e) { console.warn('Audio error', e); }
  }
}
