import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EMOJI, MAX_EMOJI } from '../../src/data/emoji';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.(tsx?|css|html)$/.test(name) ? [p] : [];
  });
}

describe('emoji budget', () => {
  it('defines at most 10 distinct emoji, each with a text label', () => {
    expect(EMOJI.length).toBeLessThanOrEqual(MAX_EMOJI);
    expect(new Set(EMOJI.map((e) => e.emoji)).size).toBe(EMOJI.length);
    for (const e of EMOJI) expect(e.label.length).toBeGreaterThan(2);
  });
  it('uses no emoji anywhere in the source other than the defined ones', () => {
    const allowed = new Set(EMOJI.map((e) => e.emoji));
    const found = new Set<string>();
    for (const file of [...sourceFiles('src'), 'index.html']) {
      for (const m of readFileSync(file, 'utf8').matchAll(/\p{Extended_Pictographic}/gu)) found.add(m[0]);
    }
    for (const ch of found) expect(allowed.has(ch), `unexpected emoji ${ch}`).toBe(true);
    expect(found.size).toBeLessThanOrEqual(MAX_EMOJI);
  });
});
