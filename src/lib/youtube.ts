/**
 * Thin wrapper around YouTube's official IFrame Player API. No API key is needed to play an embeddable video.
 * The video is shown on screen (YouTube requires the player to stay visible) and is never downloaded or copied.
 */
export interface YtPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  getCurrentTime(): number;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  destroy(): void;
}

interface YtEvent {
  data: number;
  target: YtPlayer;
}

interface YtNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      width: number;
      height: number;
      videoId: string;
      host?: string;
      playerVars?: Record<string, string | number>;
      events?: { onReady?: (e: YtEvent) => void; onStateChange?: (e: YtEvent) => void; onError?: (e: YtEvent) => void };
    },
  ) => YtPlayer;
}

type YtWindow = Window & { YT?: YtNamespace; onYouTubeIframeAPIReady?: () => void };

/** Player state numbers from the YouTube API. */
export const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3 } as const;

let apiPromise: Promise<YtNamespace> | null = null;

/** Load YouTube's player script once. Rejects if the script is blocked, offline, or too slow. */
export function loadYouTubeApi(timeoutMs = 8000): Promise<YtNamespace> {
  const w = window as YtWindow;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YtNamespace>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      apiPromise = null;
      reject(new Error('YouTube player timed out'));
    }, timeoutMs);
    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      previous?.();
      window.clearTimeout(timer);
      if (w.YT?.Player) resolve(w.YT);
      else {
        apiPromise = null;
        reject(new Error('YouTube player missing'));
      }
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      window.clearTimeout(timer);
      apiPromise = null;
      reject(new Error('YouTube player blocked'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

export interface VideoOptions {
  id: string;
  /** Second of the video where playback starts. */
  start?: number;
  onState: (state: number) => void;
  onError: (code: number) => void;
}

/**
 * Create a visible player inside `container` and start it (call this from a click so autoplay is allowed).
 * `cancelled()` lets the caller say "never mind" while the script is still loading, so no stray player is created.
 */
export async function createVideoPlayer(container: HTMLElement, options: VideoOptions, cancelled: () => boolean): Promise<YtPlayer> {
  const YT = await loadYouTubeApi();
  if (cancelled()) throw new Error('cancelled');
  const host = document.createElement('div');
  container.appendChild(host);
  return new Promise<YtPlayer>((resolve, reject) => {
    try {
      const player = new YT.Player(host, {
        width: 356,
        height: 200,
        videoId: options.id,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, start: Math.max(0, Math.floor(options.start ?? 0)), playsinline: 1, rel: 0, modestbranding: 1, controls: 1, origin: window.location.origin },
        events: {
          onReady: (e) => {
            resolve(e.target);
            e.target.playVideo();
          },
          onStateChange: (e) => options.onState(e.data),
          onError: (e) => options.onError(e.data),
        },
      });
      void player;
    } catch (err) {
      reject(err);
    }
  });
}
