import { useState } from 'react';
import { Burst } from '../components/Burst';
import { Icon } from '../components/Icon';
import { EMOJI } from '../data/emoji';
import type { CameraResult } from '../lib/poseScore';
import { copyText } from '../lib/share';

interface Props {
  /** What kind of run just finished. */
  kind: 'level' | 'challenge' | 'tryout';
  level?: { n: number; name: string; total: number };
  from?: string;
  skipped: boolean;
  /** Points from the camera, when the player used it. */
  score?: CameraResult;
  hasNext: boolean;
  /** When a level plays all its songs in turn: which song this was, and how to go on to the next one. */
  songProgress?: { index: number; total: number };
  onNextSong?: () => void;
  onNext: () => void;
  onAgain: () => void;
  onMake: () => void;
  onLevels: () => void;
  onBackToCreate: () => void;
}

/** The end-of-dance celebration, then the way forward. */
export function CelebrateScreen({ kind, level, from, skipped, score, hasNext, songProgress, onNextSong, onNext, onAgain, onMake, onLevels, onBackToCreate }: Props) {
  const [mood, setMood] = useState<string | null>(null);
  const [copied, setCopied] = useState('');
  const finalLevel = kind === 'level' && level && !hasNext;

  const headline =
    kind === 'tryout' ? 'Your puzzle works!' : kind === 'challenge' ? 'Challenge complete!' : finalLevel ? 'You finished the set!' : skipped ? 'Level complete' : 'Dance complete!';
  const body = skipped
    ? 'No problem. A movement break counts whenever you take it.'
    : kind === 'tryout'
      ? 'Now send it to a friend and invite them to move with you.'
      : kind === 'challenge'
        ? `${from ? `${from} will be glad you` : 'You'} took a movement break together.`
        : finalLevel
          ? `That was all ${level?.total} levels. Nice work, and thank you for moving.`
          : 'That was a proper movement break. Nice work.';

  const reply = async (text: string) => {
    const ok = await copyText(text);
    setCopied(ok ? `Copied "${text}". Paste it into your chat.` : 'Could not copy automatically.');
  };

  return (
    <section className="screen celebrate" aria-labelledby="cel-title">
      {!skipped && <Burst big />}
      <p className="kicker">{kind === 'level' && level ? `Level ${level.n} · ${level.name}` : kind === 'challenge' ? 'A friend\'s puzzle' : 'Your puzzle'}</p>
      <h1 id="cel-title" className="invite-title">{headline}</h1>
      <p className="sub">{body}</p>
      {score && !skipped && (
        <div className="score-card" data-testid="camera-score" data-points={score.points ?? 'none'}>
          {score.points === null ? (
            <p className="fine">{score.note}</p>
          ) : (
            <>
              <p className="score-points"><span data-testid="score-points">{score.points}</span> <span className="score-unit">points</span></p>
              <p className="score-stars" role="img" aria-label={`${score.stars} out of 3 stars`} data-stars={score.stars}>
                {[0, 1, 2].map((i) => (
                  <svg key={i} className={i < score.stars ? 'star is-on' : 'star'} viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
                    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" />
                  </svg>
                ))}
              </p>
              <p className="fine">{score.note} Points compare your arms and legs with the dancer's, allowing a moment to react. They are for fun, not a test.</p>
            </>
          )}
        </div>
      )}

      {kind !== 'tryout' && (
        <div className="mood">
          <p className="mood-q">How do you feel? <span className="fine">(optional, not saved)</span></p>
          <div className="emoji-row" role="group" aria-label="How do you feel">
            {EMOJI.filter((e) => e.kind === 'mood').map((e) => (
              <button key={e.label} type="button" className={`emoji-btn ${mood === e.label ? 'is-on' : ''}`} aria-pressed={mood === e.label} onClick={() => setMood(mood === e.label ? null : e.label)}>
                <span aria-hidden="true">{e.emoji}</span>
                <span>{e.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {kind === 'challenge' && (
        <div className="mood">
          <p className="mood-q">Tell {from ?? 'your friend'} how it went</p>
          <div className="emoji-row" role="group" aria-label="Reactions to copy">
            {EMOJI.filter((e) => e.kind === 'reaction').map((e) => (
              <button key={e.label} type="button" className="emoji-btn" onClick={() => reply(`${e.emoji} ${e.label}`)}>
                <span aria-hidden="true">{e.emoji}</span>
                <span>{e.label}</span>
              </button>
            ))}
          </div>
          <p className="fine" role="status">{copied || 'Tap one to copy it, then paste it into your chat.'}</p>
        </div>
      )}

      <div className="row center actions">
        {kind === 'level' && onNextSong && songProgress && (
          <button type="button" className="btn btn-hero" onClick={onNextSong} data-testid="next-song"><Icon name="right" size={24} /> Next song ({songProgress.index + 2} of {songProgress.total})</button>
        )}
        {kind === 'level' && hasNext && (
          <button type="button" className={onNextSong ? 'btn' : 'btn btn-hero'} onClick={onNext} data-testid="next-level"><Icon name="right" size={onNextSong ? 20 : 24} /> {onNextSong ? 'Skip to the next level' : 'Next level'}</button>
        )}
        {kind === 'level' && !hasNext && (
          <button type="button" className="btn btn-hero" onClick={onMake} data-testid="make-for-friend"><Icon name="share" size={24} /> Make a puzzle for a friend</button>
        )}
        {kind === 'challenge' && (
          <button type="button" className="btn btn-hero" onClick={onMake} data-testid="make-own"><Icon name="plus" size={24} /> Make your own puzzle</button>
        )}
        {kind === 'tryout' && (
          <button type="button" className="btn btn-hero" onClick={onBackToCreate} data-testid="back-to-create"><Icon name="share" size={24} /> Back to sharing</button>
        )}
      </div>
      <div className="row center">
        <button type="button" className="btn" onClick={onAgain} data-testid="dance-again"><Icon name="restart" /> Dance again</button>
        {kind === 'level' && hasNext && (
          <button type="button" className="btn btn-ghost" onClick={onMake} data-testid="challenge-friend"><Icon name="share" /> Challenge a friend</button>
        )}
        {kind === 'level' && !hasNext && (
          <button type="button" className="btn btn-ghost" onClick={onLevels} data-testid="play-again-all">Play again from level 1</button>
        )}
        {kind === 'challenge' && (
          <button type="button" className="btn btn-ghost" onClick={onLevels} data-testid="play-levels">Play the levels</button>
        )}
      </div>
    </section>
  );
}
