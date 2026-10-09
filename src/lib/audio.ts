import type { ThemeId } from '../data/phrases';

export type MusicStatus = 'idle' | 'playing' | 'paused' | 'blocked' | 'unavailable';

interface Pattern {
  bpm: number;
  root: number; // Hz
  kick: number[];
  snare: number[];
  hat: number[];
  bass: (number | null)[];
  lead: (number | null)[];
  leadWave: OscillatorType;
  bassWave: OscillatorType;
}

// All patterns are 16 steps (one bar of 16th notes). Notes are semitone offsets from `root`.
const PATTERNS: Record<ThemeId, Pattern> = {
  fresh: {
    bpm: 112, root: 220,
    kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1],
    bass: [0,null,null,0, null,null,3,null, 5,null,null,5, null,null,3,null],
    lead: [12,null,15,null, 19,null,15,null, 17,null,15,null, 12,null,null,null],
    leadWave: 'triangle', bassWave: 'sine',
  },
  retro: {
    bpm: 96, root: 196,
    kick: [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,1,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
    hat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    bass: [0,null,0,null, 7,null,5,null, 3,null,3,null, 5,null,7,null],
    lead: [null,12,null,null, 16,null,19,null, null,16,null,null, 14,null,12,null],
    leadWave: 'square', bassWave: 'triangle',
  },
  hook: {
    bpm: 124, root: 146.83,
    kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,1],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0],
    hat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
    bass: [null,0,null,0, null,5,null,5, null,7,null,7, null,5,null,3],
    lead: [19,null,null,19, null,17,null,15, 12,null,null,15, 17,null,19,null],
    leadWave: 'sawtooth', bassWave: 'square',
  },
};

type Listener = () => void;

/** Small original step-sequencer built on the Web Audio API. No audio files are used. */
class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private pattern: Pattern = PATTERNS.fresh;
  private volume = 0.7;
  private muted = false;
  private status: MusicStatus = 'idle';
  private listeners = new Set<Listener>();

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  getStatus = (): MusicStatus => this.status;

  private setStatus(s: MusicStatus) {
    if (this.status === s) return;
    this.status = s;
    this.listeners.forEach((l) => l());
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
  }

  private applyGain() {
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume * 0.5, this.ctx.currentTime, 0.02);
  }
  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    this.applyGain();
  }
  setMuted(m: boolean) {
    this.muted = m;
    this.applyGain();
  }

  /** Must be called from a user gesture (click/tap/key). */
  async start(themeId: ThemeId): Promise<MusicStatus> {
    this.stop();
    if (!this.isSupported()) {
      this.setStatus('unavailable');
      return 'unavailable';
    }
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new Ctor();
        const len = this.ctx.sampleRate;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      await this.ctx.resume();
      if (this.ctx.state !== 'running') {
        this.setStatus('blocked');
        return 'blocked';
      }
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.applyGain();
      this.pattern = PATTERNS[themeId];
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.08;
      this.timer = window.setInterval(() => this.schedule(), 25);
      this.setStatus('playing');
      return 'playing';
    } catch {
      this.setStatus('unavailable');
      return 'unavailable';
    }
  }

  private schedule() {
    if (!this.ctx || !this.master) return;
    const stepLen = 60 / this.pattern.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this.playStep(this.step % 16, this.nextTime, stepLen);
      this.nextTime += stepLen;
      this.step++;
    }
  }

  private playStep(i: number, t: number, len: number) {
    const p = this.pattern;
    if (p.kick[i]) this.kick(t);
    if (p.snare[i]) this.noiseHit(t, 0.12, 1800, 0.35);
    if (p.hat[i]) this.noiseHit(t, 0.04, 7000, 0.15);
    const b = p.bass[i];
    if (b !== null && b !== undefined) this.tone(p.root * 0.5 * 2 ** (b / 12), t, len * 1.8, p.bassWave, 0.32);
    const l = p.lead[i];
    if (l !== null && l !== undefined) this.tone(p.root * 2 ** (l / 12), t, len * 1.6, p.leadWave, 0.12);
  }

  private tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private kick(t: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  private noiseHit(t: number, dur: number, hp: number, vol: number) {
    if (!this.ctx || !this.master || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = hp;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  async pause() {
    if (this.status !== 'playing' || !this.ctx) return;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    await this.ctx.suspend();
    this.setStatus('paused');
  }

  async resume() {
    if (this.status !== 'paused' || !this.ctx) return;
    try {
      await this.ctx.resume();
      this.timer = window.setInterval(() => this.schedule(), 25);
      this.setStatus('playing');
    } catch {
      this.setStatus('blocked');
    }
  }

  /** Stops cleanly: no scheduled note can sound after this returns. */
  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    if (this.master) {
      try {
        this.master.disconnect();
      } catch {
        /* already disconnected */
      }
      this.master = null;
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
    if (this.status === 'playing' || this.status === 'paused') this.setStatus('idle');
  }
}

export const music = new MusicEngine();
