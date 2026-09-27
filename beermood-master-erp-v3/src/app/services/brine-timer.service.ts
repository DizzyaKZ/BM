import { Injectable, signal } from '@angular/core';
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
