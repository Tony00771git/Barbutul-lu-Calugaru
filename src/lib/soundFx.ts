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

  /**
   * Monastic Quest Completed Jingle (Medieval bell arpeggio)
   */
  public playQuestComplete() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 392.00, time: 0, dur: 0.18 },
        { freq: 493.88, time: 0.1, dur: 0.18 },
        { freq: 587.33, time: 0.2, dur: 0.22 },
        { freq: 783.99, time: 0.32, dur: 0.5 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.2, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch (e) {}
  }

  /**
   * Quest Claim Drunken Coins Clinking Shower
   */
  public playQuestClaim() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.08, 0.16, 0.24, 0.32].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1046.5 + idx * 80, now + offset);
        osc.frequency.exponentialRampToValueAtTime(1567.98, now + offset + 0.06);

        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.15);
      });
    } catch (e) {}
  }
  /**
   * Shop Purchase Golden Celebration Clinking Chime
   */
  public playPurchaseSuccess() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Golden coins fanfare + bell
      const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      freqs.forEach((freq, idx) => {
        const offset = idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + offset);

        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.36);
      });
    } catch (e) {}
  }

  /**
   * Item Equip Click
   */
  public playEquip() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  /**
   * UI Click Sound
   */
  public playClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  /**
   * Quick Tavern Emote Sounds
   */
  public playEmote(type: 'cheers' | 'roll_heavy' | 'cry' | 'pour' | 'blessing') {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (type === 'cheers') {
        // Clinking beer mugs + cheerful brass chord
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.05);
          osc.frequency.exponentialRampToValueAtTime(f * 1.05, now + idx * 0.05 + 0.2);
          gain.gain.setValueAtTime(0.18, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.32);
        });
      } else if (type === 'roll_heavy') {
        // Heavy resonant dice impact
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);

        // Crackle click
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'square';
        clickOsc.frequency.setValueAtTime(800, now);
        clickGain.gain.setValueAtTime(0.12, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        clickOsc.connect(clickGain);
        clickGain.connect(ctx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.09);
      } else if (type === 'cry') {
        // Mournful sliding violin / sigh
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(320, now + 0.2);
        osc.frequency.linearRampToValueAtTime(220, now + 0.45);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'pour') {
        // Foaming bubbling ale pour
        for (let i = 0; i < 5; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const delay = i * 0.06;
          osc.frequency.setValueAtTime(350 + i * 80, now + delay);
          osc.frequency.exponentialRampToValueAtTime(600 + i * 40, now + delay + 0.1);
          gain.gain.setValueAtTime(0.1, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.13);
        }
      } else if (type === 'blessing') {
        // Celestial shimmer harmonics
        [659.25, 830.61, 987.77, 1318.51, 1661.22].forEach((f, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          const offset = idx * 0.05;
          osc.frequency.setValueAtTime(f, now + offset);
          gain.gain.setValueAtTime(0.12, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.45);
        });
      }
    } catch (e) {}
  }

  /**
   * CS-Style Case Opening Roulette Tick
   * Fast crisp mechanical click / ticker sound
   */
  public playCaseSpinTick(pitchMult = 1.0) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650 * pitchMult, now);
      osc.frequency.exponentialRampToValueAtTime(180 * pitchMult, now + 0.025);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.028);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {}
  }

  /**
   * Covert / Rare Special passed ticker ping
   */
  public playCaseRarePass() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1174.66, now); // D6
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  /**
   * CS-Style Case Opening Final Reveal Sound Effect
   */
  public playCaseReveal(rarity: 'milspec' | 'restricted' | 'classified' | 'covert' | 'rareSpecial') {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (rarity === 'milspec' || rarity === 'restricted') {
        // Standard pleasant chime
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.15, now + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.45);
        });
      } else if (rarity === 'classified') {
        // Shimmering mystical arpeggio
        [440, 554.37, 659.25, 880, 1108.73].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.07);
          gain.gain.setValueAtTime(0.2, now + i * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.07);
          osc.stop(now + i * 0.07 + 0.65);
        });
      } else if (rarity === 'covert') {
        // Deep resonant bass drop + blazing crimson choir
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(130, now);
        bass.frequency.exponentialRampToValueAtTime(45, now + 0.8);
        bassGain.gain.setValueAtTime(0.3, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        bass.connect(bassGain);
        bassGain.connect(ctx.destination);
        bass.start(now);
        bass.stop(now + 0.9);

        // High fiery notes
        [587.33, 739.99, 880, 1174.66].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + 0.1 + i * 0.08);
          gain.gain.setValueAtTime(0.22, now + 0.1 + i * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1 + i * 0.08 + 0.7);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.1 + i * 0.08);
          osc.stop(now + 0.1 + i * 0.08 + 0.75);
        });
      } else if (rarity === 'rareSpecial') {
        // ★ EPIC GOLDEN KNIFE/SPECIAL FANFARE & HEAVENLY BELLS ★
        const trumpetNotes = [
          { f: 523.25, t: 0, d: 0.15 },
          { f: 659.25, t: 0.14, d: 0.15 },
          { f: 783.99, t: 0.28, d: 0.2 },
          { f: 1046.5, t: 0.45, d: 1.2 },
          { f: 1318.51, t: 0.6, d: 1.3 },
          { f: 1567.98, t: 0.75, d: 1.5 },
        ];

        trumpetNotes.forEach(({ f, t, d }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(f, now + t);
          gain.gain.setValueAtTime(0.001, now + t);
          gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + d + 0.05);
        });

        // Golden sparkles
        for (let i = 0; i < 8; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1200 + i * 220, now + 0.5 + i * 0.06);
          gain.gain.setValueAtTime(0.12, now + 0.5 + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.06 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + 0.5 + i * 0.06);
          osc.stop(now + 0.5 + i * 0.06 + 0.35);
        }
      }
    } catch (e) {}
  }
}

export const soundEffects = new SoundEffects();

