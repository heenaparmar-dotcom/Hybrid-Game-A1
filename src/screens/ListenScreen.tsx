import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioControls } from '../components/AudioControls';
import { Burst } from '../components/Burst';
import { Icon } from '../components/Icon';
import { shuffledOptions, type ListenChallenge } from '../data/listen';
import { ClipPlayer, type ClipInfo } from '../lib/clip';

interface Props {
  kicker: string;
  challenges: ListenChallenge[];
  volume: number;
  muted: boolean;
  onVolume: (v: number) => void;
  onMuted: (m: boolean) => void;
  /** Called after the last clip is answered correctly. Receives the line from the last clip. */
  onDone: (lastLine: string) => void;
}

const IDLE: ClipInfo = { status: 'idle', source: 'demo', fileFailed: false, voiceMissing: false, soundMissing: false };

/**
 * Level 3: listen to a short clip, then choose the line you heard. No rearranging here.
 * Sound only starts when the player presses Play (browsers require a tap first).
 */
export function ListenScreen({ kicker, challenges, volume, muted, onVolume, onMuted, onDone }: Props) {
  const [index, setIndex] = useState(0);
  const challenge = challenges[index];
  const options = useMemo(() => shuffledOptions(challenge), [challenge]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [correct, setCorrect] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [info, setInfo] = useState<ClipInfo>(IDLE);
  const [captions, setCaptions] = useState(false);
  const player = useRef<ClipPlayer | null>(null);
  const settings = useRef({ volume, muted });
  settings.current = { volume, muted };

  // one player per clip; leaving the clip (or the screen) silences it
  useEffect(() => {
    const p = new ClipPlayer(challenge, setInfo);
    p.setVolume(settings.current.volume, settings.current.muted);
    player.current = p;
    return () => {
      p.stop();
      player.current = null;
    };
  }, [challenge]);

  useEffect(() => {
    player.current?.setVolume(volume, muted);
  }, [volume, muted]);

  const play = () => void player.current?.play();
  const pick = (option: string) => {
    if (correct || wrong.includes(option)) return;
    if (option === challenge.line) {
      setCorrect(true);
      setFeedback(`Correct! You heard: "${challenge.line}"`);
      void player.current?.pause();
    } else {
      setWrong((w) => [...w, option]);
      setFeedback('Not quite. Play the clip again and listen for the words.');
    }
  };

  const next = () => {
    if (index + 1 < challenges.length) {
      setIndex(index + 1);
      setWrong([]);
      setCorrect(false);
      setFeedback('');
      setInfo(IDLE);
      setCaptions(false);
    } else {
      onDone(challenge.line);
    }
  };

  const playing = info.status === 'playing';
  const paused = info.status === 'paused';
  const started = info.status !== 'idle';
  const last = index + 1 === challenges.length;

  return (
    <section className="screen listen" aria-labelledby="listen-title" data-testid="listen-screen">
      <p className="kicker">{kicker} · Clip {index + 1} of {challenges.length}</p>
      <h1 id="listen-title" className="screen-title">Listen, then choose</h1>
      <p className="sub">You will hear a short music clip with a line in it. Pick the line you heard.</p>

      <div className="row center listen-controls">
        <button type="button" className="btn btn-primary" onClick={play} data-testid="clip-play">
          <Icon name={started ? 'restart' : 'play'} /> {started ? 'Replay clip' : 'Play clip'}
        </button>
        {(playing || paused) && (
          <button type="button" className="btn" onClick={() => void (playing ? player.current?.pause() : player.current?.resume())} data-testid="clip-pause">
            <Icon name={playing ? 'pause' : 'play'} /> {playing ? 'Pause' : 'Resume'}
          </button>
        )}
        <AudioControls volume={volume} muted={muted} onVolume={onVolume} onMuted={onMuted} />
      </div>
      <p className="sr-only" role="status" data-testid="clip-status">{info.status}</p>

      {started && info.source === 'demo' && (
        <p className="fine" data-testid="clip-source">Demo clip: original music with a computer voice. A licensed recording can be added (see the README).</p>
      )}
      {info.fileFailed && <p className="notice" role="status" data-testid="clip-file-failed">The recording could not be loaded, so the demo clip is playing instead.</p>}
      {info.soundMissing && <p className="notice" role="status" data-testid="clip-sound-missing">Your browser blocked or does not have sound. You can show the words below and still play on.</p>}
      {info.voiceMissing && <p className="notice" role="status" data-testid="clip-voice-missing">This device has no voice to speak the line. Show the words below to play on.</p>}

      <button type="button" className="link-btn" onClick={() => setCaptions((c) => !c)} aria-pressed={captions} data-testid="show-words">
        {captions ? 'Hide the words' : "Can't listen? Show the words"}
      </button>
      {captions && <p className="listen-words" data-testid="captions">"{challenge.line}"</p>}

      <ul className="options" aria-label="Which line did you hear?">
        {options.map((o) => {
          const isWrong = wrong.includes(o);
          const isRight = correct && o === challenge.line;
          return (
            <li key={o}>
              <button
                type="button"
                className={`option-btn ${isWrong ? 'is-wrong' : ''} ${isRight ? 'is-right' : ''}`}
                disabled={isWrong || (correct && !isRight)}
                aria-pressed={isRight}
                onClick={() => pick(o)}
                data-testid="option"
                data-correct={o === challenge.line ? 'yes' : 'no'}
              >
                {o}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="listen-foot">
        <p className={`feedback ${correct ? 'is-right' : wrong.length ? 'is-wrong' : ''}`} role="status" aria-live="polite" data-testid="listen-feedback">
          {feedback || 'Choose the line you heard.'}
        </p>
        {correct && (
          <>
            <Burst />
            <button type="button" className="btn btn-primary btn-next" onClick={next} data-testid="listen-next">
              <Icon name="right" /> {last ? 'Finish level' : 'Next clip'}
            </button>
          </>
        )}
      </div>
    </section>
  );
}
