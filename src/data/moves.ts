import { MOVES_PER_SEQUENCE } from '../lib/constants';
import type { ThemeId } from './phrases';

export interface Move {
  id: string;
  name: string;
  /** Standing instruction. */
  cue: string;
  /** Seated / low-impact instruction (earns exactly the same points). */
  seatedCue: string;
}

export const MOVES: Record<string, Move> = {
  sway: { id: 'sway', name: 'Side sway', cue: 'Shift your weight gently from left to right, arms loose.', seatedCue: 'Sway your shoulders and upper body from side to side.' },
  reach: { id: 'reach', name: 'Sky reach', cue: 'Reach both arms up, then lower them with the beat.', seatedCue: 'Same movement from your seat: reach up, then lower.' },
  steptouch: { id: 'steptouch', name: 'Step-touch', cue: 'Step right, tap your left foot beside it, then switch sides.', seatedCue: 'Tap your feet out to the right, then the left, on the floor.' },
  clap: { id: 'clap', name: 'Clap beat', cue: 'Clap in front of your chest on every beat.', seatedCue: 'Same movement from your seat: clap on every beat.' },
  roll: { id: 'roll', name: 'Shoulder rolls', cue: 'Roll your shoulders backward in big, slow circles.', seatedCue: 'Same movement from your seat: slow backward shoulder rolls.' },
  march: { id: 'march', name: 'Easy march', cue: 'Lift your knees gently, only as high as feels comfortable.', seatedCue: 'Lift one knee at a time while seated, or press your heels down in turn.' },
  wave: { id: 'wave', name: 'Wave it out', cue: 'Wave one hand, then the other, above your head.', seatedCue: 'Same movement from your seat: wave one hand, then the other.' },
  twist: { id: 'twist', name: 'Retro twist', cue: 'Turn your hips and shoulders gently from side to side.', seatedCue: 'Turn your upper body gently from side to side.' },
  hook: { id: 'hook', name: 'Elbow hook', cue: 'Hook one elbow out to the side, then the other, with a small side step.', seatedCue: 'Hook one elbow out to the side, then the other, from your seat.' },
  cooldown: { id: 'cooldown', name: 'Cool-down stretch', cue: 'Reach up, breathe in, then lower slowly as you breathe out.', seatedCue: 'Same movement from your seat: reach up, breathe in, lower and breathe out.' },
};

export const SEQUENCES: Record<ThemeId, string[]> = {
  fresh: ['sway', 'reach', 'steptouch', 'clap', 'roll', 'march', 'wave', 'cooldown'],
  retro: ['sway', 'twist', 'steptouch', 'clap', 'wave', 'march', 'roll', 'cooldown'],
  hook: ['sway', 'hook', 'steptouch', 'clap', 'hook', 'march', 'reach', 'cooldown'],
};

export function sequenceFor(themeId: ThemeId): Move[] {
  const ids = SEQUENCES[themeId];
  if (ids.length !== MOVES_PER_SEQUENCE) throw new Error('Movement sequence length mismatch');
  return ids.map((id) => MOVES[id]);
}
