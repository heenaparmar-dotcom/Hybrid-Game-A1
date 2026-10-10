import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './components/Icon';
import { LevelBar } from './components/LevelBar';
import { Modal } from './components/Modal';
import { RuleBook } from './components/RuleBook';
import { LEVEL_COUNT, levelByNumber } from './data/levels';
import { listenOrder, type ListenChallenge } from './data/listen';
import { LYRIC_LINES } from './data/lyricLines';
import { pickPuzzle, playablePuzzles, type Puzzle } from './data/puzzles';
import { trackById, type Track } from './data/tracks';
import { music } from './lib/audio';
import { CHALLENGE_PARAM, parseChallengeInput, type ChallengeData } from './lib/challenge';
import type { CameraResult } from './lib/poseScore';
import { loadStore, saveStore, type Store } from './lib/storage';
import { puzzleSeconds } from './lib/timing';
import { prefersReducedMotion } from './lib/useBeat';
import { CelebrateScreen } from './screens/CelebrateScreen';
import { ChallengeScreen, type Incoming } from './screens/ChallengeScreen';
import { CreateScreen } from './screens/CreateScreen';
import { DanceScreen } from './screens/DanceScreen';
import { HandoverScreen } from './screens/HandoverScreen';
import { InviteScreen } from './screens/InviteScreen';
import { ListenScreen } from './screens/ListenScreen';
import { PuzzleScreen } from './screens/PuzzleScreen';
import { TitleScreen } from './screens/TitleScreen';

