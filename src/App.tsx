import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './components/Icon';
import { Logo } from './components/Logo';
import { Modal } from './components/Modal';
import { RuleBook } from './components/RuleBook';
import { TurnBar } from './components/TurnBar';
import type { ThemeId } from './data/phrases';
import { unlockedThemeIds } from './data/themes';
import { music } from './lib/audio';
import { CHALLENGE_PARAM, parseChallengeInput } from './lib/challenge';
import { advanceTurn, commitTurn, isRoundComplete, startNextRound, startSession, turnKey } from './lib/session';
import { defaultStore, loadStore, saveStore, type Store } from './lib/storage';
import type { Mode, PuzzleDraft, ScreenId, Session } from './lib/types';
import { ChallengeScreen, type Incoming } from './screens/ChallengeScreen';
import { CreateScreen } from './screens/CreateScreen';
import { DanceScreen } from './screens/DanceScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MusicScreen } from './screens/MusicScreen';
import { PuzzleScreen } from './screens/PuzzleScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SetupScreen } from './screens/SetupScreen';
import { ThemeScreen } from './screens/ThemeScreen';

function readIncoming(): Incoming {
  const hash = window.location.hash;
  if (!hash.includes(`${CHALLENGE_PARAM}=`)) return { kind: 'none' };
  const res = parseChallengeInput(hash);
  return res.ok ? { kind: 'ok', data: res.value } : { kind: 'error', message: res.error };
}

const PLAY_SCREENS: ScreenId[] = ['puzzle', 'music', 'dance'];

