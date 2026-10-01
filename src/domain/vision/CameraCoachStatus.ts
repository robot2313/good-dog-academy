import type { SmartFramingResult } from './SmartFraming';

export type CameraCoachVisionStatus = {
  dogDetected: boolean;
  posture: string;
  postureConfidence: number | null;
};

export function liveVisionStatus(
  vision: CameraCoachVisionStatus | null,
  framing: SmartFramingResult | null,
): string {
  if (!vision) return 'Watching for your dog…';
  if (!vision.dogDetected) return 'Looking for your dog';

  if (!framing || !framing.ready) {
    return 'Dog detected';
  }

  if (vision.posture === 'sit_like') return 'Sit detected';
  if (vision.posture === 'stand_like') return 'Stand detected';
  if (vision.posture === 'down_like') return 'Down detected';

  return 'Dog in position';
}
