import { MOVES, type Move } from '../data/moves';
import { BEATS_PER_MOVE, COUNT_IN_BEATS, routineBeats, type Track } from '../data/tracks';
import { ease, lerpPose, poseAt, type Pose } from './dancer';

export type RoutinePhase = 'countin' | 'dance' | 'done';

export interface RoutineState {
  phase: RoutinePhase;
  /** Beat counted from the first move (negative during the count-in). */
  beat: number;
  moveIndex: number;
  move: Move;
  next?: Move;
  cueIndex: number;
  cue: string;
  /** 1-based pass through the whole sequence, and how many passes there are. */
  round: number;
  rounds: number;
  /** 0 to 1 across the whole dance. */
  progress: number;
  /** Which beat of the bar (0 to 3) for the beat dots. */
  beatInBar: number;
  /** 4, 3, 2, 1 across the last four beats of the count-in, otherwise null. */
  countNumber: number | null;
}

export function routineMoves(track: Track): Move[] {
  return track.moves.map((id) => MOVES[id]);
}

export function stateAt(track: Track, beat: number, seated: boolean): RoutineState {
  const moves = routineMoves(track);
  const total = routineBeats(track);
  const phase: RoutinePhase = beat < 0 ? 'countin' : beat >= total ? 'done' : 'dance';
  const clamped = phase === 'done' ? total - 0.0001 : beat;
  // During the count-in the dancer previews the first move.
  const dancing = Math.max(0, clamped);
  const slot = Math.floor(dancing / BEATS_PER_MOVE);
  const moveIndex = slot % moves.length;
  const inMove = dancing - slot * BEATS_PER_MOVE;
  const cueIndex = Math.min(3, Math.floor(inMove / 2));
  const move = moves[moveIndex];
  const cues = seated ? move.seatedCues : move.cues;
  // 4, 3, 2, 1 across the last four beats of the count-in.
  const countNumber = phase === 'countin' && beat >= -4 ? Math.max(1, Math.ceil(-beat)) : null;
  return {
    phase,
    beat,
    moveIndex,
    move,
    next: slot + 1 < moves.length * track.repeats ? moves[(slot + 1) % moves.length] : undefined,
    cueIndex,
    cue: phase === 'countin' ? 'Find your spot' : cues[cueIndex],
    round: Math.floor(slot / moves.length) + 1,
    rounds: track.repeats,
    progress: Math.max(0, Math.min(1, dancing / total)),
    beatInBar: ((Math.floor(beat) % 4) + 4) % 4,
    countNumber,
  };
}

/** Dancer pose at a beat, with a one-beat blend from the previous move so transitions look natural. */
export function poseAtBeat(track: Track, beat: number, seated: boolean): Pose {
  const moves = routineMoves(track);
  if (beat < 0) return poseAt(moves[0].id, beat + COUNT_IN_BEATS, seated);
  const total = routineBeats(track);
  const t = Math.min(beat, total - 0.0001);
  const slot = Math.floor(t / BEATS_PER_MOVE);
  const b = t - slot * BEATS_PER_MOVE;
  const current = poseAt(moves[slot % moves.length].id, b, seated);
  if (slot > 0 && b < 1) {
    const prev = poseAt(moves[(slot - 1) % moves.length].id, b + BEATS_PER_MOVE, seated);
    return lerpPose(prev, current, ease(b / 1));
  }
  return current;
}
