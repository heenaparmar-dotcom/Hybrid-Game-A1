import type { TrackId } from '../data/tracks';

export type MusicStatus = 'idle' | 'playing' | 'paused' | 'blocked' | 'unavailable';

type Step = number | null;

interface Voice {
  wave: OscillatorType;
  vol: number;
  /** Note length in 16th-note steps. */
  len: number;
  lowpass?: number;
  vibrato?: boolean;
}

interface Synth {
  bpm: number;
  root: number; // Hz
  scale: number[]; // semitones of one octave
  chords: number[]; // bass root (semitones) for each of 4 bars
  kick: number[];
  snare: number[];
  hat: number[];
  dha?: number[];
  tak?: number[];
  tin?: number[];
  clave?: number[];
  bass: Step[]; // 16 steps, semitones above the chord root
  bassWave: OscillatorType;
  bassVol: number;
  leadA: Step[]; // 32 steps (2 bars) of scale-degree indexes; used for bars 1-2
  leadB: Step[]; // bars 3-4
  lead: Voice;
}

/**
 * Three ORIGINAL tracks written for this project. They are simple synthesised grooves (not recordings or covers).
 * "nacho" borrows the general feel of dhol-driven dance music and a Hijaz-style scale; "hookstep" a Latin-pop dembow feel.
 */
const SYNTHS: Record<TrackId, Synth> = {
  sunrise: {
    bpm: 112, root: 220, scale: [0, 2, 4, 7, 9], chords: [0, 7, -3, -7],
    kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1],
    bass: [0,null,null,0, null,null,7,null, 0,null,null,0, null,12,null,7], bassWave: 'sine', bassVol: 0.34,
    leadA: [5,null,7,null, 8,null,7,null, 5,null,null,null, 4,null,null,null, 5,null,4,null, 2,null,4,null, 5,null,null,7, null,null,5,null],
    leadB: [8,null,9,null, 8,null,7,null, 5,null,7,null, 8,null,null,null, 7,null,5,null, 4,null,2,null, 4,null,null,5, null,null,null,null],
    lead: { wave: 'triangle', vol: 0.13, len: 1.7 },
  },
  nacho: {
    bpm: 96, root: 146.83, scale: [0, 1, 4, 5, 7, 8, 10], chords: [0, 0, 1, 0],
    kick: [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    dha: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
    tak: [0,0,1,0, 1,0,0,1, 0,0,1,0, 1,0,0,1],
    tin: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],
    bass: [0,null,0,null, null,0,null,null, 0,null,0,null, 7,null,null,0], bassWave: 'triangle', bassVol: 0.4,
    leadA: [7,null,8,null, 9,null,null,8, 7,null,null,null, null,null,null,null, 9,null,10,null, 11,null,null,10, 9,null,8,null, 7,null,null,null],
    leadB: [11,null,12,null, 11,null,10,null, 9,null,null,null, 10,null,null,null, 9,null,8,null, 7,null,null,8, 7,null,null,null, null,null,null,null],
    lead: { wave: 'sawtooth', vol: 0.085, len: 2.3, lowpass: 1700, vibrato: true },
  },
  hookstep: {
    bpm: 128, root: 196, scale: [0, 2, 3, 5, 7, 8, 10], chords: [0, -4, 3, -2],
    kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare: [0,0,0,1, 0,0,1,0, 0,0,0,1, 0,0,1,0],
    hat: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1],
    clave: [1,0,0,1, 0,0,1,0, 0,0,1,0, 1,0,0,0],
    bass: [0,null,null,0, null,null,0,null, null,0,null,null, 7,null,0,null], bassWave: 'square', bassVol: 0.17,
    leadA: [7,null,9,null, 10,null,9,7, null,null,7,null, null,null,null,null, 9,null,null,10, null,11,null,10, 9,null,7,null, null,null,null,null],
    leadB: [11,null,12,null, 11,null,10,null, 9,null,10,null, 11,null,null,null, 10,null,9,null, 7,null,9,null, 7,null,null,null, null,null,null,null],
    lead: { wave: 'square', vol: 0.07, len: 1.0, lowpass: 2300 },
  },
};

type Listener = () => void;

