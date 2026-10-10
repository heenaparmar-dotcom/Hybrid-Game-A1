/**
 * Beginner moves. Each lasts 8 beats and is shown as four 2-beat cues.
 * Directions are SCREEN directions: copy the dancer like a mirror. When they go right on the screen, you go right.
 */
export interface Move {
  id: string;
  name: string;
  cues: [string, string, string, string];
  /** Upper-body / low-impact version of the same four cues. */
  seatedCues: [string, string, string, string];
}

export const MOVES: Record<string, Move> = {
  sway: {
    id: 'sway', name: 'Easy sway',
    cues: ['Sway right', 'Sway left', 'Sway right', 'Sway left'],
    seatedCues: ['Lean right', 'Lean left', 'Lean right', 'Lean left'],
  },
  step: {
    id: 'step', name: 'Step and tap',
    cues: ['Step right', 'Step left', 'Step right', 'Step left'],
    seatedCues: ['Tap feet right', 'Tap feet left', 'Tap feet right', 'Tap feet left'],
  },
  reach: {
    id: 'reach', name: 'Sky reach',
    cues: ['Reach up', 'Lower down', 'Reach up', 'Lower down'],
    seatedCues: ['Reach up', 'Lower down', 'Reach up', 'Lower down'],
  },
  clap: {
    id: 'clap', name: 'Clap the beat',
    cues: ['Clap, clap, clap', 'Keep clapping', 'Clap, clap, clap', 'Keep clapping'],
    seatedCues: ['Clap, clap, clap', 'Keep clapping', 'Clap, clap, clap', 'Keep clapping'],
  },
  hips: {
    id: 'hips', name: 'Hands on hips',
    cues: ['Hips right', 'Hips left', 'Hips right', 'Hips left'],
    seatedCues: ['Hands on hips, lean right', 'Lean left', 'Lean right', 'Lean left'],
  },
  march: {
    id: 'march', name: 'Easy march',
    cues: ['Knee, knee', 'Knee, knee', 'Knee, knee', 'Knee, knee'],
    seatedCues: ['Lift a knee, then the other', 'Keep marching', 'Lift a knee, then the other', 'Keep marching'],
  },
  wave: {
    id: 'wave', name: 'Wave it out',
    cues: ['Wave your right hand', 'Keep waving', 'Wave your left hand', 'Keep waving'],
    seatedCues: ['Wave your right hand', 'Keep waving', 'Wave your left hand', 'Keep waving'],
  },
  bhangra: {
    id: 'bhangra', name: 'Arm lifts',
    cues: ['Right arm up, left down', 'Switch, switch', 'Right arm up, left down', 'Switch, switch'],
    seatedCues: ['Right arm up, left down', 'Switch, switch', 'Right arm up, left down', 'Switch, switch'],
  },
  salsa: {
    id: 'salsa', name: 'Salsa basic',
    cues: ['Step right, hips sway', 'Step left, hips sway', 'Step right, hips sway', 'Step left, hips sway'],
    seatedCues: ['Sway hips right', 'Sway hips left', 'Sway hips right', 'Sway hips left'],
  },
  grapevine: {
    id: 'grapevine', name: 'Grapevine',
    cues: ['Step right, cross behind', 'Step left, cross behind', 'Step right, cross behind', 'Step left, cross behind'],
    seatedCues: ['Swing arms right', 'Swing arms left', 'Swing arms right', 'Swing arms left'],
  },
  merengue: {
    id: 'merengue', name: 'Merengue march',
    cues: ['March and pump', 'Keep pumping', 'March and pump', 'Keep pumping'],
    seatedCues: ['Lift knees, pump arms', 'Keep pumping', 'Lift knees, pump arms', 'Keep pumping'],
  },
  jump: {
    id: 'jump', name: 'Party hop',
    cues: ['Little hops, arms up!', 'Keep bouncing', 'Little hops, arms up!', 'Keep bouncing'],
    seatedCues: ['Bounce, arms up!', 'Keep bouncing', 'Bounce, arms up!', 'Keep bouncing'],
  },
  twist: {
    id: 'twist', name: 'Easy turn',
    cues: ['Turn right', 'Turn left', 'Turn right', 'Turn left'],
    seatedCues: ['Turn your shoulders right', 'Turn left', 'Turn right', 'Turn left'],
  },
};
