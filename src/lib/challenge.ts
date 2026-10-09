import { trackByCode, type TrackId } from '../data/tracks';

export const PHRASE_LIMITS = { minWords: 3, maxWords: 8, maxWordLength: 16, maxChars: 60, maxNickname: 16 } as const;

export interface ChallengeData {
  phrase: string;
  from?: string;
  /** Which song and dance goes with the puzzle. Links made before this existed omit it. */
  track?: TrackId;
  /** The shuffle the creator reviewed: `order[i]` is the word index shown at position i. */
  order?: number[];
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

// Letters (any script), combining marks, numbers, spaces and a few gentle punctuation marks only.
const ALLOWED = /^[\p{L}\p{M}\p{N} ,.'!?-]+$/u;
// A deliberately small, basic filter. It is NOT a replacement for human judgement.
const BLOCKED = ['hate', 'kill', 'die', 'stupid', 'idiot', 'dumb', 'ugly', 'fat', 'shut', 'loser', 'damn', 'hell', 'crap'];

const stripWord = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, '');

export function validatePhrase(raw: string): ValidationResult<string> {
  const phrase = raw.replace(/\s+/g, ' ').trim();
  if (!phrase) return { ok: false, error: 'Type a short line to begin.' };
  if (phrase.length > PHRASE_LIMITS.maxChars) return { ok: false, error: `Keep it to ${PHRASE_LIMITS.maxChars} characters or fewer.` };
  if (!ALLOWED.test(phrase)) return { ok: false, error: "Use letters, numbers and simple punctuation (, . ' ! ? -) only." };
  const words = phrase.split(' ');
  if (words.length < PHRASE_LIMITS.minWords) return { ok: false, error: `Use at least ${PHRASE_LIMITS.minWords} words so there is something to unscramble.` };
  if (words.length > PHRASE_LIMITS.maxWords) return { ok: false, error: `Use ${PHRASE_LIMITS.maxWords} words or fewer.` };
  if (words.some((w) => w.length > PHRASE_LIMITS.maxWordLength)) return { ok: false, error: `Each word can be at most ${PHRASE_LIMITS.maxWordLength} characters long.` };
  const lowered = words.map(stripWord);
  if (lowered.some((w) => BLOCKED.includes(w))) return { ok: false, error: 'Please keep it kind and friendly. Try different words.' };
  if (new Set(lowered).size < 2) return { ok: false, error: 'Use at least two different words.' };
  return { ok: true, value: phrase };
}

export function validateNickname(raw: string): ValidationResult<string> {
  const name = raw.replace(/\s+/g, ' ').trim();
  if (!name) return { ok: true, value: '' };
  if (name.length > PHRASE_LIMITS.maxNickname) return { ok: false, error: `Nickname: ${PHRASE_LIMITS.maxNickname} characters or fewer.` };
  if (!/^[\p{L}\p{M}\p{N} _-]+$/u.test(name)) return { ok: false, error: 'Nickname: letters, numbers, spaces, - and _ only.' };
  if (name.split(' ').some((w) => BLOCKED.includes(stripWord(w)))) return { ok: false, error: 'Please choose a friendly nickname.' };
  return { ok: true, value: name };
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const isIdentity = (o: number[]) => o.every((v, i) => v === i);

function validOrder(o: unknown, length: number): o is number[] {
  return Array.isArray(o) && o.length === length && o.every((v) => Number.isInteger(v) && v >= 0 && v < length) && new Set(o).size === length;
}

/** Self-contained payload: version, phrase and optional nickname, song and shuffle. Nothing else. */
export function encodeChallenge(data: ChallengeData): string {
  const payload: { v: 1; p: string; f?: string; t?: number; o?: number[] } = { v: 1, p: data.phrase };
  if (data.from) payload.f = data.from;
  if (data.track) payload.t = trackCode(data.track);
  const wordCount = data.phrase.split(' ').length;
  if (data.order && validOrder(data.order, wordCount) && !isIdentity(data.order)) payload.o = data.order;
  return toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

function trackCode(id: TrackId): number {
  return id === 'sunrise' ? 1 : id === 'nacho' ? 2 : 3;
}

export function decodeChallenge(encoded: string): ValidationResult<ChallengeData> {
  const bad = { ok: false, error: 'This challenge link is damaged or is not a RHYTHM RUSH challenge.' } as const;
  if (!encoded || encoded.length > 700 || !/^[A-Za-z0-9_-]+$/.test(encoded)) return bad;
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(fromBase64Url(encoded)));
  } catch {
    return bad;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return bad;
  const obj = parsed as Record<string, unknown>;
  if (obj.v !== 1 || typeof obj.p !== 'string') return bad;
  const phrase = validatePhrase(obj.p);
  if (!phrase.ok) return { ok: false, error: `This challenge cannot be opened: ${phrase.error}` };

  let from = '';
  if (obj.f !== undefined) {
    if (typeof obj.f !== 'string') return bad;
    const nick = validateNickname(obj.f);
    if (!nick.ok) return { ok: false, error: `This challenge cannot be opened: ${nick.error}` };
    from = nick.value;
  }

  let track: TrackId | undefined;
  if (obj.t !== undefined) {
    const found = typeof obj.t === 'number' ? trackByCode(obj.t) : undefined;
    if (!found) return bad;
    track = found.id;
  }

  let order: number[] | undefined;
  if (obj.o !== undefined) {
    if (!validOrder(obj.o, phrase.value.split(' ').length)) return bad;
    order = isIdentity(obj.o) ? undefined : obj.o;
  }
  return { ok: true, value: { phrase: phrase.value, from: from || undefined, track, order } };
}

export const CHALLENGE_PARAM = 'challenge';

export function buildChallengeUrl(data: ChallengeData, base: string = window.location.href.split('#')[0]): string {
  return `${base}#${CHALLENGE_PARAM}=${encodeChallenge(data)}`;
}

/** Accepts a full URL, a hash fragment, or the bare encoded payload. */
export function parseChallengeInput(input: string): ValidationResult<ChallengeData> {
  const text = input.trim();
  const match = text.match(new RegExp(`${CHALLENGE_PARAM}=([A-Za-z0-9_-]+)`));
  return decodeChallenge(match ? match[1] : text);
}
