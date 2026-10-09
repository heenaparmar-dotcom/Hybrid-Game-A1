/** How long the player has to solve a Warm Up / Find the Beat puzzle. */
export const PUZZLE_SECONDS = 10;
/** Every dance challenge lasts exactly this long, including a short count-in. */
export const DANCE_SECONDS = 30;

/**
 * The puzzle time limit in seconds. Browser tests can set `window.__RR_PUZZLE_SECONDS` to a larger number so that long
 * test steps are not cut off by the 10-second timer. Players never see or use this.
 */
export function puzzleSeconds(): number {
  const override = typeof window !== 'undefined' ? (window as unknown as { __RR_PUZZLE_SECONDS?: unknown }).__RR_PUZZLE_SECONDS : undefined;
  return typeof override === 'number' && Number.isFinite(override) && override > 0 ? override : PUZZLE_SECONDS;
}
