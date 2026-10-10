import type { PoseLandmarker } from '@mediapipe/tasks-vision';

/**
 * The body tracker. It runs entirely in the player's browser: the tracking code, its model and its WebAssembly all come from
 * this game's own files (public/mediapipe/), so no camera picture ever leaves the device and no outside service is called.
 * It is loaded only when the player chooses to use the camera.
 */
export async function createTracker(): Promise<PoseLandmarker> {
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
  const base = import.meta.env.BASE_URL;
  const fileset = await FilesetResolver.forVisionTasks(`${base}mediapipe/wasm`);
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: `${base}mediapipe/pose_landmarker_lite.task`, delegate },
    runningMode: 'VIDEO' as const,
    numPoses: 1,
  });
  try {
    return await PoseLandmarker.createFromOptions(fileset, options('GPU'));
  } catch {
    return PoseLandmarker.createFromOptions(fileset, options('CPU'));
  }
}

/** Ask for the front camera, with no sound. Rejects if the player says no or there is no camera. */
export function openCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) return Promise.reject(new Error('no-camera-api'));
  return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
}
