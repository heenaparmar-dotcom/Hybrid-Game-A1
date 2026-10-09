/** Builds honest share links. Each one only OPENS the other app with a ready message; the player presses send. */
export interface ShareTarget {
  id: 'whatsapp' | 'telegram' | 'email';
  label: string;
  href: string;
}

export function challengeMessage(url: string, from?: string): string {
  const who = from ? `${from} made` : 'I made';
  return `${who} a song puzzle for you on RHYTHM RUSH! Put the lyric back in order, then dance to it. It is a quick movement break we can both take. ${url}`;
}

export function shareTargets(url: string, from?: string): ShareTarget[] {
  const message = challengeMessage(url, from);
  const enc = encodeURIComponent;
  return [
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${enc(message)}` },
    { id: 'telegram', label: 'Telegram', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(message.replace(url, '').trim())}` },
    { id: 'email', label: 'Email', href: `mailto:?subject=${enc('A song puzzle and a movement break')}&body=${enc(message)}` },
  ];
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
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