export default function App() {
  const [store, setStore] = useState<Store>(() => loadStore());
  const [incoming, setIncoming] = useState<Incoming>(() => readIncoming());
  const [screen, setScreen] = useState<ScreenId>(() => (readIncoming().kind === 'none' ? 'home' : 'challenge'));
  const [mode, setMode] = useState<Mode>('duo');
  const [themeId, setThemeId] = useState<ThemeId>('fresh');
  const [session, setSession] = useState<Session | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<ScreenId | null>(null);
  const committed = useRef(new Set<string>());
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => saveStore(store), [store]);
  useEffect(() => {
    music.setVolume(store.settings.volume);
    music.setMuted(store.settings.muted);
  }, [store.settings.volume, store.settings.muted]);
  useEffect(() => {
    const onHash = () => {
      const inc = readIncoming();
      setIncoming(inc);
      if (inc.kind !== 'none') {
        music.stop();
        setSession(null);
        setScreen('challenge');
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  // Move focus to the page content on navigation (keyboard and screen-reader friendly).
  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [screen]);

  const setSettings = useCallback((patch: Partial<Store['settings']>) => setStore((s) => ({ ...s, settings: { ...s.settings, ...patch } })), []);

  const activeTheme: ThemeId = session?.themeId ?? themeId;
  const successful = store.progress.successfulRounds;
  const paused = rulesOpen || leaveTarget !== null;

  const goHome = () => {
    music.stop();
    setSession(null);
    setLeaveTarget(null);
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setIncoming({ kind: 'none' });
    setScreen('home');
  };
  const nav = (s: ScreenId) => {
    music.stop();
    setScreen(s);
  };
  /** Leaving mid-turn asks first, because the unfinished turn is lost. */
  const requestLeave = (target: ScreenId) => {
    if (PLAY_SCREENS.includes(screen)) setLeaveTarget(target);
    else if (target === 'home') goHome();
    else nav(target);
  };
  const confirmLeave = () => {
    const target = leaveTarget ?? 'home';
    setLeaveTarget(null);
    if (target === 'home') goHome();
    else {
      setSession(null);
      nav(target);
    }
  };

  const beginSolo = (text: string, from?: string) => {
    const theme = unlockedThemeIds(successful).includes(themeId) ? themeId : 'fresh';
    setSession(startSession('solo', [store.settings.names[0]], theme, { text, from }));
    setScreen('puzzle');
  };

  const onPuzzleDone = (draft: PuzzleDraft) => {
    setSession((s) => (s ? { ...s, draft } : s));
    setScreen('music');
  };
  const onMusicDone = (listenMs: number) => {
    setSession((s) => (s ? { ...s, listenMs } : s));
    setScreen('dance');
  };
  const onDanceDone = (res: { completed: boolean; moveMs: number; seated: boolean }) => {
    if (!session) return;
    const key = turnKey(session);
    if (committed.current.has(key)) return; // a turn can only be scored once
    committed.current.add(key);
    const out = commitTurn(session, store, { moveCompleted: res.completed, seated: res.seated, moveMs: res.moveMs });
    setStore(out.store);
    if (isRoundComplete(out.session)) {
      setSession(out.session);
      setScreen('results');
    } else {
      setSession(advanceTurn(out.session));
      setScreen('puzzle');
    }
  };

  const content = () => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            onStartDuo={() => { setMode('duo'); setScreen('setup'); }}
            onStartSolo={() => { setMode('solo'); setScreen('setup'); }}
            onNav={nav}
            onRules={() => setRulesOpen(true)}
          />
        );
      case 'setup':
        return (
          <SetupScreen
            mode={mode}
            names={store.settings.names}
            onChangeMode={setMode}
            onBack={() => setScreen('home')}
            onContinue={(names) => { setSettings({ names }); setScreen('themes'); }}
          />
        );
      case 'themes':
        return (
          <ThemeScreen
            successfulRounds={successful}
            selected={unlockedThemeIds(successful).includes(themeId) ? themeId : 'fresh'}
            onSelect={setThemeId}
            onBack={() => setScreen(session ? 'results' : 'setup')}
            onStart={() => {
              const names = mode === 'duo' ? [...store.settings.names] : [store.settings.names[0]];
              setSession(startSession(mode, names, themeId));
              setScreen('puzzle');
            }}
          />
        );
      case 'puzzle':
        return session && (
          <>
            <TurnBar session={session} step="puzzle" />
            <PuzzleScreen key={turnKey(session)} phrase={session.phrase.text} playerName={session.names[session.turnInRound]} puzzleSeconds={store.settings.puzzleSeconds} paused={paused} onDone={onPuzzleDone} />
          </>
        );
      case 'music':
        return session && (
          <>
            <TurnBar session={session} step="music" />
            <MusicScreen key={turnKey(session)} phrase={session.phrase.text} custom={session.phrase.custom} from={session.phrase.from} themeId={session.themeId} volume={store.settings.volume} muted={store.settings.muted} paused={paused} onVolume={(v) => setSettings({ volume: v })} onMuted={(m) => setSettings({ muted: m })} onDone={onMusicDone} />
          </>
        );
      case 'dance':
        return session && (
          <>
            <TurnBar session={session} step="dance" />
            <DanceScreen key={turnKey(session)} themeId={session.themeId} moveSeconds={store.settings.moveSeconds} animatedGuide={store.settings.animatedGuide} volume={store.settings.volume} muted={store.settings.muted} paused={paused} onVolume={(v) => setSettings({ volume: v })} onMuted={(m) => setSettings({ muted: m })} onDone={onDanceDone} />
          </>
        );
      case 'results':
        return session && (
          <ResultsScreen
            session={session}
            successfulRounds={successful}
            onNext={() => { setSession(startNextRound(session)); setScreen('puzzle'); }}
            onReplay={() => { setSession(startSession(session.mode, session.names, session.themeId, session.phrase.custom ? { text: session.phrase.text, from: session.phrase.from } : undefined)); setScreen('puzzle'); }}
            onThemes={() => { setMode(session.mode); setScreen('themes'); }}
            onChallenge={() => nav('create')}
            onHome={goHome}
          />
        );
      case 'create':
        return <CreateScreen onTry={beginSolo} onBack={() => setScreen(session ? 'results' : 'home')} />;
      case 'challenge':
        return (
          <ChallengeScreen
            incoming={incoming}
            onLoad={(data) => setIncoming({ kind: 'ok', data })}
            onPlay={() => incoming.kind === 'ok' && beginSolo(incoming.data.phrase, incoming.data.from)}
            onCreate={() => setScreen('create')}
            onBack={goHome}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            store={store}
            onChange={setStore}
            onReset={() => setStore((s) => ({ ...s, progress: defaultStore().progress, scores: defaultStore().scores, timingLog: [] }))}
            onBack={() => setScreen('home')}
          />
        );
    }
  };

  return (
    <div className="app" data-theme={activeTheme}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>Skip to content</a>
      <header className="topbar">
        <button className="logo-btn" onClick={() => requestLeave('home')} aria-label="RHYTHM RUSH home" data-testid="logo-home"><Logo size="sm" /></button>
        <nav className="topnav" aria-label="Main">
          {screen !== 'home' && <button className="btn btn-ghost" onClick={() => requestLeave('home')} data-testid="nav-home"><Icon name="home" /><span className="nav-text">Home</span></button>}
          <button className="btn btn-ghost" onClick={() => setRulesOpen(true)} data-testid="nav-rules"><Icon name="book" /><span className="nav-text">Rule Book</span></button>
          <button className="btn btn-ghost" onClick={() => requestLeave('settings')} data-testid="nav-settings"><Icon name="gear" /><span className="nav-text">Settings</span></button>
        </nav>
      </header>

      <main id="main" ref={mainRef} tabIndex={-1} className="main" data-screen={screen}>
        {content()}
      </main>

      <footer className="footer">
        <p>Original demo content and generated music. A game for fun, not a medical treatment. Move gently and stop if anything hurts.</p>
      </footer>

      {rulesOpen && (
        <Modal title="Rule Book" onClose={() => setRulesOpen(false)} wide>
          <RuleBook />
        </Modal>
      )}
      {leaveTarget && (
        <Modal title="Leave this round?" onClose={() => setLeaveTarget(null)}>
          <p>Your progress in this round will be lost. Saved settings, unlocks and best scores are kept.</p>
          <div className="row">
            <button className="btn btn-primary" onClick={() => setLeaveTarget(null)}>Keep playing</button>
            <button className="btn" onClick={confirmLeave} data-testid="confirm-leave">Leave round</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