/** Levels 1 and 2 give a word-order puzzle; level 3 gives two listening clips. */
type Run = { kind: 'level'; level: number; puzzle?: Puzzle; listen?: ListenChallenge[]; songs?: Puzzle[]; songIndex?: number } | { kind: 'challenge'; data: ChallengeData; tryout: boolean };
type Stage = 'puzzle' | 'handover' | 'invite' | 'dance' | 'celebrate';
/** Two players on one device: Player 1 solves a puzzle, then Player 2, then both dance to the faster solver's song. */
interface TwoPlayer {
  turn: 1 | 2;
  first?: { puzzle: Puzzle; ms: number; timedOut: boolean };
  /** Said on the invitation once both have played: whose song plays and why. */
  note?: string;
}
type View =
  | { name: 'title' }
  | { name: 'play'; run: Run; stage: Stage; key: number; skipped: boolean; timedOut?: boolean; two?: TwoPlayer; score?: CameraResult }
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
      // a lyric line (see lyricLines.ts) gets three times as long as a short title
      timeLimit: puzzle?.song ? (LYRIC_LINES[puzzle.id] ? puzzleSeconds() * 3 : puzzleSeconds()) : undefined,
      hintMode: (level.n === 1 ? 'button' : 'visible') as 'button' | 'visible',
      meaning: puzzle?.meaning,
      song: puzzle?.song,
      video: puzzle?.video,
      audio: puzzle?.audio,
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
    audio: undefined as Puzzle['audio'],
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
  const viewRef = useRef(view);
  /** The steps the player has been through, so Back can return to the one before. */
  const history = useRef<View[]>([]);
  const [canBack, setCanBack] = useState(false);
  /** Every move to another screen or step goes through here, so the Back button can undo it. */
  const navigate = (next: View | ((v: View) => View)) => {
    const cur = viewRef.current;
    const n = typeof next === 'function' ? next(cur) : next;
    const sameStep = n.name === cur.name && (n.name !== 'play' || (cur.name === 'play' && n.stage === cur.stage && n.key === cur.key));
    if (!sameStep) {
      history.current.push(cur);
      if (history.current.length > 40) history.current.shift();
      setCanBack(true);
    }
    viewRef.current = n;
    setView(n);
  };
  const [rulesOpen, setRulesOpen] = useState(false);
  const [splash, setSplash] = useState<string | null>(null);
  /** Camera points are opt-in each time and never remembered. */
  const [cameraOn, setCameraOn] = useState(false);
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
        navigate({ name: 'challenge' });
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
    history.current = [];
    setCanBack(false);
    viewRef.current = { name: 'title' };
    setView({ name: 'title' });
  };

  /** Back: return to the step before. A dance cannot be resumed, so Back goes past it to the step before the dance. */
  const goBack = () => {
    music.stop();
    let prev = history.current.pop();
    while (prev && prev.name === 'play' && prev.stage === 'dance') prev = history.current.pop();
    setCanBack(history.current.length > 0);
    if (!prev || prev.name === 'title') {
      goTitle();
      return;
    }
    viewRef.current = prev;
    setView(prev);
  };

  const startLevel = (n: number) => {
    music.stop();
    const level = levelByNumber(n);
    setSplash(`Level ${level.n}|${level.name}`);
    if (level.n === 3) {
      // level 3 is a listening level: both clips, in a random order
      // the listening level is shared: both players listen together
      navigate({ name: 'play', run: { kind: 'level', level: 3, listen: listenOrder() }, stage: 'puzzle', key: newKey(), skipped: false });
      return;
    }
    // One player who chose "All songs": every song of the level, in order
    if (store.allSongs && store.players === 1) {
      const songs = playablePuzzles(level.n);
      lastPuzzle.current[level.n] = songs[0].id;
      navigate({ name: 'play', run: { kind: 'level', level: level.n, puzzle: songs[0], songs, songIndex: 0 }, stage: 'puzzle', key: newKey(), skipped: false });
      return;
    }
    // The first Warm Up puzzle of a visit is always Kala Chashma (the song with the full recording). Tests steer Math.random through
    // window.__r, so they keep their own picks.
    const featured = level.n === 1 && lastPuzzle.current[1] === undefined && typeof (window as unknown as { __r?: unknown }).__r === 'undefined';
    const puzzle = (featured ? playablePuzzles(1).find((p) => p.id === 'l1-s02') : undefined) ?? pickPuzzle(level.n, lastPuzzle.current[level.n]);
    lastPuzzle.current[level.n] = puzzle.id;
    navigate({ name: 'play', run: { kind: 'level', level: level.n, puzzle }, stage: 'puzzle', key: newKey(), skipped: false, two: store.players === 2 ? { turn: 1 } : undefined });
  };
  /** All-songs mode: go straight to another song of the same level (no splash, no dance in between). */
  const startSong = (index: number) => {
    if (view.name !== 'play' || view.run.kind !== 'level' || !view.run.songs) return;
    const { songs, level } = view.run;
    music.stop();
    lastPuzzle.current[level] = songs[index].id;
    navigate({ name: 'play', run: { kind: 'level', level, puzzle: songs[index], songs, songIndex: index }, stage: 'puzzle', key: newKey(), skipped: false });
  };
  /** Skip the rest of this level: it counts as finished, and the next level (or the end screen) follows. */
  const skipLevel = () => {
    if (view.name !== 'play' || view.run.kind !== 'level') return;
    const n = view.run.level;
    music.stop();
    setStore((s) => ({ ...s, completed: Math.max(s.completed, n) }));
    if (n < LEVEL_COUNT) startLevel(n + 1);
    else toStage('celebrate', true);
  };
  /** Skip this song: the next song of the level, or the next level after the last one. */
  const skipSong = () => {
    if (view.name !== 'play' || view.run.kind !== 'level') return;
    const { songs, songIndex } = view.run;
    if (songs && songIndex !== undefined && songIndex + 1 < songs.length) startSong(songIndex + 1);
    else skipLevel();
  };
  const resumeLevel = () => startLevel(store.completed >= LEVEL_COUNT ? 1 : store.completed + 1);

  const startChallenge = (data: ChallengeData, tryout: boolean) => {
    music.stop();
    setSplash(tryout ? 'Your puzzle|Try it first' : data.from ? `${data.from}'s puzzle|A friend challenged you` : "A friend's puzzle|You have been challenged");
    navigate({ name: 'play', run: { kind: 'challenge', data, tryout }, stage: 'puzzle', key: newKey(), skipped: false });
  };

  const toStage = (stage: Stage, skipped = false, timedOut = false, score?: CameraResult) => navigate((v) => (v.name === 'play' ? { ...v, stage, skipped, timedOut, score } : v));

  /** Called from a click, so the audio context is allowed to start. */
  const startDance = (track: Track, video?: Puzzle['video'], audio?: Puzzle['audio']) => {
    // a song with an official video plays through YouTube's player instead of the game's own music
    if (!video && !audio) void music.start(track.id);
    else music.stop();
    navigate((v) => (v.name === 'play' ? { ...v, stage: 'dance', key: newKey(), skipped: false } : v));
  };

  /** One puzzle is finished. With two players, Player 1 hands over and Player 2's result decides whose song plays. */
  const onPuzzleDone = (timedOut: boolean, ms: number) => {
    if (view.name !== 'play') return;
    const { two, run } = view;
    if (!two || run.kind !== 'level' || !run.puzzle) {
      toStage('invite', false, timedOut);
      return;
    }
    if (two.turn === 1) {
      navigate({ ...view, stage: 'handover', two: { turn: 1, first: { puzzle: run.puzzle, ms, timedOut } } });
      return;
    }
    const first = two.first;
    if (!first) {
      toStage('invite', false, timedOut);
      return;
    }
    const p2Wins = !timedOut && (first.timedOut || ms < first.ms);
    const winner = p2Wins ? 2 : 1;
    const note =
      first.timedOut && timedOut
        ? "Neither of you beat the clock, so Player 1's song plays for both of you."
        : first.timedOut || timedOut
          ? `Player ${winner} solved theirs, so their song plays for both of you.`
          : `Player ${winner} solved it faster, so their song plays for both of you.`;
    navigate({ ...view, run: { ...run, puzzle: p2Wins ? run.puzzle : first.puzzle }, stage: 'invite', timedOut: first.timedOut && timedOut, skipped: false, two: { turn: 2, first, note } });
  };

  /** Player 2 is ready: give them a different puzzle from the same level. */
  const startSecondTurn = () => {
    if (view.name !== 'play' || view.run.kind !== 'level' || !view.two?.first) return;
    const level = view.run.level;
    const puzzle = pickPuzzle(level, view.two.first.puzzle.id);
    lastPuzzle.current[level] = puzzle.id;
    navigate({ ...view, run: { ...view.run, puzzle }, stage: 'puzzle', key: newKey(), two: { turn: 2, first: view.two.first } });
  };

  const finishRun = (skipped: boolean, score?: CameraResult) => {
    if (view.name !== 'play') return;
    if (view.run.kind === 'level') {
      const n = view.run.level;
      const moreSongs = !!view.run.songs && (view.run.songIndex ?? 0) + 1 < view.run.songs.length;
      if (!moreSongs) setStore((s) => ({ ...s, completed: Math.max(s.completed, n) }));
    }
    toStage('celebrate', skipped, false, score);
  };

  const body = () => {
    if (view.name === 'title') {
      return <TitleScreen completed={store.completed} players={store.players} onPlayers={(players) => setStore((s) => ({ ...s, players }))} allSongs={store.allSongs} onAllSongs={(allSongs) => setStore((s) => ({ ...s, allSongs }))} onStart={resumeLevel} onStartOver={() => { setStore((s) => ({ ...s, completed: 0 })); startLevel(1); }} />;
    }
    if (view.name === 'create') {
      return <CreateScreen onTry={(data) => startChallenge(data, true)} onOpenLink={(data) => { setIncoming({ kind: 'ok', data }); navigate({ name: 'challenge' }); }} />;
    }
    if (view.name === 'challenge') {
      return (
        <ChallengeScreen
          incoming={incoming}
          onAccept={() => incoming.kind === 'ok' && startChallenge(incoming.data, false)}
          onPlayLevels={() => { goTitle(); resumeLevel(); }}
          onMake={() => navigate({ name: 'create' })}
        />
      );
    }

    const info = describe(view.run);
    const two = view.name === 'play' ? view.two : undefined;
    const songNo = view.name === 'play' && view.run.kind === 'level' && view.run.songs ? { index: view.run.songIndex ?? 0, total: view.run.songs.length } : undefined;
    const kickerBase = songNo ? `${info.kicker} · Song ${songNo.index + 1} of ${songNo.total}` : info.kicker;
    const kicker = two && view.stage === 'puzzle' ? `${kickerBase} · Player ${two.turn}` : two ? `${kickerBase} · 2 players` : kickerBase;
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
            onSkipLevel={skipLevel}
          />
        )}
        {view.stage === 'puzzle' && !(view.run.kind === 'level' && view.run.listen) && (
          <PuzzleScreen
            key={view.key}
            kicker={kicker}
            prompt={info.prompt}
            phrase={info.phrase}
            initialOrder={info.initialOrder}
            songTitle={info.track.title}
            meaning={info.meaning}
            song={info.song}
            hintMode={info.hintMode}
            timeLimit={info.timeLimit}
            paused={splash !== null || rulesOpen}
            onSolved={({ timedOut, ms }) => onPuzzleDone(timedOut, ms)}
            onSkipSong={view.run.kind === 'level' && view.run.songs ? skipSong : undefined}
            onSkipLevel={view.run.kind === 'level' ? skipLevel : undefined}
          />
        )}
        {view.stage === 'handover' && two?.first && (
          <HandoverScreen
            key={view.key}
            result={two.first.timedOut ? 'Player 1 ran out of time on theirs.' : `Player 1 solved theirs in about ${Math.max(1, Math.round(two.first.ms / 1000))} seconds.`}
            onReady={startSecondTurn}
          />
        )}
        {view.stage === 'invite' && (
          <InviteScreen
            track={info.track}
            phrase={info.phrase}
            timedOut={view.timedOut}
            songNote={
              (two?.note ? `${two.note} ` : '') + (info.song
                ? info.audio
                  ? `That was ${info.song.title}. The dance plays the song's recording, with no video. If the file cannot load, the official video or the game's own music is used.`
                  : info.video
                  ? `That was ${info.song.title}. The dance plays the official video through YouTube (${info.video.credit}), so it needs internet. If it cannot play, the game's own music is used.`
                  : `That was ${info.song.title}. The dance uses our own original track, ${info.track.title}, because the recording of the film song is not included in this game.`
                : '')
            }
            seated={store.seated}
            onSeated={(seated) => setStore((s) => ({ ...s, seated }))}
            camera={levelNo === 2 && !two ? { on: cameraOn, onChange: setCameraOn } : undefined}
            onAccept={() => startDance(info.track, info.video, info.audio)}
            onSkip={() => finishRun(true)}
          />
        )}
        {view.stage === 'dance' && (
          <DanceScreen
            key={view.key}
            track={info.track}
            kicker={kicker}
            players={two ? 2 : 1}
            camera={cameraOn && levelNo === 2 && !two}
            seated={store.seated}
            externalPause={rulesOpen}
            volume={store.volume}
            muted={store.muted}
            onVolume={setVolume}
            onMuted={setMuted}
            video={info.video}
            audioFile={info.audio}
            songTitle={info.song?.title}
            onFinish={(score) => finishRun(false, score)}
            onSkip={() => { music.stop(); finishRun(true); }}
            onRestart={() => startDance(info.track, info.video, info.audio)}
          />
        )}
        {view.stage === 'celebrate' && (
          <CelebrateScreen
            kind={view.run.kind === 'level' ? 'level' : view.run.tryout ? 'tryout' : 'challenge'}
            level={levelNo !== null ? { n: levelNo, name: levelByNumber(levelNo).name, total: LEVEL_COUNT } : undefined}
            from={info.from}
            skipped={view.skipped}
            score={view.score}
            hasNext={hasNext}
            songProgress={songNo}
            onNextSong={songNo && songNo.index + 1 < songNo.total ? () => startSong(songNo.index + 1) : undefined}
            onNext={() => startLevel((levelNo ?? 0) + 1)}
            onAgain={() => startDance(info.track, info.video, info.audio)}
            onMake={() => { music.stop(); navigate({ name: 'create' }); }}
            onLevels={() => (view.run.kind === 'level' ? startLevel(1) : resumeLevel())}
            onBackToCreate={() => navigate({ name: 'create' })}
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
          <div className="topbar-left">
            {canBack && (
              <button type="button" className="nav-btn" onClick={goBack} data-testid="back" aria-label="Back to the previous step">
                <Icon name="left" size={18} /> <span>Back</span>
              </button>
            )}
            <button type="button" className="wordmark-small" onClick={goTitle} data-testid="home" aria-label="RHYTHM RUSH, back to the title screen">
              RHYTHM <span>RUSH</span>
            </button>
          </div>
        ) : (
          <span />
        )}
        <nav className="topnav" aria-label="Main">
          {view.name !== 'create' && (
            <button type="button" className="nav-btn" onClick={() => { music.stop(); navigate({ name: 'create' }); }} data-testid="nav-make">
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
