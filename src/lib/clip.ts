import type { ListenChallenge } from '../data/listen';
import { music } from './audio';

export type ClipStatus = 'idle' | 'playing' | 'paused' | 'ended';

/** What the player can be told about the clip: where the sound comes from, and anything that went wrong. */
export interface ClipInfo {
  status: ClipStatus;
  /** 'file' = an authorised recording, 'demo' = the placeholder (generated music plus a computer voice). */
  source: 'file' | 'demo';
  /** The authorised file could not be loaded, so the demo clip is used instead. */
  fileFailed: boolean;
  /** The browser has no usable voice, so the spoken line cannot be heard. */
  voiceMissing: boolean;
  /** The browser blocked sound or has no Web Audio. */
  soundMissing: boolean;
}

const VOICE_WATCHDOG_MS = 3000;

/**
 * Plays one listening clip: an authorised recording when `src` is configured and loads, otherwise original generated music
 * with the line spoken over it. Everything fails softly: the caller is told what is missing and the game carries on.
 */
export class ClipPlayer {
  private info: ClipInfo = { status: 'idle', source: 'demo', fileFailed: false, voiceMissing: false, soundMissing: false };
  private audio: HTMLAudioElement | null = null;
  private tick: number | null = null;
  private watchdog: number | null = null;
  private spoken = false;
  private fallbackClock = { elapsed: 0, last: null as number | null };
  private volume = 0.7;
  private muted = false;

  constructor(
    private challenge: ListenChallenge,
    private onChange: (info: ClipInfo) => void,
  ) {}

  setVolume(volume: number, muted: boolean) {
    this.volume = volume;
    this.muted = muted;
    if (this.audio) this.audio.volume = muted ? 0 : volume;
  }

  private set(patch: Partial<ClipInfo>) {
    this.info = { ...this.info, ...patch };
    this.onChange(this.info);
  }

  /** Must be called from a click or key press. */
  async play() {
    this.stop();
    this.spoken = false;
    this.fallbackClock = { elapsed: 0, last: null };
    this.set({ status: 'idle', fileFailed: false, voiceMissing: false, soundMissing: false });
    if (this.challenge.src) {
      const ok = await this.playFile(this.challenge.src);
      if (ok) return;
      this.set({ fileFailed: true });
    }
    await this.playDemo();
  }

  private playFile(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const a = new Audio(src);
        a.volume = this.muted ? 0 : this.volume;
        this.audio = a;
        a.onended = () => this.set({ status: 'ended' });
        a.onerror = () => resolve(false);
        a.play().then(
          () => {
            this.set({ status: 'playing', source: 'file' });
            resolve(true);
          },
          () => resolve(false),
        );
      } catch {
        resolve(false);
      }
    });
  }

  private async playDemo() {
    const c = this.challenge.placeholder;
    this.set({ source: 'demo' });
    const result = await music.start(c.track);
    const soundMissing = result !== 'playing';
    this.fallbackClock = { elapsed: 0, last: performance.now() };
    this.set({ status: 'playing', soundMissing });
    this.tick = window.setInterval(() => this.step(), 100);
  }

  /** Seconds of clip played so far (frozen while paused). */
  private now(): number {
    const t = music.songTime();
    if (t !== null) return t;
    const fc = this.fallbackClock;
    if (fc.last !== null) {
      const n = performance.now();
      fc.elapsed += n - fc.last;
      fc.last = n;
    }
    return fc.elapsed / 1000;
  }

  private step() {
    if (this.info.status !== 'playing') return;
    const t = this.now();
    const c = this.challenge.placeholder;
    if (!this.spoken && t >= c.voiceAt) {
      this.spoken = true;
      this.speak();
    }
    if (t >= c.seconds && this.spoken) {
      if (this.tick !== null) window.clearInterval(this.tick);
      this.tick = null;
      music.fadeOut(0.6);
      this.set({ status: 'ended' });
    }
  }

  private speak() {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      this.set({ voiceMissing: true });
      return;
    }
    try {
      const u = new SpeechSynthesisUtterance(this.challenge.line);
      u.lang = this.challenge.placeholder.lang;
      u.rate = 0.85;
      u.volume = this.muted ? 0 : this.volume;
      let started = false;
      u.onstart = () => {
        started = true;
        if (this.watchdog !== null) window.clearTimeout(this.watchdog);
      };
      u.onerror = () => {
        if (!started) this.set({ voiceMissing: true });
      };
      // some browsers have no installed voice and never start: do not leave the player waiting
      this.watchdog = window.setTimeout(() => {
        if (!started) {
          synth.cancel();
          this.set({ voiceMissing: true });
        }
      }, VOICE_WATCHDOG_MS);
      synth.speak(u);
    } catch {
      this.set({ voiceMissing: true });
    }
  }

  async pause() {
    if (this.info.status !== 'playing') return;
    this.set({ status: 'paused' });
    if (this.audio) {
      this.audio.pause();
      return;
    }
    // silence the voice straight away, then freeze the music clock
    try {
      window.speechSynthesis?.pause();
    } catch {
      /* no voice engine */
    }
    this.fallbackClock.last = null;
    await music.pause();
  }

  async resume() {
    if (this.info.status !== 'paused') return;
    this.set({ status: 'playing' });
    if (this.audio) {
      void this.audio.play().catch(() => this.set({ status: 'ended' }));
      return;
    }
    try {
      window.speechSynthesis?.resume();
    } catch {
      /* no voice engine */
    }
    this.fallbackClock.last = performance.now();
    await music.resume();
  }

  /** Stop everything and silence the voice. Safe to call at any time, including after unmount. */
  stop() {
    if (this.tick !== null) window.clearInterval(this.tick);
    if (this.watchdog !== null) window.clearTimeout(this.watchdog);
    this.tick = null;
    this.watchdog = null;
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
    music.stop();
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* no voice engine */
    }
    if (this.info.status !== 'idle') this.info = { ...this.info, status: 'idle' };
  }
}
