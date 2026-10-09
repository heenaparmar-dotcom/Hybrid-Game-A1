export interface Token {
  id: number;
  text: string;
  /** Normalised form used for comparison (lower-case, punctuation removed). */
  norm: string;
}

export function normaliseWord(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]/gu, '');
}

export function tokenise(phrase: string): Token[] {
  return phrase
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((text, id) => ({ id, text, norm: normaliseWord(text) }));
}

export function sameOrder(a: Token[], b: Token[]): boolean {
  return a.length === b.length && a.every((t, i) => t.norm === b[i].norm);
}

/** Shuffle tokens; guarantees the result differs from the solved order whenever that is possible. */
export function scramble(tokens: Token[], rng: () => number = Math.random, keepFirst = 0): Token[] {
  const fixed = tokens.slice(0, keepFirst);
  const rest = tokens.slice(keepFirst);
  const distinct = new Set(rest.map((t) => t.norm)).size;
  if (distinct < 2) return [...tokens];
  for (let attempt = 0; attempt < 30; attempt++) {
    const out = [...rest];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (!sameOrder([...fixed, ...out], tokens)) return [...fixed, ...out];
  }
  // Deterministic fallback: rotate until different.
  for (let r = 1; r < rest.length; r++) {
    const rotated = [...rest.slice(r), ...rest.slice(0, r)];
    if (!sameOrder([...fixed, ...rotated], tokens)) return [...fixed, ...rotated];
  }
  return [...tokens];
}

export function countCorrect(order: Token[], solution: Token[]): number {
  return order.reduce((n, t, i) => n + (solution[i] && t.norm === solution[i].norm ? 1 : 0), 0);
}

/** Reveal the next wrong position. Returns null when nothing is left to reveal (no hint is spent). */
export function applyHint(order: Token[], locked: number, solution: Token[]): { order: Token[]; locked: number } | null {
  let p = locked;
  while (p < order.length && order[p].norm === solution[p].norm) p++;
  if (p >= order.length) return null;
  const from = order.findIndex((t, i) => i > p && t.norm === solution[p].norm);
  if (from < 0) return null;
  const next = [...order];
  [next[p], next[from]] = [next[from], next[p]];
  return { order: next, locked: p + 1 };
}

/** Move the tile at `from` so it ends up at `to` (insert semantics), respecting a locked prefix. */
export function moveTile<T>(list: T[], from: number, to: number, locked: number): T[] {
  if (from === to || from < locked || to < locked || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function swapTiles<T>(list: T[], a: number, b: number, locked: number): T[] {
  if (a === b || a < locked || b < locked || a < 0 || b < 0 || a >= list.length || b >= list.length) return list;
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

/** Arrange tokens by a creator-chosen permutation (`order[i]` = index of the token shown at position i). */
export function applyOrder(tokens: Token[], order: number[]): Token[] {
  return order.map((i) => tokens[i]);
}

/** The permutation that turns `solution` into `shuffled` (by token id). */
export function orderOf(solution: Token[], shuffled: Token[]): number[] {
  return shuffled.map((t) => solution.findIndex((s) => s.id === t.id));
}
