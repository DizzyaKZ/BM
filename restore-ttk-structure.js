const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, 'beermood-master-erp-v3', 'src', 'app');

// 1. МОДЕЛИ ДАННЫХ
const modelsCode = `export interface TechStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationMinutes: number;
  criticalHaccpPoint?: string;
  completed?: boolean;
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
  requiresBrine?: boolean;
  brineBe?: number;
  brineInjectionPct?: number;
  meats: { name: string; pct: number }[];
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
  requiresBrine?: boolean;
  brinePct?: number;
  steps: TechStep[];
}
`;
fs.writeFileSync(path.join(root, 'models', 'master-erp.model.ts'), modelsCode, 'utf8');

// 2. СЕРВИС MASTER ERP
const serviceCode = `import { Injectable, signal } from '@angular/core';
import { KochCardItem, DairyCardItem, TechStep } from '../models/master-erp.model';

@Injectable({ providedIn: 'root' })
export class MasterErpService {
  activeTab = signal<string>('koch');
  drawerOpen = signal<boolean>(false);
  selectedProduct = signal<KochCardItem | DairyCardItem | null>(null);

  kochBatchKg = signal<number>(20);
  dairyBatchLiters = signal<number>(100);

  // Таблица Бёме Германа Коха (°Bé -> г соли на 1 л воды)
  readonly KOCH_BE_TABLE: Record<number, number> = {
    8: 87, 9: 99, 10: 112, 11: 126, 12: 139, 13: 153, 14: 167, 16: 198, 18: 231, 20: 265
  };

  // ТАЙМЕР И ЗВУКОВОЙ СИГНАЛ
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
    } catch (e) {
      console.warn('Audio Context error', e);
    }
  }

  // Расчет рассола для мяса (°Bé)
  calcMeatBrine(waterL: number, beDeg: number) {
    const saltPerL = this.KOCH_BE_TABLE[beDeg] || 112;
    return {
      waterL,
      beDeg,
      saltG: Math.round(waterL * saltPerL),
      dextroseG: Math.round(waterL * 4.0),
      phosphateG: Math.round(waterL * 3.5)
    };
  }

  // Расчет рассола для сыра (Casaro)
  calcCheeseBrine(waterL: number, saltPct: number, cheeseWeightKg: number) {
    const saltPerL = saltPct === 20 ? 250 : 190;
    const hours = Math.round(cheeseWeightKg * (saltPct === 20 ? 5.5 : 7.0) * 10) / 10;
    return {
      waterL,
      saltPct,
      saltG: Math.round(waterL * saltPerL),
      cacl2G: Math.round(waterL * 1.5),
      targetPh: 5.2,
      hours
    };
  }

  // ТЕХКАРТЫ МЯСНОГО ЦЕХА
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
      requiresBrine: false,
      meats: [{ name: 'Конина Жая NOR (0% жира)', pct: 100 }],
      steps: [
        { stepNumber: 1, title: 'Жиловка и отбор сырья', instruction: 'Зачистка отруба Жая NOR от пленок и фасций', durationMinutes: 25, criticalHaccpPoint: 'pH 5.5–5.8, t <= +4 °C', completed: false },
        { stepNumber: 2, title: 'Нарезка полос', instruction: 'Нарезка вдоль волокон полосами толщиной 20-25 мм', durationMinutes: 20, completed: false },
        { stepNumber: 3, title: 'Сухой посол и специи', instruction: 'Винный уксус (25 г/кг), кориандр, перец, нитритная соль (20 г/кг)', durationMinutes: 40, criticalHaccpPoint: 'Выдержка 12 ч при t +2...+4 °C', completed: false },
        { stepNumber: 4, title: 'Климатическая сушка', instruction: 'Сушка в камере: +12...+14 °C, влажность 68-72%', durationMinutes: 240, criticalHaccpPoint: 'Усушка 50%, aw <= 0.85', completed: false },
        { stepNumber: 5, title: 'Вакуумирование', instruction: 'Фасовка по 50 г в PA/PE пакеты + этикетка TSC TE310', durationMinutes: 30, completed: false }
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
      requiresBrine: true,
      brineBe: 10,
      brineInjectionPct: 10,
      meats: [{ name: 'Ребра мясные свиные (полоса)', pct: 100 }],
      steps: [
        { stepNumber: 1, title: 'Приготовление рассола 10°Bé', instruction: '112 г нитритной соли + 4 г декстрозы на 1 л воды при +2...+4 °C', durationMinutes: 15, criticalHaccpPoint: 'Плотность 10°Bé', completed: false },
        { stepNumber: 2, title: 'Шприцевание и мокрый посол', instruction: 'Введение рассола 10% к массе мяса, выдержка в рассоле 24 ч при +4 °C', durationMinutes: 60, criticalHaccpPoint: 't мяса и рассола +2...+4 °C', completed: false },
        { stepNumber: 3, title: 'Сушка в Ижица Varmen Mini', instruction: 'Обдув горячим воздухом при 55 °C до сухой поверхности', durationMinutes: 30, criticalHaccpPoint: 'Сухая поверхность ребер', completed: false },
        { stepNumber: 4, title: 'Горячее копчение', instruction: 'Подача дыма при 65 °C в камере Varmen Mini', durationMinutes: 45, completed: false },
        { stepNumber: 5, title: 'Варка паром', instruction: 'Варка паром при 75 °C до температуры внутри ребер +72 °C', durationMinutes: 40, criticalHaccpPoint: 't ядра +72 °C', completed: false }
      ]
    },
    {
      code: '1-032',
      plu: 'PLU-24',
      title: 'Грудинка свиная копченая (Бекон)',
      titleKz: 'Ысталған шошқа төсі (Бекон)',
      yieldPct: 88,
      packGrams: 350,
      retailPricePerKgKzt: 5200,
      cogsKgKzt: 2750,
      requiresBrine: true,
      brineBe: 10,
      brineInjectionPct: 10,
      meats: [{ name: 'Грудинка бескостная 70/30 (S4)', pct: 100 }],
      steps: [
        { stepNumber: 1, title: 'Приготовление рассола 10°Bé', instruction: '112 г нитритной соли на 1 л воды, t рассола +3 °C', durationMinutes: 15, completed: false },
        { stepNumber: 2, title: 'Шприцевание и выдержка', instruction: 'Шприцевание 10% + мокрый посол 48 часов', durationMinutes: 45, criticalHaccpPoint: 't камеры посола +2...+4 °C', completed: false },
        { stepNumber: 3, title: 'Сушка и копчение', instruction: 'Сушка 55 °C (35 мин), копчение 65 °C (60 мин)', durationMinutes: 95, completed: false },
        { stepNumber: 4, title: 'Варка паром и охлаждение', instruction: 'Варка при 74 °C до +71 °C внутри, холодное душирование', durationMinutes: 50, criticalHaccpPoint: 't ядра +71 °C', completed: false }
      ]
    },
    {
      code: '3-066',
      plu: 'PLU-21B',
      title: 'Кабаносси / Пивчики полукопченые',
      titleKz: 'Кабаносси шұжықшалары',
      yieldPct: 78,
      packGrams: 120,
      retailPricePerKgKzt: 10400,
      cogsKgKzt: 4200,
      requiresBrine: false,
      meats: [
        { name: 'Говядина 1 с (R2) фарш-основа', pct: 40 },
        { name: 'Грудинка свиная 50/50 (S4b)', pct: 60 }
      ],
      steps: [
        { stepNumber: 1, title: 'Измельчение сырья', instruction: 'Грудинка через решетку 10 мм, говядина через 3 мм', durationMinutes: 20, completed: false },
        { stepNumber: 2, title: 'Фаршесоставление', instruction: 'Вымешивание с нитритной солью 18 г/кг, паприкой и перцем', durationMinutes: 20, completed: false },
        { stepNumber: 3, title: 'Набивка в баранью череву', instruction: 'Шприцевание в калибр 18/20 мм без пузырей воздуха', durationMinutes: 40, completed: false },
        { stepNumber: 4, title: 'Термообработка в Varmen Mini', instruction: 'Дым 70 °C (60 мин), пар 75 °C (40 мин), сушка', durationMinutes: 120, criticalHaccpPoint: 't ядра +71 °C', completed: false }
      ]
    }
  ]);

  // ТЕХКАРТЫ СЫРОВАРНИ
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
      requiresBrine: true,
      brinePct: 18,
      steps: [
        { stepNumber: 1, title: 'Пастеризация и закваска Sacco', instruction: 'Нагрев до 72 °C (20 с), охлаждение до 36 °C, внесение Sacco MS062', durationMinutes: 45, criticalHaccpPoint: 't = 36±0.5 °C, pH 6.6', completed: false },
        { stepNumber: 2, title: 'Внесение фермента', instruction: 'Внесение сычужного фермента, образование сгустка', durationMinutes: 30, criticalHaccpPoint: 'Мультипликатор 3.0', completed: false },
        { stepNumber: 3, title: 'Постановка зерна', instruction: 'Нарезка лирой до 10 мм, вымешивание 15 минут', durationMinutes: 20, completed: false },
        { stepNumber: 4, title: 'Чеддеризация пласта', instruction: 'Созревание сырной массы под сывороткой до pH 5.2–5.3', durationMinutes: 120, criticalHaccpPoint: 'Проба на плавление в воде 75 °C', completed: false },
        { stepNumber: 5, title: 'Плавление и формование', instruction: 'Вытягивание массы Pasta Filata в воде 75 °C, формовка головок 500 г', durationMinutes: 40, completed: false },
        { stepNumber: 6, title: 'Посолка в рассоле 18% с CaCl₂', instruction: 'Выдержка головок 500 г в рассоле 18% (10–12 °C) в течение 4–5 часов', durationMinutes: 270, criticalHaccpPoint: 't рассола 10–12 °C, pH 5.2', completed: false }
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
      requiresBrine: false,
      steps: [
        { stepNumber: 1, title: 'Плавление зерна', instruction: 'Нагрев моцарелльного зерна в воде 78 °C, вытягивание эластичных лент', durationMinutes: 30, completed: false },
        { stepNumber: 2, title: 'Шоковое охлаждение', instruction: 'Охлаждение нитей в воде со льдом (+4 °C) для фиксации структуры', durationMinutes: 15, completed: false },
        { stepNumber: 3, title: 'Разделение и соединение со сливками', instruction: 'Расщепление нитей на тонкие волокна, смешивание со сливками 33% и солью', durationMinutes: 25, criticalHaccpPoint: 't сливок +4 °C', completed: false },
        { stepNumber: 4, title: 'Фасовка в баночки 250 г', instruction: 'Укупорка баночек + этикетка ТермоТОП 58×60 мм на TSC TE310', durationMinutes: 20, completed: false }
      ]
    },
    {
      code: 'CH-02',
      plu: 'PLU-02',
      title: 'Творог пластовой 9%',
      titleKz: 'Қатпарлы сүзбе 9%',
      milkNormPerKg: 6.8,
      packGrams: 350,
      retailPricePerPackKzt: 1350,
      cogsPackKzt: 680,
      requiresBrine: false,
      steps: [
        { stepNumber: 1, title: 'Внесение закваски', instruction: 'Сквашивание молока мезофильной закваской при 28-30 °C', durationMinutes: 45, completed: false },
        { stepNumber: 2, title: 'Сквашивание', instruction: 'Формирование пластового сгустка до кислотности pH 4.6', durationMinutes: 600, criticalHaccpPoint: 'pH 4.55 – 4.65', completed: false },
        { stepNumber: 3, title: 'Подогрев и отделение сыворотки', instruction: 'Медленный нагрев до 40-42 °C, самопрессование на лавсане', durationMinutes: 90, completed: false }
      ]
    }
  ]);

  resetAllData(): void {
    this.kochBatchKg.set(20);
    this.dairyBatchLiters.set(100);
    this.stopTimer();
    this.drawerOpen.set(false);
  }
}
`;
fs.writeFileSync(path.join(root, 'services', 'master-erp.service.ts'), serviceCode, 'utf8');

// 3. КОНТРОЛЛЕР APP COMPONENT
const appTsCode = `import { Component, inject } from '@angular/core';
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

  // Калькуляторы в цехах
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
    return \`\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
  }

  // Расчет рассола для мяса внутри карточки ТТК
  getMeatCardBrine(card: KochCardItem) {
    const waterL = Math.max(1, Math.round((this.erp.kochBatchKg() * (card.brineInjectionPct || 10)) / 100));
    return this.erp.calcMeatBrine(waterL, card.brineBe || 10);
  }

  // Расчет рассола для сыра внутри карточки ТТК
  getCheeseCardBrine(card: DairyCardItem) {
    return this.erp.calcCheeseBrine(10, card.brinePct || 18, card.packGrams / 1000);
  }
}
`;
fs.writeFileSync(path.join(root, 'app.component.ts'), appTs