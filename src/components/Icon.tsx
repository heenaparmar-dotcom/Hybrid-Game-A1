const PATHS: Record<string, string> = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
  volume: 'M4 9v6h4l5 4V5L8 9zM16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12',
  mute: 'M4 9v6h4l5 4V5L8 9zM17 9l5 6M22 9l-5 6',
  book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8',
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
  stand: 'M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM12 9v6M8 11l4 1 4-1M12 15l-3 6M12 15l3 6',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 20h8',
  plus: 'M12 5v14M5 12h14',
};

const FILLED = new Set(['play', 'pause', 'skip']);

export function Icon({ name, size = 20 }: { name: keyof typeof PATHS | string; size?: number }) {
  const d = PATHS[name] ?? PATHS.check;
  const filled = FILLED.has(name);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
