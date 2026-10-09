import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './components/Icon';
import { LevelBar } from './components/LevelBar';
import { Modal } from './components/Modal';
import { RuleBook } from './components/RuleBook';
import { LEVEL_COUNT, levelByNumber } from './data/levels';
import { listenOrder, type ListenChallenge } from './data/listen';
import { pickPuzzle, type Puzzle } from './data/puzzles';
import { trackById, type Track } from './data/tracks';
import { music } from './lib/audio';
import { CHALLENGE_PARAM, parseChallengeInput, type ChallengeData } from './lib/challenge';
import { loadStore, saveStore, type Store } from './lib/storage';
import { puzzleSeconds } from './lib/timing';
import { prefersReducedMotion } from './lib/useBeat';
import { CelebrateScreen } from './screens/CelebrateScreen';
import { ChallengeScreen, type Incoming } from './screens/ChallengeScreen';
import { CreateScreen } from './screens/CreateScreen';
import { DanceScreen } from './screens/DanceScreen';
import { InviteScreen } from './screens/InviteScreen';
import { ListenScreen } from './screens/ListenScreen';
import { PuzzleScreen } from './screens/PuzzleScreen';
import { TitleScreen } from './screens/TitleScreen';

/** Levels 1 and 2 give a word-order puzzle; level 3 gives two listening clips. */
type Run = { kind: 'level'; level: number; puzzle?: Puzzle; listen?: ListenChallenge[] } | { kind: 'challenge'; data: ChallengeData; tryout: boolean };
type Stage = 'puzzle' | 'invite' | 'dance' | 'celebrate';
type View =
  | { name: 'title' }
  | { name: 'play'; run: Run; stage: Stage; key: number; skipped: boolean; timedOut?: boolean }
  | { name: 'create' }
  | { name: 'challenge' };

function readIncoming(): Incoming {
  const hash = window.location.hash;
  if (!hash.includes(`${CHALLENGE_PARAM}=`)) return { kind: 'none' };
  const res = parseChallengeInput(hash);
  return res.ok ? { kind: 'ok', data: res.value } : { kind: 'error', message: res.error };
}

/** Everything the three play stages need to know about the current run. */
function describe(run: Run) {
  if (run.kind === 'level') {
    const level = levelByNumber(run.level);
    const puzzle = run.puzzle;
    return {
      phrase: puzzle?.phrase ?? run.listen?.[run.listen.length - 1]?.line ?? '',
      track: trackById(puzzle?.trackId ?? level.trackId),
      kicker: `Level ${level.n} · ${level.name}`,
      prompt: puzzle?.song ? (level.n === 1 ? 'A Hindi film song. Put the title in order. Need help? Tap Hint.' : 'A Hindi film song. Put the title in order, and use the hint.') : level.prompt,
      timeLimit: puzzle?.song ? puzzleSeconds() : undefined,
      hintMode: (level.n === 1 ? 'button' : 'visible') as 'button' | 'visible',
      meaning: puzzle?.meaning,
      song: puzzle?.song,
      video: puzzle?.video,
      initialOrder: undefined as number[] | undefined,
      from: undefined as string | undefined,
    };
  }
  const { data } = run;
  return {
    phrase: data.phrase,
    track: trackById(data.track ?? 'sunrise'),
    kicker: run.tryout ? 'Your puzzle' : data.from ? `${data.from}'s puzzle` : "A friend's puzzle",
    prompt: `${data.phrase.split(' ').length} words. Put the line back in order, then dance.`,
    meaning: undefined,
    song: undefined,
    video: undefined as Puzzle['video'],
    timeLimit: undefined as number | undefined,
    hintMode: 'visible' as 'button' | 'visible',
    initialOrder: data.order,
    from: data.from,
  };
}