/** Step-sequencer on the Web Audio API. No audio files, no network. */
class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private startAt: number | null = null;
  private synth: Synth = SYNTHS.sunrise;
  private volume = 0.7;
  private muted = false;
  private status: MusicStatus = 'idle';
  private pending: Promise<MusicStatus> = Promise.resolve('idle');
  private listeners = new Set<Listener>();

  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  getStatus = (): MusicStatus => this.status;
  /** Resolves with the result of the most recent start() call. */
  ready = (): Promise<MusicStatus> => this.pending;

  private setStatus(s: MusicStatus) {
    if (this.status === s) return;
    this.status = s;
    this.listeners.forEach((l) => l());
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);
  }

  private applyGain() {
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume * 0.55, this.ctx.currentTime, 0.02);
  }
  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    this.applyGain();
  }
  setMuted(m: boolean) {
    this.muted = m;
    this.applyGain();
  }

  /** Seconds of music played since the first beat, or null when nothing is playing. Frozen while paused. */
  songTime(): number | null {
    if (!this.ctx || this.startAt === null || (this.status !== 'playing' && this.status !== 'paused')) return null;
    const c = this.ctx as AudioContext & { outputLatency?: number };
    const latency = c.outputLatency || c.baseLatency || 0;
    return Math.max(0, c.currentTime - this.startAt - latency);
  }

  /** Must be called from a user gesture (click, tap or key press). */
  start(trackId: TrackId): Promise<MusicStatus> {
    this.pending = this.begin(trackId);
    return this.pending;
  }

  private async begin(trackId: TrackId): Promise<MusicStatus> {
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
      const comp = this.ctx.createDynamicsCompressor();
      comp.connect(this.ctx.destination);
      this.master = this.ctx.createGain();
      this.master.connect(comp);
      this.applyGain();
      this.synth = SYNTHS[trackId];
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.1;
      this.startAt = this.nextTime;
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
    const stepLen = 60 / this.synth.bpm / 4;
    while (this.nextTime < this.ctx.currentTime + 0.12) {
      this.playStep(this.step, this.nextTime, stepLen);
      this.nextTime += stepLen;
      this.step++;
    }
  }

  private freq(index: number): number {
    const s = this.synth;
    const n = s.scale.length;
    const octave = Math.floor(index / n);
    const degree = ((index % n) + n) % n;
    return s.root * 2 ** ((s.scale[degree] + 12 * octave) / 12);
  }

  private playStep(stepNo: number, t: number, len: number) {
    const s = this.synth;
    const i = stepNo % 16;
    const bar = Math.floor(stepNo / 16) % 4;
    if (s.kick[i]) this.kick(t);
    if (s.snare[i]) this.noiseHit(t, 0.12, 'highpass', 1800, 0.32);
    if (s.hat[i]) this.noiseHit(t, 0.035, 'highpass', 7500, s.dha ? 0.07 : 0.14);
    if (s.dha?.[i]) this.dha(t);
    if (s.tak?.[i]) this.noiseHit(t, 0.06, 'bandpass', 2800, 0.3, 2);
    if (s.tin?.[i]) this.tone(560, t, 0.22, 'sine', 0.16);
    if (s.clave?.[i]) this.tone(1500, t, 0.05, 'sine', 0.13);
    const b = s.bass[i];
    if (b !== null && b !== undefined) this.tone((s.root / 2) * 2 ** ((s.chords[bar] + b) / 12), t, len * 1.8, s.bassWave, s.bassVol);
    const seq = bar < 2 ? s.leadA : s.leadB;
    const l = seq[(bar % 2) * 16 + i];
    if (l !== null && l !== undefined) this.tone(this.freq(l), t, len * s.lead.len, s.lead.wave, s.lead.vol, s.lead);
  }

  private tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, voice?: Voice) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out: AudioNode = osc;
    if (voice?.lowpass) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = voice.lowpass;
      out.connect(f);
      out = f;
    }
    out.connect(g).connect(this.master);
    if (voice?.vibrato) {
      const lfo = this.ctx.createOscillator();
      const lg = this.ctx.createGain();
      lfo.frequency.value = 5.5;
      lg.gain.value = freq * 0.006;
      lfo.connect(lg).connect(osc.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.03);
    }
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  private kick(t: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.85, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  /** Deep drum thump used for the dhol-style pattern. */
  private dha(t: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(62, t + 0.16);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  private noiseHit(t: number, dur: number, filter: BiquadFilterType, freq: number, vol: number, q = 0.7) {
    if (!this.ctx || !this.master || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.value = freq;
    f.Q.value = q;
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

  /** Gentle ending, then a clean stop. */
  fadeOut(seconds = 0.8) {
    if (this.master && this.ctx && this.status === 'playing') {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setValueAtTime(this.master.gain.value, this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + seconds);
      const fading = this.master;
      // Only stop if a new track has not been started in the meantime.
      window.setTimeout(() => {
        if (this.master === fading) this.stop();
      }, seconds * 1000 + 60);
    } else {
      this.stop();
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
    this.startAt = null;
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
    if (this.status === 'playing' || this.status === 'paused') this.setStatus('idle');
  }
}

export const music = new MusicEngine();
