import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './components/Icon';
import { LevelBar } from './components/LevelBar';
import { Modal } from './components/Modal';
import { RuleBook } from './components/RuleBook';
import { LEVEL_COUNT, levelByNumber } from './data/levels';
import { trackById, type Track } from './data/tracks';
import { music } from './lib/audio';
import { CHALLENGE_PARAM, parseChallengeInput, type ChallengeData } from './lib/challenge';
import { loadStore, saveStore, type Store } from './lib/storage';
import { prefersReducedMotion } from './lib/useBeat';
import { CelebrateScreen } from './screens/CelebrateScreen';
import { ChallengeScreen, type Incoming } from './screens/ChallengeScreen';
import { CreateScreen } from './screens/CreateScreen';
import { DanceScreen } from './screens/DanceScreen';
import { InviteScreen } from './screens/InviteScreen';
import { PuzzleScreen } from './screens/PuzzleScreen';
import { TitleScreen } from './screens/TitleScreen';

type Run = { kind: 'level'; level: number } | { kind: 'challenge'; data: ChallengeData; tryout: boolean };
type Stage = 'puzzle' | 'invite' | 'dance' | 'celebrate';
type View =
  | { name: 'title' }
  | { name: 'play'; run: Run; stage: Stage; key: number; skipped: boolean }
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
    return {
      phrase: level.phrase,
      track: trackById(level.trackId),
      kicker: `Level ${level.n} · ${level.name}`,
      prompt: level.prompt,
      meaning: level.meaning,
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
    setView({ name: 'play', run: { kind: 'level', level: level.n }, stage: 'puzzle', key: newKey(), skipped: false });
  };
  const resumeLevel = () => startLevel(store.completed >= LEVEL_COUNT ? 1 : store.completed + 1);

  const startChallenge = (data: ChallengeData, tryout: boolean) => {
    music.stop();
    setSplash(tryout ? 'Your puzzle|Try it first' : data.from ? `${data.from}'s puzzle|A friend challenged you` : "A friend's puzzle|You have been challenged");
    setView({ name: 'play', run: { kind: 'challenge', data, tryout }, stage: 'puzzle', key: newKey(), skipped: false });
  };

  const toStage = (stage: Stage, skipped = false) => setView((v) => (v.name === 'play' ? { ...v, stage, skipped } : v));

  /** Called from a click, so the audio context is allowed to start. */
  const startDance = (track: Track) => {
    void music.start(track.id);
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
        {view.stage === 'puzzle' && (
          <PuzzleScreen
            key={view.key}
            kicker={info.kicker}
            prompt={info.prompt}
            phrase={info.phrase}
            initialOrder={info.initialOrder}
            songTitle={info.track.title}
            meaning={info.meaning}
            onSolved={() => toStage('invite')}
          />
        )}
        {view.stage === 'invite' && (
          <InviteScreen
            track={info.track}
            phrase={info.phrase}
            seated={store.seated}
            onSeated={(seated) => setStore((s) => ({ ...s, seated }))}
            onAccept={() => startDance(info.track)}
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
            onFinish={() => finishRun(false)}
            onSkip={() => { music.stop(); finishRun(true); }}
            onRestart={() => startDance(info.track)}
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
            onAgain={() => startDance(info.track)}
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
