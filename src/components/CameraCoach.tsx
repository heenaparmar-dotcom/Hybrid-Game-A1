import { useEffect, useRef, useState } from 'react';
import type { Track } from '../data/tracks';
import { createTracker, openCamera } from '../lib/poseTracker';
import { SKELETON, type Landmark, type ScoreKeeper } from '../lib/poseScore';

export type CameraStatus = 'starting' | 'on' | 'denied' | 'unavailable';

interface Props {
  track: Track;
  keeper: ScoreKeeper;
  /** The dance's current beat (negative during the count-in). */
  getBeat: () => number;
  /** False while paused or finished: nothing is scored. */
  running: boolean;
  onStatus: (s: CameraStatus) => void;
}

const DETECT_EVERY_MS = 100;

/**
 * A small mirror-view of the player with their body traced on top, so they can see what the camera sees.
 * The picture is only shown on this screen: it is never recorded, saved or sent anywhere.
 */
export function CameraCoach({ keeper, getBeat, running, onStatus }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<CameraStatus>('starting');
  const [inView, setInView] = useState(false);
  const runningRef = useRef(running);
  runningRef.current = running;
  const getBeatRef = useRef(getBeat);
  getBeatRef.current = getBeat;
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  useEffect(() => {
    let alive = true;
    let stream: MediaStream | null = null;
    let timer: number | null = null;
    let tracker: Awaited<ReturnType<typeof createTracker>> | null = null;
    const report = (s: CameraStatus) => {
      if (!alive) return;
      setStatus(s);
      statusRef.current(s);
    };

    (async () => {
      try {
        stream = await openCamera();
      } catch (e) {
        report(e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'SecurityError') ? 'denied' : 'unavailable');
        return;
      }
      if (!alive) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
        tracker = await createTracker();
      } catch {
        report('unavailable');
        return;
      }
      if (!alive) return;
      report('on');
      let lastSeen = false;
      timer = window.setInterval(() => {
        if (!tracker || video.readyState < 2 || video.videoWidth === 0) return;
        let lm: Landmark[] | null = null;
        try {
          lm = tracker.detectForVideo(video, performance.now()).landmarks[0] ?? null;
        } catch {
          return;
        }
        const seen = lm !== null;
        if (seen !== lastSeen) {
          lastSeen = seen;
          setInView(seen);
        }
        draw(canvasRef.current, video, lm);
        const beat = getBeatRef.current();
        if (runningRef.current && beat >= 0) keeper.add(lm, beat, video.videoWidth / video.videoHeight);
      }, DETECT_EVERY_MS);
    })();

    return () => {
      alive = false;
      if (timer !== null) window.clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop()); // the camera light goes off as soon as the dance screen closes
      try {
        tracker?.close();
      } catch {
        /* already closed */
      }
    };
    // the camera lives exactly as long as this component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="camera-coach" data-testid="camera-coach" data-camera-status={status} data-in-view={inView ? 'yes' : 'no'}>
      <div className="camera-frame" hidden={status !== 'on' && status !== 'starting'}>
        <video ref={videoRef} muted playsInline aria-label="Your camera, shown as a mirror" />
        <canvas ref={canvasRef} aria-hidden="true" />
      </div>
      <p className="fine center-text" role="status" data-testid="camera-note">
        {status === 'starting' && 'Starting the camera…'}
        {status === 'on' && (inView ? 'Camera on: we can see you. Nothing is recorded.' : 'Camera on, but we cannot see you yet. Step back so your whole body is in view.')}
        {status === 'denied' && 'The camera was not allowed, so there will be no points. The dance works the same without it.'}
        {status === 'unavailable' && 'The camera could not start on this device, so there will be no points. The dance works the same without it.'}
      </p>
    </div>
  );
}

/** Draw the body trace on top of the (mirrored) camera picture. */
function draw(canvas: HTMLCanvasElement | null, video: HTMLVideoElement, lm: Landmark[] | null) {
  if (!canvas) return;
  if (canvas.width !== video.videoWidth) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!lm) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.lineWidth = Math.max(3, w / 140);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#c9f35a';
  ctx.fillStyle = '#ff5d4d';
  for (const [a, b] of SKELETON) {
    const p = lm[a];
    const q = lm[b];
    if ((p.visibility ?? 1) < 0.5 || (q.visibility ?? 1) < 0.5) continue;
    ctx.beginPath();
    ctx.moveTo(p.x * w, p.y * h);
    ctx.lineTo(q.x * w, q.y * h);
    ctx.stroke();
  }
  for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    const p = lm[i];
    if ((p.visibility ?? 1) < 0.5) continue;
    ctx.beginPath();
    ctx.arc(p.x * w, p.y * h, Math.max(4, w / 110), 0, Math.PI * 2);
    ctx.fill();
  }
}
