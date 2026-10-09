export type Step = 'puzzle' | 'music' | 'dance';

const STEPS: { id: Step; label: string; kind: 'Digital' | 'Physical' }[] = [
  { id: 'puzzle', label: 'Solve', kind: 'Digital' },
  { id: 'music', label: 'Listen', kind: 'Digital' },
  { id: 'dance', label: 'Move', kind: 'Physical' },
];

/** Shows where the player is in the turn and which parts are digital vs physical. */
export function StepTrack({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <ol className="steps" aria-label="Turn progress">
      {STEPS.map((s, i) => (
        <li key={s.id} className={`step ${i === idx ? 'is-current' : ''} ${i < idx ? 'is-done' : ''} kind-${s.kind.toLowerCase()}`} aria-current={i === idx ? 'step' : undefined}>
          <span className="step-num">{i + 1}</span>
          <span className="step-label">{s.label}</span>
          <span className="step-kind">{s.kind}</span>
        </li>
      ))}
    </ol>
  );
}
