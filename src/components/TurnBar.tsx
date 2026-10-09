import type { Session } from '../lib/types';
import { StepTrack, type Step } from './StepTrack';

export function TurnBar({ session, step }: { session: Session; step: Step }) {
  const name = session.names[session.turnInRound] ?? session.names[0];
  return (
    <div className="turnbar" data-testid="turnbar">
      <div className="turnbar-info">
        <span className="chip">{session.phrase.custom ? 'Friend puzzle' : `Round ${session.round}`}</span>
        <span className="turnbar-name" data-testid="current-player">{session.mode === 'duo' ? `${name}'s turn` : name}</span>
        {session.mode === 'duo' && (
          <span className="turnbar-scores" aria-label="Match score">
            {session.names.map((n, i) => (
              <span key={i} className={i === session.turnInRound ? 'is-turn' : ''}>
                {n}: <strong>{session.totals[i]}</strong>
              </span>
            ))}
          </span>
        )}
        {session.mode === 'solo' && <span className="turnbar-scores">Score: <strong>{session.totals[0]}</strong></span>}
      </div>
      <StepTrack current={step} />
    </div>
  );
}
