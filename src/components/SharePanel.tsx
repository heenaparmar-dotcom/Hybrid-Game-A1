import { useState } from 'react';
import { challengeMessage, copyText, shareTargets } from '../lib/share';
import { Icon } from './Icon';

interface Props {
  url: string;
  from?: string;
}

/**
 * Copy / share actions for a challenge link.
 * The WhatsApp, Telegram and Email buttons only OPEN those apps with a ready message. The player picks the friend and presses send,
 * so this panel never claims anything has been sent.
 */
export function SharePanel({ url, from }: Props) {
  const [status, setStatus] = useState('');
  const message = challengeMessage(url, from);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

  const copy = async (text: string, what: string) => {
    const ok = await copyText(text);
    setStatus(ok ? `${what} copied. Paste it into any chat.` : 'Could not copy automatically. Select the text and copy it yourself.');
  };

  const share = async () => {
    try {
      await navigator.share({ title: 'RHYTHM RUSH song puzzle', text: 'Put the lyric back in order, then dance to it.', url });
      setStatus('The share sheet opened. You choose who receives it.');
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') setStatus('Sharing is not available here. Use Copy link instead.');
    }
  };

  return (
    <div className="share" data-testid="share-panel">
      <label className="field">
        <span className="field-label">Your challenge link</span>
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} data-testid="challenge-url" />
      </label>
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={() => copy(url, 'Link')} data-testid="copy-link">
          <Icon name="link" /> Copy link
        </button>
        {canShare && (
          <button type="button" className="btn" onClick={share} data-testid="native-share">
            <Icon name="share" /> Share...
          </button>
        )}
        <button type="button" className="btn" onClick={() => copy(message, 'Message')} data-testid="copy-message">
          <Icon name="copy" /> Copy message
        </button>
      </div>
      <div className="row">
        <span className="row-label">Open in:</span>
        {shareTargets(url, from).map((t) => (
          <a key={t.id} className="btn btn-small" href={t.href} target="_blank" rel="noopener noreferrer" data-testid={`share-${t.id}`}>
            <Icon name={t.id === 'email' ? 'mail' : 'send'} size={16} /> {t.label}
          </a>
        ))}
      </div>
      <p className="sr-live" role="status" data-testid="share-status">{status}</p>
      <p className="fine">
        WhatsApp, Telegram and Email only open the app with your message ready. You choose a friend and press send yourself. Nothing is sent until you do.
      </p>
      {isLocal && (
        <p className="notice" data-testid="local-warning">
          You are on <code>localhost</code>, so this link only opens on this computer. Create it from the hosted game for friends to open it.
        </p>
      )}
    </div>
  );
}
