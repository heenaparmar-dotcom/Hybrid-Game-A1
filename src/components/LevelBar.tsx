import { LEVELS } from '../data/levels';

interface Props {
  current: number;
  completed: number;
  onSelect: (n: number) => void;
}

/** Shows where the player is. Every level is open, so a player can jump to any of them at any time. */
export function LevelBar({ current, completed, onSelect }: Props) {
  return (
    <nav className="levelbar" aria-label="Levels">
      {LEVELS.map((l) => {
        const done = l.n <= completed;
        return (
          <button
            key={l.n}
            type="button"
            className={`level-pip ${l.n === current ? 'is-current' : ''} ${done ? 'is-done' : ''}`}
            aria-current={l.n === current ? 'step' : undefined}
            aria-label={`Level ${l.n}, ${l.name}${done ? ', finished' : ''}`}
            onClick={() => onSelect(l.n)}
            data-testid={`level-${l.n}`}
          >
            <span className="pip-num">{l.n}</span>
            <span className="pip-name">{l.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
