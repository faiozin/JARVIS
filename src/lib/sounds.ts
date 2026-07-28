// Audio cues use short oscillator bursts on the AudioContext graph.
// They do NOT touch SpeechSynthesis and therefore never interrupt TTS.

type SoundName =
  | 'startup'
  | 'wake'
  | 'listening'
  | 'speaking'
  | 'notification'
  | 'error'
  | 'success';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 1;

  /**
   * Lazily creates the AudioContext. Browsers require the context to be
   * created or resumed inside a user gesture; we resume on every play call
   * to handle Safari's strict autoplay policy.
   */
  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx || this.ctx.state === 'closed') {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      try {
        this.ctx = new Ctor();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /** Unlocks the audio context — call from a user gesture on app start. */
  unlock(): void {
    this.ensureContext();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(Math.max(volume, 0), 1);
  }

  /**
   * Plays a short tone-based cue. These use short oscillator bursts that
   * run on the AudioContext graph — they do NOT touch SpeechSynthesis and
   * therefore never interrupt or block TTS.
   */
  play(name: SoundName): void {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    switch (name) {
      case 'startup': this.playStartup(ctx); break;
      case 'wake': this.playWake(ctx); break;
      case 'listening': this.playTone(ctx, 660, 0.12, 'sine', 0.08); break;
      case 'speaking': this.playTone(ctx, 520, 0.08, 'triangle', 0.05); break;
      case 'notification': this.playChime(ctx, [880, 1100], 0.18); break;
      case 'error': this.playChime(ctx, [220, 180], 0.22, 'sawtooth'); break;
      case 'success': this.playChime(ctx, [660, 880, 1100], 0.16); break;
    }
  }

  private playTone(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainVal = 0.1
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(gainVal * this.volume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  private playChime(
    ctx: AudioContext,
    freqs: number[],
    step: number,
    type: OscillatorType = 'sine'
  ): void {
    freqs.forEach((f, i) => {
      setTimeout(() => {
        if (ctx.state !== 'closed') this.playTone(ctx, f, step, type, 0.09);
      }, i * (step * 1000 * 0.6));
    });
  }

  private playStartup(ctx: AudioContext): void {
    const notes = [392, 523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => {
        if (ctx.state !== 'closed') this.playTone(ctx, f, 0.18, 'sine', 0.08);
      }, i * 90);
    });
  }

  private playWake(ctx: AudioContext): void {
    this.playTone(ctx, 880, 0.1, 'sine', 0.1);
    setTimeout(() => {
      if (ctx.state !== 'closed') this.playTone(ctx, 1320, 0.15, 'sine', 0.08);
    }, 100);
  }
}

export const sounds = new SoundEngine();
