/** Original text + SVG logo: a four-bar equaliser beside the wordmark. */
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`logo logo-${size}`} aria-label="RHYTHM RUSH">
      <svg className="logo-bars" viewBox="0 0 48 40" aria-hidden="true">
        <rect className="bar b1" x="2" y="12" width="8" height="16" rx="4" />
        <rect className="bar b2" x="14" y="2" width="8" height="36" rx="4" />
        <rect className="bar b3" x="26" y="8" width="8" height="24" rx="4" />
        <rect className="bar b4" x="38" y="14" width="8" height="12" rx="4" />
      </svg>
      <span className="logo-word" aria-hidden="true">
        <span className="logo-a">RHYTHM</span>
        <span className="logo-b">RUSH</span>
      </span>
    </span>
  );
}
