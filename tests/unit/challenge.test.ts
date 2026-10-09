import { describe, expect, it } from 'vitest';
import { buildChallengeUrl, decodeChallenge, encodeChallenge, parseChallengeInput, validateNickname, validatePhrase } from '../../src/lib/challenge';

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
    ['aaaaaaaaaaaaaaaaaaaa bbb ccc', 'word too long'],
    ['la la la', 'only one distinct word'],
    ['you are so stupid today', 'unkind word'],
  ])('rejects %j (%s)', (input) => {
    expect(validatePhrase(input).ok).toBe(false);
  });
  it('supports non-English letters', () => {
    expect(validatePhrase('Danza bajo las estrellas').ok).toBe(true);
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
  it('round-trips a phrase and nickname, including unicode', () => {
    for (const phrase of ['Move with the morning light', 'Danza bajo las estrellas', "Don't stop the beat!"]) {
      const enc = encodeChallenge({ phrase, from: 'Sam' });
      expect(enc).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(decodeChallenge(enc)).toEqual({ ok: true, value: { phrase, from: 'Sam' } });
    }
  });
  it('contains nothing but the phrase and nickname', () => {
    const json = JSON.parse(atob(encodeChallenge({ phrase: 'Feel the rhythm now' }).replace(/-/g, '+').replace(/_/g, '/')));
    expect(Object.keys(json).sort()).toEqual(['p', 'v']);
  });
  it('builds a URL that parses back from a full link, a fragment or bare data', () => {
    const url = buildChallengeUrl({ phrase: 'Catch the colours of the beat' }, 'https://example.org/game/');
    expect(url.startsWith('https://example.org/game/#challenge=')).toBe(true);
    for (const input of [url, url.split('#')[1], url.split('=')[1], `  ${url}  `]) {
      expect(parseChallengeInput(input)).toEqual({ ok: true, value: { phrase: 'Catch the colours of the beat', from: undefined } });
    }
  });
  it('rejects malformed, tampered and hostile payloads safely', () => {
    const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const bad = [
      '',
      '!!!not base64!!!',
      'abc',
      'x'.repeat(2000),
      b64({ v: 2, p: 'Move with the morning light' }),
      b64({ v: 1 }),
      b64({ v: 1, p: 42 }),
      b64({ v: 1, p: '<img src=x onerror=alert(1)> ok now' }),
      b64({ v: 1, p: 'Move with the morning light', f: { a: 1 } }),
      b64({ v: 1, p: 'Move with the morning light', f: '<b>hi</b>' }),
      b64(['array']),
      b64(null),
      '_____',
    ];
    for (const input of bad) {
      const res = decodeChallenge(input);
      expect(res.ok, `input ${input.slice(0, 30)}`).toBe(false);
    }
    expect(parseChallengeInput('https://x.y/#challenge=@@@').ok).toBe(false);
  });
});
