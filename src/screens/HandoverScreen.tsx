import { Icon } from '../components/Icon';

interface Props {
  /** What the player who just finished did, in a few words. */
  result: string;
  onReady: () => void;
}

/** Two players share one device: pass it to Player 2 before their puzzle appears. */
export function HandoverScreen({ result, onReady }: Props) {
  return (
    <section className="screen invite" aria-labelledby="handover-title" data-testid="handover">
      <p className="kicker">Two players</p>
      <h1 id="handover-title" className="invite-title">Player 2, you're up!</h1>
      <p className="sub">{result}</p>
      <p className="fine">Pass the device over. Player 2 gets a different puzzle. When you are both done, you dance together.</p>
      <button type="button" className="btn btn-hero" onClick={onReady} data-testid="handover-start" autoFocus>
        <Icon name="play" size={26} /> I'M READY
      </button>
    </section>
  );
}
