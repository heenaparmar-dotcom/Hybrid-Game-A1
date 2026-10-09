import { useState } from 'react';
import { challengeMessage } from '../lib/challenge';
import { Icon } from './Icon';

interface Props {
  url: string;
  from?: string;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

/** Copy link / copy message / native share. Never pretends anything was posted: the player chooses where to send it. */
export function SharePanel({ url, from }: Props) {
  const [status, setStatus] = useState('');
  const message = challengeMessage(url, from);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

  const copy = async (text: string, what: string) => {
    const ok = await copyText(text);
    setStatus(ok ? `${what} copied. Paste it into any chat app you like.` : `Could not copy automatically. Select the text and copy it yourself.`);
  };

  const share = async () => {
    try {
      await navigator.share({ title: 'RHYTHM RUSH challenge', text: 'Can you unscramble my song line and do the moves?', url });
      setStatus('Share sheet opened. Only you choose who receives it.');
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') setStatus('Sharing is not available here. Use Copy link instead.');
    }
  };

  return (
    <div className="share" data-testid="share-panel">
      <label className="field">
        <span className="field-label">Challenge link</span>
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} data-testid="challenge-url" />
      </label>
      <label className="field">
        <span className="field-label">Friendly message</span>
        <textarea readOnly rows={3} value={message} onFocus={(e) => e.currentTarget.select()} data-testid="challenge-message" />
      </label>
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={() => copy(url, 'Link')} data-testid="copy-link">
          <Icon name="link" /> Copy link
        </button>
        <button type="button" className="btn" onClick={() => copy(message, 'Message')} data-testid="copy-message">
          <Icon name="copy" /> Copy message
        </button>
        {canShare && (
          <button type="button" className="btn" onClick={share} data-testid="native-share">
            <Icon name="share" /> Share...
          </button>
        )}
      </div>
      <p className="sr-live" role="status" data-testid="share-status">{status}</p>
      {!canShare && <p className="hint-text">Your browser has no share sheet, so use Copy link or Copy message.</p>}
      <p className={`notice ${isLocal ? 'notice-warn' : ''}`}>
        {isLocal
          ? 'You are running on localhost, so this link only opens on this computer. To let friends play, host the game at a public web address (for example a static site host) and create the link there.'
          : 'Friends open this link in their browser. The game does not post it anywhere; you choose where to send it.'}
      </p>
    </div>
  );
}
