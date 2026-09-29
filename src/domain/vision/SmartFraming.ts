import type { NormalizedDogBox } from './DogTracking';

export type SmartFramingStatus =
  | 'waiting'
  | 'good'
  | 'move-camera-left'
  | 'move-camera-right'
  | 'move-camera-up'
  | 'move-camera-down'
  | 'move-camera-back'
  | 'move-camera-closer'
  | 'dog-not-in-view';

export type SmartFramingResult = {
  status: SmartFramingStatus;
  instruction: string;
  ready: boolean;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export function analyseSmartFraming(
  box: NormalizedDogBox | null,
  trackingConfidence: number,
): SmartFramingResult {
  if (!box || trackingConfidence < 0.35) {
    return {
      status: 'dog-not-in-view',
      instruction: 'Keep your dog in view.',
      ready: false,
    };
  }

  const right = box.left + box.width;
  const bottom = box.top + box.height;
  const centerX = box.left + box.width / 2;
  const centerY = box.top + box.height / 2;
  const area = box.width * box.height;

  // Inner safe region provides hysteresis against tiny movements around the
  // visible guide edges. The tracker itself supplies the temporal smoothing.
  if (leftOutside(box)) return { status: 'move-camera-right', instruction: 'Move the camera right.', ready: false };
  if (right > 0.94) return { status: 'move-camera-left', instruction: 'Move the camera left.', ready: false };
  if (box.top < 0.05) return { status: 'move-camera-down', instruction: 'Move the camera down.', ready: false };
  if (bottom > 0.94) return { status: 'move-camera-up', instruction: 'Move the camera up.', ready: false };

  if (area > 0.58 || box.width > 0.82 || box.height > 0.82) {
    return { status: 'move-camera-back', instruction: 'Move the camera back.', ready: false };
  }

  if (area < 0.07 || box.width < 0.22 || box.height < 0.22) {
    return { status: 'move-camera-closer', instruction: 'Move the camera closer.', ready: false };
  }

  if (centerX < 0.30) return { status: 'move-camera-right', instruction: 'Move the camera right.', ready: false };
  if (centerX > 0.70) return { status: 'move-camera-left', instruction: 'Move the camera left.', ready: false };
  if (centerY < 0.27) return { status: 'move-camera-down', instruction: 'Move the camera down.', ready: false };
  if (centerY > 0.73) return { status: 'move-camera-up', instruction: 'Move the camera up.', ready: false };

  return { status: 'good', instruction: 'Good — your dog is ready.', ready: true };
}

function leftOutside(box: NormalizedDogBox): boolean {
  return clamp01(box.left) < 0.06;
}
