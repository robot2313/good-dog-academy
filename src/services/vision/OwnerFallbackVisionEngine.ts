import type { CameraFrame } from '../camera/CameraFrameSource';
import type { DogVisionEngine, DogVisionResult } from './DogVisionEngine';

/**
 * Safe temporary adapter used while the production dog-vision model is not yet connected.
 * It deliberately returns no automatic detection so the Camera Coach must ask the owner.
 */
export class OwnerFallbackVisionEngine implements DogVisionEngine {
  async warmup(): Promise<void> {}

  async detect(frame: CameraFrame): Promise<DogVisionResult> {
    return {
      frameId: frame.id,
      analysedAt: new Date().toISOString(),
      dogDetected: false,
      detectionConfidence: null,
      posture: 'unknown',
      postureConfidence: null,
      stressSignal: 'uncertain',
      stressConfidence: null,
    };
  }

  async dispose(): Promise<void> {}
}
