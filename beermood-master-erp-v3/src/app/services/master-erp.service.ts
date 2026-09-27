import { Injectable, signal, computed } from '@angular/core';
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
