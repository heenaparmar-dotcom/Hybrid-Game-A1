import { useMemo } from 'react';

const COLORS = ['#ff5d4d', '#ff9a3d', '#c9f35a', '#7de8c3', '#fff2e0'];
const NOTE = 'M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm11-2a3 3 0 1 1-3-3 3 3 0 0 1 3 3z';

/** A small burst of music-inspired shapes. Pure CSS animation; hidden entirely for people who prefer reduced motion. */
export function Burst({ big = false }: { big?: boolean }) {
  const shapes = useMemo(() => {
    const n = big ? 28 : 16;
    return Array.from({ length: n }, (_, i) => {
      const angle = (i / n) * Math.PI * 2 + (i % 3) * 0.2;
      const dist = (big ? 150 : 110) + ((i * 37) % 70);
      return {
        kind: i % 4,
        color: COLORS[i % COLORS.length],
        dx: Math.round(Math.cos(angle) * dist),
        dy: Math.round(Math.sin(angle) * dist * 0.75),
        rot: ((i * 53) % 360) - 180,
        delay: (i % 5) * 0.03,
        size: 14 + ((i * 7) % 14),
      };
    });
  }, [big]);

  return (
    <div className="burst" aria-hidden="true">
      {shapes.map((s, i) => (
        <svg
          key={i}
          className="burst-shape"
          viewBox="0 0 24 24"
          width={s.size}
          height={s.size}
          style={{ ['--dx' as string]: `${s.dx}px`, ['--dy' as string]: `${s.dy}px`, ['--rot' as string]: `${s.rot}deg`, animationDelay: `${s.delay}s` }}
        >
          {s.kind === 0 && <circle cx="12" cy="12" r="9" fill={s.color} />}
          {s.kind === 1 && <path d={NOTE} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />}
          {s.kind === 2 && <path d="M12 3l10 17H2z" fill={s.color} />}
          {s.kind === 3 && <circle cx="12" cy="12" r="8" fill="none" stroke={s.color} strokeWidth="3" />}
        </svg>
      ))}
    </div>
  );
}
