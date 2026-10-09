interface Props {
  moveId: string;
  seated: boolean;
  /** Whether the guide animation is playing. */
  animate: boolean;
  /** Seconds per beat (60 / bpm). */
  beat: number;
  label: string;
}

/** Original abstract silhouette built from SVG shapes and animated with CSS. No external assets. */
export function DanceFigure({ moveId, seated, animate, beat, label }: Props) {
  return (
    <svg viewBox="0 0 200 270" className={`fig m-${moveId} ${seated ? 'seated' : ''} ${animate ? 'run' : 'still'}`} style={{ ['--beat' as string]: `${beat}s` }} role="img" aria-label={label}>
      {seated && (
        <g className="chair">
          <rect x="62" y="156" width="76" height="12" rx="6" />
          <rect x="66" y="168" width="8" height="70" rx="4" />
          <rect x="126" y="168" width="8" height="70" rx="4" />
        </g>
      )}
      <g className="body">
        <g className="head-g">
          <circle className="head" cx="100" cy="42" r="22" />
        </g>
        <g className="torso-g">
          <line className="torso" x1="100" y1="72" x2="100" y2="150" />
          <g className="armL limb">
            <line x1="86" y1="86" x2="70" y2="128" />
            <g className="foreL limb">
              <line x1="70" y1="128" x2="66" y2="168" />
            </g>
          </g>
          <g className="armR limb">
            <line x1="114" y1="86" x2="130" y2="128" />
            <g className="foreR limb">
              <line x1="130" y1="128" x2="134" y2="168" />
            </g>
          </g>
        </g>
        <g className="legL limb">
          <line x1="92" y1="152" x2={seated ? 80 : 86} y2={seated ? 196 : 208} />
          <g className="shinL limb">
            <line x1={seated ? 80 : 86} y1={seated ? 196 : 208} x2={seated ? 78 : 84} y2={seated ? 244 : 256} />
          </g>
        </g>
        <g className="legR limb">
          <line x1="108" y1="152" x2={seated ? 120 : 114} y2={seated ? 196 : 208} />
          <g className="shinR limb">
            <line x1={seated ? 120 : 114} y1={seated ? 196 : 208} x2={seated ? 122 : 116} y2={seated ? 244 : 256} />
          </g>
        </g>
      </g>
    </svg>
  );
}
