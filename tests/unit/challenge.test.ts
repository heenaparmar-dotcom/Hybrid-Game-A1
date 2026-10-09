import { describe, expect, it } from 'vitest';
import { buildChallengeUrl, decodeChallenge, encodeChallenge, parseChallengeInput, validateNickname, validatePhrase } from '../../src/lib/challenge';
import { challengeMessage, shareTargets } from '../../src/lib/share';

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');

describe('phrase validation', () => {
  it('accepts a normal phrase and tidies whitespace', () => {
    expect(validatePhrase('  Jump   into the sunshine ')).toEqual({ ok: true, value: 'Jump into the sunshine' });
  });
  it.each([
    ['', 'empty'],
    ['   ', 'blank'],
    ['two words', 'too few words'],
    ['a b c d e f g h i', 'too many words'],
    ['x'.repeat(70), 'too long'],
    ['hello <script> world', 'illegal characters'],
    ['aaaaaaaaaaaaaaaaaaaaaaaa bbb ccc', 'word too long'],
    ['la la la', 'only one distinct word'],
    ['you are so stupid today', 'unkind word'],
  ])('rejects %j (%s)', (input) => {
    expect(validatePhrase(input).ok).toBe(false);
  });
  it('supports Hindi in Roman and Devanagari script', () => {
    expect(validatePhrase('Aaj dil khol ke nacho').ok).toBe(true);
    expect(validatePhrase('आज दिल खोल के नाचो').ok).toBe(true);
  });
});

describe('nickname validation', () => {
  it('allows empty, rejects odd or long names', () => {
    expect(validateNickname('')).toEqual({ ok: true, value: '' });
    expect(validateNickname('Sam_1').ok).toBe(true);
    expect(validateNickname('<b>').ok).toBe(false);
    expect(validateNickname('x'.repeat(30)).ok).toBe(false);
  });
});

describe('challenge links', () => {
  it('round-trips phrase, nickname, song and the reviewed shuffle', () => {
    const data = { phrase: 'Move with the morning light', from: 'Sam', track: 'nacho' as const, order: [3, 1, 4, 0, 2] };
    const enc = encodeChallenge(data);
    expect(enc).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeChallenge(enc)).toEqual({ ok: true, value: data });
  });
  it('round-trips Devanagari', () => {
    const enc = encodeChallenge({ phrase: 'आज दिल खोल के नाचो' });
    expect(decodeChallenge(enc)).toEqual({ ok: true, value: { phrase: 'आज दिल खोल के नाचो', from: undefined, track: undefined, order: undefined } });
  });
  it('still opens links made before songs and shuffles existed', () => {
    const old = b64({ v: 1, p: 'Move with the morning light' });
    expect(decodeChallenge(old)).toEqual({ ok: true, value: { phrase: 'Move with the morning light', from: undefined, track: undefined, order: undefined } });
  });
  it('contains nothing but the allowed fields', () => {
    const json = JSON.parse(Buffer.from(encodeChallenge({ phrase: 'Feel the rhythm now', from: 'Ana', track: 'hookstep', order: [1, 0, 2, 3] }), 'base64url').toString());
    expect(Object.keys(json).sort()).toEqual(['f', 'o', 'p', 't', 'v']);
  });
  it('drops an identity order (nothing to preserve)', () => {
    const json = JSON.parse(Buffer.from(encodeChallenge({ phrase: 'Feel the rhythm now', order: [0, 1, 2, 3] }), 'base64url').toString());
    expect(json.o).toBeUndefined();
  });
  it('builds a URL that parses back from a full link, a fragment or bare data', () => {
    const url = buildChallengeUrl({ phrase: 'Catch the colours of the beat', track: 'sunrise' }, 'https://example.org/game/');
    expect(url.startsWith('https://example.org/game/#challenge=')).toBe(true);
    for (const input of [url, url.split('#')[1], url.split('=')[1], `  ${url}  `]) {
      const r = parseChallengeInput(input);
      expect(r.ok && r.value.phrase).toBe('Catch the colours of the beat');
      expect(r.ok && r.value.track).toBe('sunrise');
    }
  });
  it('rejects malformed, tampered and hostile payloads safely', () => {
    const phrase = 'Move with the morning light';
    const bad = [
      '',
      '!!!not base64!!!',
      'abc',
      'x'.repeat(2000),
      b64({ v: 2, p: phrase }),
      b64({ v: 1 }),
      b64({ v: 1, p: 42 }),
      b64({ v: 1, p: '<img src=x onerror=alert(1)> ok now' }),
      b64({ v: 1, p: phrase, f: { a: 1 } }),
      b64({ v: 1, p: phrase, f: '<b>hi</b>' }),
      b64({ v: 1, p: phrase, t: 9 }),
      b64({ v: 1, p: phrase, t: 'nacho' }),
      b64({ v: 1, p: phrase, o: [0, 1, 2] }),
      b64({ v: 1, p: phrase, o: [0, 0, 1, 2, 3] }),
      b64({ v: 1, p: phrase, o: [0, 1, 2, 3, 9] }),
      b64({ v: 1, p: phrase, o: 'abcde' }),
      b64(['array']),
      b64(null),
      '_____',
    ];
    for (const input of bad) expect(decodeChallenge(input).ok, `input ${input.slice(0, 30)}`).toBe(false);
    expect(parseChallengeInput('https://x.y/#challenge=@@@').ok).toBe(false);
  });
});

describe('share links', () => {
  const url = 'https://example.org/game/#challenge=abc123';
  it('builds honest WhatsApp, Telegram and email links that carry the challenge URL', () => {
    const targets = shareTargets(url, 'Maya');
    expect(targets.map((t) => t.id)).toEqual(['whatsapp', 'telegram', 'email']);
    const wa = targets.find((t) => t.id === 'whatsapp')!;
    expect(wa.href.startsWith('https://wa.me/?text=')).toBe(true);
    expect(decodeURIComponent(wa.href.split('text=')[1])).toBe(challengeMessage(url, 'Maya'));
    const tg = targets.find((t) => t.id === 'telegram')!;
    expect(tg.href.startsWith('https://t.me/share/url?url=')).toBe(true);
    expect(tg.href).toContain(encodeURIComponent(url));
    expect(targets.find((t) => t.id === 'email')!.href.startsWith('mailto:?subject=')).toBe(true);
  });
  it('the message never claims it was sent', () => {
    expect(challengeMessage(url)).not.toMatch(/\bsent\b/i);
    expect(challengeMessage(url, 'Maya').startsWith('Maya made')).toBe(true);
  });
});
