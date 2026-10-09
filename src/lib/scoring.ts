import { SCORING } from './constants';

export interface PuzzleScore {
  puzzlePoints: number;
  speedBonus: number;
  hintDeduction: number;
}

/** Puzzle points = base minus hint deductions (never below 0). Speed bonus is separate and scales with remaining time. */
export function scorePuzzle(remainingMs: number, totalMs: number, hintsUsed: number): PuzzleScore {
  const hintDeduction = Math.min(SCORING.puzzleBase, Math.max(0, hintsUsed) * SCORING.hintPenalty);
  const ratio = totalMs > 0 ? Math.min(1, Math.max(0, remainingMs / totalMs)) : 0;
  return {
    puzzlePoints: Math.max(0, SCORING.puzzleBase - hintDeduction),
    speedBonus: Math.round(SCORING.speedBonusMax * ratio),
    hintDeduction,
  };
}

export function scoreMovement(completed: boolean): number {
  return completed ? SCORING.movePoints : 0;
}

export function turnTotal(puzzlePoints: number, speedBonus: number, movePoints: number): number {
  return puzzlePoints + speedBonus + movePoints;
}
