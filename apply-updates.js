const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, 'beermood-master-erp-v3', 'src', 'app');

const files = {
  // ================= 1. МОДЕЛИ ДАННЫХ =================
  'models/master-erp.model.ts': `export interface TechStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationMinutes: number;
  criticalHaccpPoint?: string;
}

export interface KochCardItem {
  code: string;
  plu: string;
  title: string;
  titleKz: string;
  yieldPct: number;
  packGrams: number;
  retailPricePerKgKzt: number;
  cogsKgKzt: number;
  steps: TechStep[];
}

export interface DairyCardItem {
  code: string;
  plu: string;
  title: string;
  titleKz: string;
  milkNormPerKg: number;
  packGrams: number;
  retailPricePerPackKzt: number;
  cogsPackKzt: number;
  steps: TechStep[];
}

export interface MeatBrineResult {
  waterLiters: number;
  beDegrees: number;
  nitriteSaltGrams: number;
  dextroseGrams: number;
  phosphateGrams: number;
}

export interface CheeseBrineResult {
  waterLiters: number;
  saltPct: number;
  saltGrams: number;
  cacl2Grams: number;
  targetPh: number;
  tempCelsius: number;
  cheeseWeightKg: number;
  saltingHours: number;
}
`,

  // ================= 2. СЕРВИС MASTER ERP =================
  'services/master-erp.service.ts': `import { Injectable, signal, computed } from '@angular/core';
import { KochCardItem, DairyCardItem, TechStep, MeatBrineResult, CheeseBrineResult } from '../models/master-erp.model';

@Injectable({ providedIn: 'root' })
export class MasterErpService {
  // Навигация
  activeTab = signal<string>('giant');
  drawerOpen = signal<boolean>(false);
  activeTechCard = signal<KochCardItem | DairyCardItem | null>(null);

  // Параметры партий
  kochBatchKg = signal<number>(20);
  dairyBatchLiters = signal<number>(100);

  // Таблица Бёме Германа Коха (°Bé -> г соли на 1 л воды)
  private readonly KOCH_BE_TABLE: Record<number, number> = {
    8: 87, 9: 99, 10: 112, 11: 126, 12: 139, 13: 153, 14: 167, 16: 198, 18: 231, 20: 265
  };

  // --- ТЕХКАРТЫ МЯСНОГО ЦЕХА (Г. КОХ) ---
  kochCards = signal<KochCardItem[]>([
    {
      code: 'BM-28',
      plu: 'PLU-28',
      title: 'Билтонг сыровяленый из конины (Жая)',
      titleKz: 'Жылқы етінен (Жая) сыраға арналған билтонг',
      yieldPct: 50,
      packGrams: 50,
      retailPricePerKgKzt: 35000,
      cogsKgKzt: 9600,
      steps: [
        { stepNumber: 1, title: 'Жиловка и отбор сырья', instruction: 'Зачистка отруба Жая NOR от пленок и фасций', durationMinutes: 25, criticalHaccpPoint: 'pH 5.5–5.8, t <= +4 °C' },
        { stepNumber: 2, title: 'Нарезка полос', instruction: 'Нарезка вдоль волокон полосами толщиной 20-25 мм', durationMinutes: 20 },
        { stepNumber: 3, title: 'Маринование в специях', instruction: 'Винный уксус (25 г/кг), кориандр, перец, нитритная соль (20 г/кг)', durationMinutes: 40, criticalHaccpPoint: 'Выдержка 12 ч при t +2...+4 °C' },
        { stepNumber: 4, title: 'Сушка в камере', instruction: 'Климатическая камера: +12...+14 °C, влажность 68-72%', durationMinutes: 240, criticalHaccpPoint: 'Усушка 50%, контроль aw <= 0.85' },
        { stepNumber: 5, title: 'Вакуумирование', instruction: 'Фасовка по 50 г в PA/PE пакеты + этикетка TSC TE310', durationMinutes: 30 }
      ]
    },
    {
      code: '1-002',
      plu: 'PLU-25',
      title: 'Ребра свиные копчено-вареные',
      titleKz: 'Ысталған-пісірілген қабырғалар',
      yieldPct: 86,
      packGrams: 450,
      retailPricePerKgKzt: 5200,
      cogsKgKzt: 2800,
      steps: [
        { stepNumber: 1, title: 'Приготовление рассола 10°Bé', instruction: '112 г нитритной соли + 4 г сахара на 1 л воды (t +2...+4 °C)', durationMinutes: 20, criticalHaccpPoint: 'Плотность по ареометру 10°Bé' },
        { stepNumber: 2, title: 'Мокрый посол', instruction: 'Погружение в рассол на 24 часа при температуре +4 °C', durationMinutes: 120, criticalHaccpPoint: 't камеры +3...+5 °C' },
        { stepNumber: 3, title: 'Сушка в Varmen Mini', instruction: 'Обдув горячим воздухом при 55 °C до сухой поверхности', durationMinutes: 30, criticalHaccpPoint: 'Сухая поверхность ребер' },
        { stepNumber: 4, title: 'Копчение', instruction: 'Подача дыма при 65 °C в камере Ижица Varmen Mini', durationMinutes: 45 },
        { stepNumber: 5, title: 'Варка паром', instruction: 'Варка паром при 75 °C до температуры внутри продукта +72 °C', durationMinutes: 40, criticalHaccpPoint: 't в центре ребер +72 °C' }
      ]
    },
    {
      code: '3-066',
      plu: 'PLU-21B',
      title: 'Кабаносси / Пивчики к пенному',
      titleKz: 'Кабаносси шұжықшалары',
      yieldPct: 78,
      packGrams: 120,
      retailPricePerKgKzt: 10400,
      cogsKgKzt: 4200,
      steps: [
        { stepNumber: 1, title: 'Измельчение сырья', instruction: 'Грудинка S4b через решетку 10 мм, говядина R2 через 3 мм', durationMinutes: 25 },
        { stepNumber: 2, title: 'Вымешивание фарша', instruction: 'Внесение нитритной соли 18 г/кг, паприки и перца', durationMinutes: 20 },
        { stepNumber: 3, title: 'Набивка в оболочку', instruction: 'Шприцевание в баранью череву 18/20 мм', durationMinutes: 35 },
        { stepNumber: 4, title: 'Копчение и варка', instruction: 'Горячее копчение при 70 °C (60 мин), пар при 75 °C (40 мин)', durationMinutes: 100, criticalHaccpPoint: 't ядра +71 °C' }
      ]
    }
  ]);

  // --- ТЕХКАРТЫ СЫРОВАРНИ (CASARO) ---
  dairyCards = signal<DairyCardItem[]>([
    {
      code: 'CH-01',
      plu: 'PLU-01',
      title: 'Сыр Сулугуни слоистый (головка)',
      titleKz: 'Сулугуни ірімшігі',
      milkNormPerKg: 10.2,
      packGrams: 500,
      retailPricePerPackKzt: 2600,
      cogsPackKzt: 1350,
      steps: [
        { stepNumber: 1, title: 'Пастеризация и закваска', instruction: 'Нагрев до 72 °C (20 сек), охлаждение до 36 °C, внесение Sacco', durationMinutes: 45, criticalHaccpPoint: 't заквашивания 36 °C, pH 6.6' },
        { stepNumber: 2, title: 'Внесение фермента', instruction: 'Внесение сычужного фермента, образование сгустка', durationMinutes: 30, criticalHaccpPoint: 'Мультипликатор 3.0' },
        { stepNumber: 3, title: 'Постановка зерна', instruction: 'Нарезка лирой до 10-12 мм, вымешивание 15 минут', durationMinutes: 20 },
        { stepNumber: 4, title: 'Чеддеризация', instruction: 'Созревание сырного пласта под сывороткой до pH 5.2–5.3', durationMinutes: 120, criticalHaccpPoint: 'Проба на плавление в воде 75 °C' },
        { stepNumber: 5, title: 'Плавление и формование', instruction: 'Вытягивание массы в горячей воде (75 °C), формовка головок', durationMinutes: 40 },
        { stepNumber: 6, title: 'Посолка в рассоле', instruction: 'Погружение в 18% рассол (10–12 °C) с CaCl₂ на 4.5 часа', durationMinutes: 270, criticalHaccpPoint: 't рассола 10–12 °C, pH рассола 5.2' }
      ]
    },
    {
      code: 'CH-03',
      plu: 'PLU-03',
      title: 'Страчателла в сливках (в банке)',
      titleKz: 'Страчателла қаймақта',
      milkNormPerKg: 9.5,
      packGrams: 250,
      retailPricePerPackKzt: 1950,
      cogsPackKzt: 920,
      steps: [
        { stepNumber: 1, title: 'Вытягивание волокон', instruction: 'Плавление моцарелльного зерна в воде 78 °C, растяжка нитей', durationMinutes: 30 },
        { stepNumber: 2, title: 'Охлаждение нитей', instruction: 'Шоковое охлаждение нитей в воде со льдом (+4 °C)', durationMinutes: 15 },
        { stepNumber: 3, title: 'Разделение и заливка сливками', instruction: 'Расщепление нитей на волокна, соединение со сливками 33% (1:1)', durationMinutes: 25, criticalHaccpPoint: 't сливок +4 °C, соль 0.8%' },
        { stepNumber: 4, title: 'Фасовка в баночки', instruction: 'Укупорка баночек 250 г + маркировка партии TSC TE310', durationMinutes: 20 }
      ]
    }
  ]);

  // --- ТАЙМЕР И ЗВУКОВОЙ СИГНАЛ ---
  timerActive = signal<boolean>(false);
  remainingSeconds = signal<number>(0);
  currentTimerStepTitle = signal<string>('');
  private timerInterval: any = null;

  startTimer(durationMinutes: number, title: string): void {
    this.stopTimer();
    this.currentTimerStepTitle.set(title);
    this.remainingSeconds.set(Math.round(durationMinutes * 60));
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
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // Тройной отчетливый звуковой сигнал 880 Гц (нота Ля)
      [0, 0.28, 0.56].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime + delay);

        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.24);
      });
    } catch (e) {
      console.warn('Audio Context error', e);
    }
  }

  // --- КАЛЬКУЛЯТОР МЯСНОГО РАССОЛА (°Bé Коха) ---
  calculateMeatBrine(waterL: number, beDeg: number): MeatBrineResult {
    const saltPerL = this.KOCH_BE_TABLE[beDeg] || 112;
    return {
      waterLiters: waterL,
      beDegrees: beDeg,
      nitriteSaltGrams: Math.round(waterL * saltPerL),
      dextroseGrams: Math.round(waterL * 4.0),
      phosphateGrams: Math.round(waterL * 3.5)
    };
  }

  // --- КАЛЬКУЛЯТОР СЫРНОГО РАССОЛА (Casaro) ---
  calculateCheeseBrine(waterL: number, saltPct: number, cheeseWeightKg: number): CheeseBrineResult {
    const saltPerL = saltPct === 20 ? 250 : 190;
    const hours = Math.round(cheeseWeightKg * (saltPct === 20 ? 5.5 : 7.0) * 10) / 10;
    return {
      waterLiters: waterL,
      saltPct,
      saltGrams: Math.round(waterL * saltPerL),
      cacl2Grams: Math.round(waterL * 1.5),
      targetPh: 5.2,
      tempCelsius: 11,
      cheeseWeightKg,
      saltingHours: hours
    };
  }

  resetAllData(): void {
    this.kochBatchKg.set(20);
    this.dairyBatchLiters.set(100);
    this.stopTimer();
  }
}
`,

  // ================= 3. APP COMPONENT (КОНТРОЛЛЕР) =================
  'app.component.ts': `import { Component, inject, signal } from '@angular/core';
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
    return \`\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
  }
}
`,

  // ================= 4. ШАБЛОН ИНТЕРФЕЙСА (HTML) =================
  'app.component.html': `
<header class="top-bar">
  <div class="brand">
    <h1>🏭 BEERMOOD PRO MANUFACTURING ERP v3.3</h1>
    <p>ЖК «Арай» • Комплекс 149,4 м² • Производственный контур -4.200 и -7.800</p>
  </div>
  <div class="top-right">
    @if (erp.timerActive()) {
      <div class="timer-badge blink">
        ⏱️ ИДЕТ ШАГ: {{ erp.currentTimerStepTitle() }} — <strong>{{ formatSeconds(erp.remainingSeconds()) }}</strong>
      </div>
    }
    <button class="btn btn-outline btn-sm" (click)="erp.resetAllData()">Сброс</button>
  </div>
</header>

<!-- ГЛАВНАЯ НАВИГАЦИЯ -->
<nav class="nav-tabs">
  <button class="nav-tab" [class.active]="erp.activeTab() === 'giant'" (click)="erp.activeTab.set('giant')">
    🥩 Рецептуры и Карты Г. Коха
  </button>
  <button class="nav-tab" [class.active]="erp.activeTab() === 'dairy'" (click)="erp.activeTab.set('dairy')">
    🧀 Сыроварня Casaro
  </button>
  <button class="nav-tab" [class.active]="erp.activeTab() === 'meat_brine'" (click)="erp.activeTab.set('meat_brine')">
    🧪 Рассолы для мяса (°Bé Коха)
  </button>
  <button class="nav-tab" [class.active]="erp.activeTab() === 'cheese_brine'" (click)="erp.activeTab.set('cheese_brine')">
    🧂 Рассолы для сыра (Casaro)
  </button>
  <button class="nav-tab" [class.active]="erp.activeTab() === 'timer_hub'" (click)="erp.activeTab.set('timer_hub')">
    ⏱️ Пошаговый таймер техпроцесса
  </button>
</nav>

<main class="workspace">
  <!-- 1. ТЕХКАРТЫ МЯСНОГО ЦЕХА -->
  @if (erp.activeTab() === 'giant') {
    <div class="card">
      <div class="card-head">
        <h2>Технологические карты мясного цеха (Герман Кох ⇄ СТ РК)</h2>
        <div class="ctrl-box">
          <label>Загрузка сырья (кг):</label>
          <input type="number" [ngModel]="erp.kochBatchKg()" (ngModelChange)="erp.kochBatchKg.set(+$event)" style="width:60px;">
        </div>
      </div>
      <div class="grid">
        @for (c of erp.kochCards(); track c.plu) {
          <div class="item-card">
            <div class="item-top">
              <span class="badge-code">{{ c.code }}</span>
              <span class="badge-plu">{{ c.plu }}</span>
            </div>
            <div class="item-title">{{ c.title }}</div>
            <div class="item-kz">{{ c.titleKz }}</div>
            <div class="econ-line">
              <div>Выход: <strong>{{ c.yieldPct }}%</strong></div>
              <div>Розница: <strong>{{ c.retailPricePerKgKzt | number }} ₸/кг</strong></div>
              <div>Фасовка: <strong>{{ c.packGrams }} г</strong></div>
            </div>
            <button class="btn btn-blue" style="width:100%; margin-top:10px;" (click)="openDrawer(c)">
              📋 Открыть пошаговый техпроцесс ({{ c.steps.length }} шагов)
            </button>
          </div>
        }
      </div>
    </div>
  }

  <!-- 2. СЫРОВАРНЯ -->
  @if (erp.activeTab() === 'dairy') {
    <div class="card">
      <div class="card-head">
        <h2>Сыроварня и переработка молока (Сыроизготовители Casaro)</h2>
        <div class="ctrl-box">
          <label>Варка молока (литров):</label>
          <input type="number" [ngModel]="erp.dairyBatchLiters()" (ngModelChange)="erp.dairyBatchLiters.set(+$event)" style="width:60px;">
        </div>
      </div>
      <div class="grid">
        @for (c of erp.dairyCards(); track c.plu) {
          <div class="item-card">
            <div class="item-top">
              <span class="badge-code">{{ c.code }}</span>
              <span class="badge-plu">{{ c.plu }}</span>
            </div>
            <div class="item-title">{{ c.title }}</div>
            <div class="item-kz">{{ c.titleKz }}</div>
            <div class="econ-line">
              <div>Норма молока: <strong>{{ c.milkNormPerKg }} л/кг</strong></div>
              <div>Цена за банку/уп: <strong>{{ c.retailPricePerPackKzt | number }} ₸</strong></div>
            </div>
            <button class="btn btn-green" style="width:100%; margin-top:10px;" (click)="openDrawer(c)">
              🧀 Открыть регламент варки и посолки
            </button>
          </div>
        }
      </div>
    </div>
  }

  <!-- 3. МОДУЛЬ МЯСНЫХ РАССОЛОВ -->
  @if (erp.activeTab() === 'meat_brine') {
    <div class="card">
      <h2>🥩 Калькулятор приготовления посолочных рассолов (Герман Кох)</h2>
      <p style="color:#8b949e; font-size:12.5px; margin-bottom:14px;">
        Точный расчет навески нитритной соли, декстрозы и фосфатов по плотности Бёме (°Bé) для шприцевания и мокрого посола.
      </p>
      <div class="input-row">
        <label>Объем чистой воды (литров):
          <input type="number" [(ngModel)]="meatWater" min="1" max="100">
        </label>
        <label>Плотность рассола (°Bé):
          <select [(ngModel)]="meatBe">
            <option [value]="8">8 °Bé (87 г/л) — Деликатный посол вырезки и птицы</option>
            <option [value]="10">10 °Bé (112 г/л) — Стандарт Коха: ребра (1-002), грудинка (1-032)</option>
            <option [value]="12">12 °Bé (139 г/л) — Окорок, ветчина, крупный кусок</option>
            <option [value]="14">14 °Bé (167 г/л) — Мокрый посол шпика и корейки</option>
            <option [value]="18">18 °Bé (231 г/л) — Насыщенный доливочный рассол</option>
          </select>
        </label>
      </div>

      @let mb = erp.calculateMeatBrine(meatWater, meatBe);
      <div class="res-box">
        <div class="res-item"><span>Объем воды:</span><strong>{{ mb.waterLiters }} л</strong></div>
        <div class="res-item"><span>Нитритная соль:</span><strong class="hi">{{ mb.nitriteSaltGrams }} г</strong></div>
        <div class="res-item"><span>Декстроза / Сахар:</span><strong>{{ mb.dextroseGrams }} г</strong></div>
        <div class="res-item"><span>Фосфат пищевой:</span><strong>{{ mb.phosphateGrams }} г</strong></div>
      </div>
      <div class="note">
        💡 <strong>Технологический регламент:</strong> Температура рассола при шприцевании: <strong>+2...+4 °C</strong>. Давление шприца не более <strong>1.5 атм</strong> (исключает разрыв мышечных волокон).
      </div>
    </div>
  }

  <!-- 4. МОДУЛЬ СЫРНЫХ РАССОЛОВ -->
  @if (erp.activeTab() === 'cheese_brine') {
    <div class="card">
      <h2>🧀 Калькулятор рассола для сыроделия (Casaro)</h2>
      <p style="color:#8b949e; font-size:12.5px; margin-bottom:14px;">
        Балансировка солености, ионов кальция (CaCl₂) и расчет времени выдержки сыра без ослизнения корки.
      </p>
      <div class="input-row">
        <label>Объем воды (литров):
          <input type="number" [(ngModel)]="cheeseWater" min="1" max="200">
        </label>
        <label>Концентрация соли:
          <select [(ngModel)]="cheesePct">
            <option [value]="16">16% (190 г/л) — Сулугуни, Моцарелла</option>
            <option [value]="20">20% (250 г/л) — Качотта, полутвердые сыры</option>
          </select>
        </label>
        <label>Масса головки сыра (кг):
          <input type="number" [(ngModel)]="cheeseWeight" step="0.1" min="0.2">
        </label>
      </div>

      @let cb = erp.calculateCheeseBrine(cheeseWater, cheesePct, cheeseWeight);
      <div class="res-box">
        <div class="res-item"><span>Нейодированная соль:</span><strong class="hi">{{ cb.saltGrams }} г</strong></div>
        <div class="res-item"><span>Хлористый кальций (CaCl₂):</span><strong>{{ cb.cacl2Grams }} г</strong> (защита от размягчения)</div>
        <div class="res-item"><span>Кислотность рассола (pH):</span><strong>{{ cb.targetPh }}</strong> (сыворотка/молочная кислота)</div>
        <div class="res-item"><span>Рекомендуемое время посолки:</span><strong class="hi">~{{ cb.saltingHours }} ч</strong> (при 10–12 °C)</div>
      </div>
      <div class="note">
        ⚠️ <strong>Контроль ХАССП:</strong> Температура рассола строго <strong>10–12 °C</strong>. При превышении 14 °C развиваются дефекты корки; ниже 9 °C диффузия соли замедляется.
      </div>
    </div>
  }

  <!-- 5. ЦЕНТРАЛЬНЫЙ ТАЙМЕР ТЕХПРОЦЕССА -->
  @if (erp.activeTab() === 'timer_hub') {
    <div class="card">
      <h2>⏱️ Мониторинг пошагового выполнения техпроцесса</h2>
      <div class="timer-center">
        <div class="digits" [class.blink]="erp.timerActive()">
          {{ formatSeconds(erp.remainingSeconds()) }}
        </div>
        <div class="step-label">
          {{ erp.currentTimerStepTitle() || 'Таймер остановлен. Выберите шаг из техкарты или запустите тест.' }}
        </div>
        <div class="btn-group">
          @if (erp.timerActive()) {
            <button class="btn btn-warn" (click)="erp.pauseTimer()">⏸ Пауза</button>
          }
          <button class="btn btn-outline" (click)="erp.stopTimer()">⏹ Сброс</button>
          <button class="btn btn-blue" (click)="erp.playAlarmSignal()">🔊 Тест звукового сигнала (880 Гц)</button>
        </div>
      </div>
    </div>
  }
</main>

<!-- ПРАВАЯ ВЫЕЗЖАЮЩАЯ ПАНЕЛЬ ТЕХНОЛОГИЧЕСКОЙ КАРТЫ (OFFCANVAS DRAWER) -->
@if (erp.drawerOpen() && erp.activeTechCard()) {
  <div class="drawer-overlay" (click)="closeDrawer()"></div>
  <aside class="drawer">
    <div class="drawer-head">
      <div>
        <span class="badge-code">{{ erp.activeTechCard()!.code }}</span>
        <h3>{{ erp.activeTechCard()!.title }}</h3>
      </div>
      <button class="btn-close" (click)="closeDrawer()">✕</button>
    </div>

    <div class="drawer-body">
      <h4>Пошаговый технологический процесс с контролем времени</h4>
      @for (st of erp.activeTechCard()!.steps; track st.stepNumber) {
        <div class="step-card">
          <div class="step-head">
            <strong>Шаг {{ st.stepNumber }}: {{ st.title }}</strong>
            <span class="step-dur">{{ st.durationMinutes }} мин</span>
          </div>
          <div class="step-inst">{{ st.instruction }}</div>
          @if (st.criticalHaccpPoint) {
            <div class="kkt-badge">⚠️ ККТ ХАССП: {{ st.criticalHaccpPoint }}</div>
          }
          <button class="btn btn-sm btn-green" style="margin-top:8px;" (click)="erp.startTimer(st.durationMinutes, st.title)">
            ▶ Запустить таймер шага ({{ st.durationMinutes }} мин)
          </button>
        </div>
      }
    </div>
  </aside>
}
`,

  // ================= 5. СТИЛИ ИНТЕРФЕЙСА (CSS) =================
  'app.component.css': `
:host { display: block; min-height: 100vh; background: #090d13; color: #c9d1d9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.top-bar { background: #161b22; border-bottom: 1px solid #30363d; padding: 14px 24px; display: flex; justify-content: space-between; align-items: center; }
.brand h1 { font-size: 1.15rem; color: #f0883e; margin: 0; }
.brand p { font-size: 0.78rem; color: #8b949e; margin: 2px 0 0; }
.top-right { display: flex; align-items: center; gap: 12px; }
.timer-badge { background: #238636; color: #fff; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.blink { animation: pulse 1.5s infinite; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }

.nav-tabs { display: flex; gap: 6px; background: #0d1117; border-bottom: 1px solid #30363d; padding: 8px 24px; overflow-x: auto; }
.nav-tab { background: #21262d; border: 1px solid #30363d; color: #8b949e; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
.nav-tab.active { background: #388bfd26; color: #58a6ff; border-color: #58a6ff; }

.workspace { padding: 24px; max-width: 1400px; margin: 0 auto; }
.card { background: #161b22; border: 1px solid #30363d; border-radius: 10px; padding: 20px; }
.card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.card-head h2 { font-size: 1.1rem; color: #f0f6fc; margin: 0; }
.ctrl-box { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #8b949e; }
.ctrl-box input { background: #0d1117; border: 1px solid #30363d; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: 700; }

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
.item-card { background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 14px; }
.item-top { display: flex; gap: 6px; margin-bottom: 6px; }
.badge-code { background: #f0883e26; color: #f0883e; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; }
.badge-plu { background: #388bfd26; color: #58a6ff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; }
.item-title { font-size: 14px; font-weight: 700; color: #f0f6fc; }
.item-kz { font-size: 12px; color: #8b949e; margin-bottom: 8px; }
.econ-line { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; background: #161b22; padding: 8px; border-radius: 6px; font-size: 11.5px; border: 1px solid #21262d; }
.econ-line strong { color: #7ee787; display: block; font-size: 12px; }

.input-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px; }
.input-row label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; color: #8b949e; }
.input-row input, .input-row select { background: #0d1117; border: 1px solid #30363d; color: #f0f6fc; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
.res-box { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; background: #0d1117; padding: 14px; border-radius: 8px; border: 1px solid #30363d; margin-bottom: 12px; }
.res-item span { display: block; font-size: 11.5px; color: #8b949e; }
.res-item strong { font-size: 16px; color: #f0f6fc; }
.res-item strong.hi { color: #7ee787; }
.note { background: #1c2128; border-left: 3px solid #f0883e; padding: 10px 14px; font-size: 12px; color: #c9d1d9; border-radius: 4px; }

.timer-center { text-align: center; padding: 30px 20px; }
.digits { font-size: 64px; font-family: monospace; font-weight: 800; color: #7ee787; margin-bottom: 8px; }
.step-label { font-size: 14px; color: #8b949e; margin-bottom: 20px; }
.btn-group { display: flex; justify-content: center; gap: 10px; }

.btn { padding: 8px 14px; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; border: 1px solid transparent; }
.btn-blue { background: #1f6feb; color: #fff; }
.btn-green { background: #238636; color: #fff; }
.btn-warn { background: #d29922; color: #fff; }
.btn-outline { background: transparent; border-color: #30363d; color: #c9d1d9; }
.btn-sm { padding: 4px 10px; font-size: 11.5px; }

.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 100; }
.drawer { position: fixed; top: 0; right: 0; width: 480px; height: 100vh; background: #161b22; border-left: 1px solid #30363d; z-index: 101; display: flex; flex-direction: column; }
.drawer-head { padding: 16px 20px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: flex-start; }
.drawer-head h3 { margin: 4px 0 0; font-size: 16px; color: #fff; }
.btn-close { background: none; border: none; color: #8b949e; font-size: 18px; cursor: pointer; }
.drawer-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
.drawer-body h4 { font-size: 13px; color: #f0883e; margin-bottom: 12px; }
.step-card { background: #0d1117; border: 1px solid #30363d; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
.step-head { display: flex; justify-content: space-between; font-size: 13px; color: #f0f6fc; }
.step-dur { font-size: 11.5px; color: #58a6ff; font-weight: 700; }
.step-inst { font-size: 12px; color: #8b949e; margin-top: 4px; }
.kkt-badge { font-size: 11px; color: #f0883e; background: #f0883e1a; padding: 2px 6px; border-radius: 4px; margin-top: 6px; display: inline-block; font-weight: 600; }
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(appRoot, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
}

console.log('✅ Все модули рассолов, техпроцесса и звукового таймера успешно внедрены!');