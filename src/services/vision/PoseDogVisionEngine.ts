import { classifyQuadrupedPosture } from '../../domain/vision/QuadrupedPose';
import type { CameraFrame } from '../camera/CameraFrameSource';
import type { DogVisionEngine, DogVisionResult } from './DogVisionEngine';
import type { QuadrupedPoseModel } from './QuadrupedPoseModel';

export class PoseDogVisionEngine implements DogVisionEngine {
  constructor(private readonly model: QuadrupedPoseModel) {}

  warmup(): Promise<void> {
    return this.model.warmup();
  }

  async detect(frame: CameraFrame): Promise<DogVisionResult> {
    const inference = await this.model.infer(frame);
    if (!inference.dogDetected || !inference.pose) {
      return {
        frameId: frame.id,
        analysedAt: new Date().toISOString(),
        dogDetected: inference.dogDetected,
        detectionConfidence: inference.detectionConfidence,
        posture: 'unknown',
        postureConfidence: null,
        stressSignal: 'uncertain',
        stressConfidence: null,
      };
    }

    const posture = classifyQuadrupedPosture(inference.pose);
    return {
      frameId: frame.id,
      analysedAt: new Date().toISOString(),
      dogDetected: true,
      detectionConfidence: inference.detectionConfidence,
      posture: posture.posture,
      postureConfidence: posture.confidence,
      // Pose alone is not sufficient evidence for emotional state. Keep stress
      // fail-closed until a separately validated temporal/behaviour model exists.
      stressSignal: 'uncertain',
      stressConfidence: null,
    };
  }

  dispose(): Promise<void> {
    return this.model.dispose();
  }
}
