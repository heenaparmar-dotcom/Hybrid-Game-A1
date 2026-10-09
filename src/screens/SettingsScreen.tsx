import { useState } from 'react';
import { AudioControls } from '../components/AudioControls';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';
import { MOVE_PRESETS, PUZZLE_PRESETS, SETTING_LIMITS } from '../lib/constants';
import type { Store } from '../lib/storage';

interface Props {
  store: Store;
  onChange: (s: Store) => void;
  onReset: () => void;
  onBack: () => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(v)));

export function SettingsScreen({ store, onChange, onReset, onBack }: Props) {
  const s = store.settings;
  const [confirm, setConfirm] = useState(false);
  const [copied, setCopied] = useState('');
  const set = (patch: Partial<Store['settings']>) => onChange({ ...store, settings: { ...s, ...patch } });

  const log = store.timingLog;
  const avgShare = log.length
    ? Math.round((log.reduce((n, e) => n + e.moveMs / Math.max(1, e.moveMs + e.puzzleMs + e.listenMs), 0) / log.length) * 100)
    : null;

  const copyCsv = async () => {
    const rows = ['time,puzzle_s,listen_s,move_s,outcome,move_completed,seated', ...log.map((e) => `${e.at},${(e.puzzleMs / 1000).toFixed(1)},${(e.listenMs / 1000).toFixed(1)},${(e.moveMs / 1000).toFixed(1)},${e.outcome},${e.moveCompleted},${e.seated}`)];
    try {
      await navigator.clipboard.writeText(rows.join('\n'));
      setCopied('Timing log copied as CSV.');
    } catch {
      setCopied('Could not copy automatically.');
    }
  };

  return (
    <div className="screen narrow">
      <h1>Settings</h1>

      <div className="card form">
        <h2 className="h3">Puzzle timer</h2>
        <div className="chips" role="radiogroup" aria-label="Puzzle seconds">
          {PUZZLE_PRESETS.map((p) => (
            <button key={p.seconds} role="radio" aria-checked={s.puzzleSeconds === p.seconds} className={`chip-btn ${s.puzzleSeconds === p.seconds ? 'is-on' : ''}`} onClick={() => set({ puzzleSeconds: p.seconds })} data-testid={`puzzle-preset-${p.seconds}`}>{p.label} ({p.seconds} s)</button>
          ))}
        </div>
        <label className="field">
          <span className="field-label">Custom puzzle seconds ({SETTING_LIMITS.puzzleSeconds.min} to {SETTING_LIMITS.puzzleSeconds.max})</span>
          <input type="number" inputMode="numeric" value={s.puzzleSeconds} min={SETTING_LIMITS.puzzleSeconds.min} max={SETTING_LIMITS.puzzleSeconds.max} onChange={(e) => set({ puzzleSeconds: clamp(Number(e.target.value) || SETTING_LIMITS.puzzleSeconds.min, SETTING_LIMITS.puzzleSeconds.min, SETTING_LIMITS.puzzleSeconds.max) })} data-testid="puzzle-seconds" />
        </label>

        <h2 className="h3">Movement length</h2>
        <div className="chips" role="radiogroup" aria-label="Movement seconds">
          {MOVE_PRESETS.map((p) => (
            <button key={p.seconds} role="radio" aria-checked={s.moveSeconds === p.seconds} className={`chip-btn ${s.moveSeconds === p.seconds ? 'is-on' : ''}`} onClick={() => set({ moveSeconds: p.seconds })} data-testid={`move-preset-${p.seconds}`}>{p.label} ({p.seconds} s)</button>
          ))}
        </div>
        <label className="field">
          <span className="field-label">Custom movement seconds ({SETTING_LIMITS.moveSeconds.min} to {SETTING_LIMITS.moveSeconds.max})</span>
          <input type="number" inputMode="numeric" value={s.moveSeconds} min={SETTING_LIMITS.moveSeconds.min} max={SETTING_LIMITS.moveSeconds.max} onChange={(e) => set({ moveSeconds: clamp(Number(e.target.value) || SETTING_LIMITS.moveSeconds.min, SETTING_LIMITS.moveSeconds.min, SETTING_LIMITS.moveSeconds.max) })} data-testid="move-seconds" />
        </label>
        <p className="hint-text">Standard (45 s puzzle, 120 s movement) matches the Rule Book. Quick demo values are handy for classroom demonstrations; use Standard for playtests.</p>

        <h2 className="h3">Display and sound</h2>
        <label className="check">
          <input type="checkbox" checked={s.animatedGuide} onChange={(e) => set({ animatedGuide: e.target.checked })} data-testid="animated-guide" />
          <span>Animated movement guide (turn off for reduced motion; written cues always show)</span>
        </label>
        <AudioControls volume={s.volume} muted={s.muted} onVolume={(v) => set({ volume: v })} onMuted={(m) => set({ muted: m })} />
      </div>

      <div className="card" data-testid="timing-log">
        <h2 className="h3">Playtest timing log</h2>
        <p className="hint-text">Saved only on this device. Records screen time for the puzzle, listening and movement screens of recent turns (last 30). Hand-over and feedback pauses are not included.</p>
        {log.length === 0 ? (
          <p>No turns recorded yet.</p>
        ) : (
          <>
            <p>Average movement share of measured time: <strong>{avgShare}%</strong> across {log.length} turn(s).</p>
            <div className="table-wrap">
              <table className="rb-table">
                <thead><tr><th>Puzzle s</th><th>Listen s</th><th>Move s</th><th>Outcome</th><th>Moved</th></tr></thead>
                <tbody>
                  {log.slice(-8).map((e, i) => (
                    <tr key={i}><td>{(e.puzzleMs / 1000).toFixed(1)}</td><td>{(e.listenMs / 1000).toFixed(1)}</td><td>{(e.moveMs / 1000).toFixed(1)}</td><td>{e.outcome}</td><td>{e.moveCompleted ? (e.seated ? 'seated' : 'yes') : 'no'}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row wrap">
              <button className="btn" onClick={copyCsv}><Icon name="copy" /> Copy as CSV</button>
              <button className="btn btn-ghost" onClick={() => onChange({ ...store, timingLog: [] })}>Clear log</button>
            </div>
            <p className="sr-live" role="status">{copied}</p>
          </>
        )}
      </div>

      <div className="card">
        <h2 className="h3">Progress on this device</h2>
        <p>Song-and-dance turns: <strong>{store.progress.successfulRounds}</strong>. Best solo round: <strong>{store.scores.bestSoloRound}</strong>. Best single turn: <strong>{store.scores.bestTurn}</strong>.</p>
        <button className="btn btn-danger" onClick={() => setConfirm(true)} data-testid="reset-progress">Reset progress and scores</button>
      </div>

      <div className="row"><button className="btn btn-ghost" onClick={onBack}><Icon name="left" /> Back</button></div>

      {confirm && (
        <Modal title="Reset progress?" onClose={() => setConfirm(false)}>
          <p>This clears unlocked themes, best scores and the timing log on this device. Settings and names are kept.</p>
          <div className="row">
            <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => { onReset(); setConfirm(false); }} data-testid="confirm-reset">Reset</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
