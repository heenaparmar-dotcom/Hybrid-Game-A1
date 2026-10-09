/**
 * ORIGINAL DEMO CONTENT. Every phrase below was written for this project.
 * They are not lyrics from any commercial song. Do not replace them with real lyrics.
 */
export type ThemeId = 'fresh' | 'retro' | 'hook';

export interface Phrase {
  id: string;
  text: string;
  themeId: ThemeId;
}

export const PHRASES: readonly Phrase[] = [
  { id: 'p01', text: 'Dancing under neon skies', themeId: 'fresh' },
  { id: 'p02', text: 'Move with the morning light', themeId: 'fresh' },
  { id: 'p03', text: 'Feel the rhythm in your steps', themeId: 'fresh' },
  { id: 'p04', text: 'Catch the colours of the beat', themeId: 'fresh' },
  { id: 'p05', text: 'Sunrise brings another groove', themeId: 'fresh' },
  { id: 'p06', text: 'We spin beneath the stars', themeId: 'retro' },
  { id: 'p07', text: 'Every little move feels new', themeId: 'retro' },
  { id: 'p08', text: 'Rewind the tape and dance again', themeId: 'retro' },
  { id: 'p09', text: 'Spin the old record twice', themeId: 'retro' },
  { id: 'p10', text: 'Turn the quiet into play', themeId: 'retro' },
  { id: 'p11', text: 'Let the music guide your feet', themeId: 'hook' },
  { id: 'p12', text: 'Step into a brighter day', themeId: 'hook' },
  { id: 'p13', text: 'Find your rhythm, find your flow', themeId: 'hook' },
  { id: 'p14', text: 'One more beat and off we go', themeId: 'hook' },
];
