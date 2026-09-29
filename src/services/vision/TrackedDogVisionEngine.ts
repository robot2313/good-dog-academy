import type { CameraFrame } from '../camera/CameraFrameSource';
import { DogTracker } from '../../domain/vision/DogTracking';
import type { DogVisionEngine, DogVisionResult } from './DogVisionEngine';

export class TrackedDogVisionEngine implements DogVisionEngine {
  private readonly tracker = new DogTracker();

  constructor(private readonly source: DogVisionEngine) {}

  warmup(): Promise<void> {
    return this.source.warmup();
  }

  async detect(frame: CameraFrame): Promise<DogVisionResult> {
    const raw = await this.source.detect(frame);
    const nowMs = Date.now();
    const tracking = this.tracker.update(
      raw.dogDetected && raw.dogBoundingBox
        ? {
            box: raw.dogBoundingBox,
            confidence: raw.detectionConfidence ?? 0,
            source: raw.detectionSource ?? 'pose_heuristic',
          }
        : null,
      nowMs,
    );

    return {
      ...raw,
      dogDetected: tracking.state !== 'lost' && tracking.state !== 'searching',
      dogBoundingBox: tracking.box,
      detectionSource: tracking.source,
      trackingConfidence: tracking.trackingConfidence,
    };
  }

  resetTracking(): void {
    this.tracker.reset();
  }

  async dispose(): Promise<void> {
    this.tracker.reset();
    await this.source.dispose();
  }
}
