/**
 * Monastic Tavern Audio Synthesizer (Web Audio API)
 * High-performance, zero external assets, safe on mobile and browsers.
 */

class SoundEffects {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Triumphant Monastic Level-Up Fanfare
   */
  public playLevelUpFanfare() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Chords: C4 -> E4 -> G4 -> C5 (Victory Chime)
      const notes = [
        { freq: 261.63, time: 0, dur: 0.15 },
        { freq: 329.63, time: 0.12, dur: 0.15 },
        { freq: 392.00, time: 0.24, dur: 0.2 },
        { freq: 523.25, time: 0.38, dur: 0.6 },
        { freq: 659.25, time: 0.52, dur: 0.7 },
        { freq: 783.99, time: 0.66, dur: 0.9 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.18, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch (e) {
      console.warn('Audio play error', e);
    }
  }

  /**
   * Title Unlock Royal Fanfare (Deeper brass / monastic bell timbre)
   */
  public playTitleUnlock() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 220.00, time: 0, dur: 0.25 }, // A3
        { freq: 277.18, time: 0.18, dur: 0.25 }, // C#4
        { freq: 329.63, time: 0.36, dur: 0.3 }, // E4
        { freq: 440.00, time: 0.54, dur: 0.45 }, // A4
        { freq: 554.37, time: 0.72, dur: 0.5 }, // C#5
        { freq: 659.25, time: 0.90, dur: 1.0 }, // E5
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.22, now + time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch (e) {}
  }

  /**
   * Golden Coin Clink
   */
  public playCoinClink() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  /**
   * Beer Mug Cheers Clink
   */
  public playCheersClink() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Glass/ceramic high clink + resonant ring
      [1480, 1850, 2200].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + (i * 0.02));

        gain.gain.setValueAtTime(0.15, now + (i * 0.02));
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35 + (i * 0.05));

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + (i * 0.02));
        osc.stop(now + 0.45);
      });
    } catch (e) {}
  }
  /**
   * Dragon Crash Explosion and Roar
   */
  public playDragonCrash() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Low rumble / explosion noise using filtered saw
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.6);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);

      // Fiery blast hiss
      const flameOsc = ctx.createOscillator();
      const flameGain = ctx.createGain();
      flameOsc.type = 'triangle';
      flameOsc.frequency.setValueAtTime(260, now);
      flameOsc.frequency.exponentialRampToValueAtTime(50, now + 0.5);

      flameGain.gain.setValueAtTime(0.2, now);
      flameGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

      flameOsc.connect(flameGain);
      flameGain.connect(ctx.destination);
      flameOsc.start(now);
      flameOsc.stop(now + 0.6);
    } catch (e) {}
  }

  /**
   * Cashout Victory Chime
   */
  public playCashOut() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, time: 0, dur: 0.12 }, // C5
        { freq: 659.25, time: 0.08, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.16, dur: 0.25 }, // G5
        { freq: 1046.50, time: 0.24, dur: 0.4 }, // C6
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.18, now + time);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } catch (e) {}
  }

  /**
   * Dragon Takeoff Swoosh
   */
  public playDragonTakeoff() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.35);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch (e) {}
  }

  /**
   * Chicken Cluck Easter Egg Sound
   */
  public playChickenCluck() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.12, 0.24, 0.40].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(idx === 3 ? 340 : 480 + idx * 30, now + offset);
        osc.frequency.exponentialRampToValueAtTime(280, now + offset + 0.09);

        gain.gain.setValueAtTime(0.18, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch (e) {}
  }
}

export const soundEffects = new SoundEffects();
