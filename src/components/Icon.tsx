const PATHS: Record<string, string> = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
  volume: 'M4 9v6h4l5 4V5L8 9zM16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12',
  mute: 'M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  share: 'M12 3v12M7 8l5-5 5 5M5 14v6h14v-6',
  check: 'M5 12.5l4.5 4.5L19 7',
  close: 'M6 6l12 12M18 6L6 18',
  hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  skip: 'M5 5l9 7-9 7zM17 5v14',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  copy: 'M9 9h10v11H9zM5 15V4h10',
  restart: 'M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5',
  shuffle: 'M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M18 4l3 3-3 3M18 14l3 3-3 3',
  seat: 'M7 4v9h9l3 7M7 13l-2 7M10 17h6',
  plus: 'M12 5v14M5 12h14',
  note: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  send: 'M21 3L10 14M21 3l-7 18-4-7-7-4z',
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
};

const FILLED = new Set(['play', 'pause', 'skip']);

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const d = PATHS[name] ?? PATHS.check;
  const filled = FILLED.has(name);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