export default function App() {
  const [store, setStore] = useState<Store>(() => loadStore());
  const [incoming, setIncoming] = useState<Incoming>(() => readIncoming());
  const [view, setView] = useState<View>(() => (readIncoming().kind === 'none' ? { name: 'title' } : { name: 'challenge' }));
  const [rulesOpen, setRulesOpen] = useState(false);
  const [splash, setSplash] = useState<string | null>(null);
  const keyCounter = useRef(0);
  /** The puzzle last shown for each level, so entering a level again gives a different one. */
  const lastPuzzle = useRef<Record<number, string>>({});
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => saveStore(store), [store]);
  useEffect(() => {
    music.setVolume(store.volume);
    music.setMuted(store.muted);
  }, [store.volume, store.muted]);

  useEffect(() => {
    const onHash = () => {
      const inc = readIncoming();
      setIncoming(inc);
      if (inc.kind !== 'none') {
        music.stop();
        setView({ name: 'challenge' });
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Move focus to the page content when the screen changes, unless a control on the new screen already took it.
  const stageKey = view.name === 'play' ? `${view.key}-${view.stage}` : view.name;
  useEffect(() => {
    window.scrollTo(0, 0);
    const a = document.activeElement;
    if (!a || a === document.body || !mainRef.current?.contains(a)) mainRef.current?.focus({ preventScroll: true });
  }, [stageKey]);

  useEffect(() => {
    if (!splash) return;
    const id = window.setTimeout(() => setSplash(null), prefersReducedMotion() ? 600 : 1500);
    return () => window.clearTimeout(id);
  }, [splash]);

  const setVolume = useCallback((volume: number) => setStore((s) => ({ ...s, volume })), []);
  const setMuted = useCallback((muted: boolean) => setStore((s) => ({ ...s, muted })), []);

  const newKey = () => ++keyCounter.current;

  const goTitle = () => {
    music.stop();
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setIncoming({ kind: 'none' });
    setView({ name: 'title' });
  };

  const startLevel = (n: number) => {
    music.stop();
    const level = levelByNumber(n);
    setSplash(`Level ${level.n}|${level.name}`);
    if (level.n === 3) {
      // level 3 is a listening level: both clips, in a random order
      setView({ name: 'play', run: { kind: 'level', level: 3, listen: listenOrder() }, stage: 'puzzle', key: newKey(), skipped: false });
      return;
    }
    const puzzle = pickPuzzle(level.n, lastPuzzle.current[level.n]);
    lastPuzzle.current[level.n] = puzzle.id;
    setView({ name: 'play', run: { kind: 'level', level: level.n, puzzle }, stage: 'puzzle', key: newKey(), skipped: false });
  };
  const resumeLevel = () => startLevel(store.completed >= LEVEL_COUNT ? 1 : store.completed + 1);

  const startChallenge = (data: ChallengeData, tryout: boolean) => {
    music.stop();
    setSplash(tryout ? 'Your puzzle|Try it first' : data.from ? `${data.from}'s puzzle|A friend challenged you` : "A friend's puzzle|You have been challenged");
    setView({ name: 'play', run: { kind: 'challenge', data, tryout }, stage: 'puzzle', key: newKey(), skipped: false });
  };

  const toStage = (stage: Stage, skipped = false, timedOut = false) => setView((v) => (v.name === 'play' ? { ...v, stage, skipped, timedOut } : v));

  /** Called from a click, so the audio context is allowed to start. */
  const startDance = (track: Track, video?: Puzzle['video']) => {
    // a song with an official video plays through YouTube's player instead of the game's own music
    if (!video) void music.start(track.id);
    else music.stop();
    setView((v) => (v.name === 'play' ? { ...v, stage: 'dance', key: newKey(), skipped: false } : v));
  };

  const finishRun = (skipped: boolean) => {
    if (view.name !== 'play') return;
    if (view.run.kind === 'level') {
      const n = view.run.level;
      setStore((s) => ({ ...s, completed: Math.max(s.completed, n) }));
    }
    toStage('celebrate', skipped);
  };

  const body = () => {
    if (view.name === 'title') {
      return <TitleScreen completed={store.completed} onStart={resumeLevel} onStartOver={() => { setStore((s) => ({ ...s, completed: 0 })); startLevel(1); }} />;
    }
    if (view.name === 'create') {
      return <CreateScreen onTry={(data) => startChallenge(data, true)} onOpenLink={(data) => { setIncoming({ kind: 'ok', data }); setView({ name: 'challenge' }); }} />;
    }
    if (view.name === 'challenge') {
      return (
        <ChallengeScreen
          incoming={incoming}
          onAccept={() => incoming.kind === 'ok' && startChallenge(incoming.data, false)}
          onPlayLevels={() => { goTitle(); resumeLevel(); }}
          onMake={() => setView({ name: 'create' })}
        />
      );
    }

    const info = describe(view.run);
    const levelNo = view.run.kind === 'level' ? view.run.level : null;
    const hasNext = levelNo !== null && levelNo < LEVEL_COUNT;
    return (
      <>
        {levelNo !== null && view.stage !== 'dance' && <LevelBar current={levelNo} completed={store.completed} onSelect={startLevel} />}
        {view.stage === 'puzzle' && view.run.kind === 'level' && view.run.listen && (
          <ListenScreen
            key={view.key}
            kicker={info.kicker}
            challenges={view.run.listen}
            volume={store.volume}
            muted={store.muted}
            onVolume={setVolume}
            onMuted={setMuted}
            onDone={() => toStage('invite')}
          />
        )}
        {view.stage === 'puzzle' && !(view.run.kind === 'level' && view.run.listen) && (
          <PuzzleScreen
            key={view.key}
            kicker={info.kicker}
            prompt={info.prompt}
            phrase={info.phrase}
            initialOrder={info.initialOrder}
            songTitle={info.track.title}
            meaning={info.meaning}
            song={info.song}
            hintMode={info.hintMode}
            timeLimit={info.timeLimit}
            paused={splash !== null || rulesOpen}
            onSolved={({ timedOut }) => toStage('invite', false, timedOut)}
          />
        )}
        {view.stage === 'invite' && (
          <InviteScreen
            track={info.track}
            phrase={info.phrase}
            timedOut={view.timedOut}
            songNote={
              info.song
                ? info.video
                  ? `That was ${info.song.title}. The dance plays the official video through YouTube (${info.video.credit}), so it needs internet. If it cannot play, the game's own music is used.`
                  : `That was ${info.song.title}. The dance uses our own original track, ${info.track.title}, because the recording of the film song is not included in this game.`
                : undefined
            }
            seated={store.seated}
            onSeated={(seated) => setStore((s) => ({ ...s, seated }))}
            onAccept={() => startDance(info.track, info.video)}
            onSkip={() => finishRun(true)}
          />
        )}
        {view.stage === 'dance' && (
          <DanceScreen
            key={view.key}
            track={info.track}
            kicker={info.kicker}
            seated={store.seated}
            externalPause={rulesOpen}
            volume={store.volume}
            muted={store.muted}
            onVolume={setVolume}
            onMuted={setMuted}
            video={info.video}
            songTitle={info.song?.title}
            onFinish={() => finishRun(false)}
            onSkip={() => { music.stop(); finishRun(true); }}
            onRestart={() => startDance(info.track, info.video)}
          />
        )}
        {view.stage === 'celebrate' && (
          <CelebrateScreen
            kind={view.run.kind === 'level' ? 'level' : view.run.tryout ? 'tryout' : 'challenge'}
            level={levelNo !== null ? { n: levelNo, name: levelByNumber(levelNo).name, total: LEVEL_COUNT } : undefined}
            from={info.from}
            skipped={view.skipped}
            hasNext={hasNext}
            onNext={() => startLevel((levelNo ?? 0) + 1)}
            onAgain={() => startDance(info.track, info.video)}
            onMake={() => { music.stop(); setView({ name: 'create' }); }}
            onLevels={() => (view.run.kind === 'level' ? startLevel(1) : resumeLevel())}
            onBackToCreate={() => setView({ name: 'create' })}
          />
        )}
      </>
    );
  };

  const [splashTitle, splashSub] = (splash ?? '|').split('|');

  return (
    <div className={`app view-${view.name}`}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
      <header className="topbar">
        {view.name !== 'title' ? (
          <button type="button" className="wordmark-small" onClick={goTitle} data-testid="home" aria-label="RHYTHM RUSH, back to the title screen">
            RHYTHM <span>RUSH</span>
          </button>
        ) : (
          <span />
        )}
        <nav className="topnav" aria-label="Main">
          {view.name !== 'create' && (
            <button type="button" className="nav-btn" onClick={() => { music.stop(); setView({ name: 'create' }); }} data-testid="nav-make">
              <Icon name="plus" size={18} /> <span>Make a puzzle</span>
            </button>
          )}
          <button type="button" className="nav-btn" onClick={() => setRulesOpen(true)} data-testid="nav-rules">
            <Icon name="book" size={18} /> <span>How to play</span>
          </button>
        </nav>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="main" data-view={view.name} data-stage={view.name === 'play' ? view.stage : undefined}>
        {body()}
      </main>

      {splash && (
        <div className="splash" aria-hidden="true" data-testid="splash">
          <p className="splash-kicker">{splashTitle}</p>
          <p className="splash-title">{splashSub}</p>
        </div>
      )}

      {rulesOpen && (
        <Modal title="How to play" onClose={() => setRulesOpen(false)} wide>
          <RuleBook />
        </Modal>
      )}
    </div>
  );
}
