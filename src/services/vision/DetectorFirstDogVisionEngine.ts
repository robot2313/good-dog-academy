import { classifyQuadrupedPosture } from '../../domain/vision/QuadrupedPose';
import type {
  DogDetection,
  DogTrackingResult,
} from '../../domain/vision/DogTracking';
import type { CameraFrame } from '../camera/CameraFrameSource';
import type { DogDetector } from './DogDetector';
import type { DogVisionEngine, DogVisionResult } from './DogVisionEngine';
import type { QuadrupedPoseModel } from './QuadrupedPoseModel';

export class DetectorFirstDogVisionEngine implements DogVisionEngine {
  private lastTracking: DogTrackingResult | null = null;

  constructor(
    private readonly detector: DogDetector,
    private readonly tracker: {
      update: (detections: DogDetection[] | null, nowMs: number) => DogTrackingResult;
      reset: () => void;
    },
    private readonly poseModel: QuadrupedPoseModel,
  ) {}

  async warmup(): Promise<void> {
    await Promise.all([this.detector.warmup(), this.poseModel.warmup()]);
  }

  async detect(frame: CameraFrame): Promise<DogVisionResult> {
    const detectorResult = await this.detector.detect(frame);
    const tracking = this.tracker.update(detectorResult.detections, Date.now());
    this.lastTracking = tracking;

    const bestDetection = detectorResult.detections[0] ?? null;
    const common = {
      frameId: frame.id,
      analysedAt: new Date().toISOString(),
      detectionConfidence: bestDetection?.confidence ?? null,
      dogBoundingBox: tracking.box,
      detectionSource: 'dedicated_detector' as const,
      trackingConfidence: tracking.trackingConfidence,
      trackingState: tracking.state,
      stressSignal: 'uncertain' as const,
      stressConfidence: null,
    };

    if (
      !tracking.box ||
      tracking.state !== 'acquired' && tracking.state !== 'tracking'
    ) {
      return {
        ...common,
        dogDetected: false,
        posture: 'unknown',
        postureConfidence: null,
      };
    }

    try {
      const inference = await this.poseModel.infer(frame, tracking.box);

      if (!inference.pose) {
        return {
          ...common,
          dogDetected: true,
          posture: 'unknown',
          postureConfidence: null,
        };
      }

      const posture = classifyQuadrupedPosture(inference.pose);

      return {
        ...common,
        dogDetected: true,
        posture: posture.posture,
        postureConfidence: posture.confidence,
      };
    } catch {
      // Detector truth remains valid even if pose inference temporarily fails.
      return {
        ...common,
        dogDetected: true,
        posture: 'unknown',
        postureConfidence: null,
      };
    }
  }

  resetTracking(): void {
    this.tracker.reset();
    this.lastTracking = null;
  }

  async dispose(): Promise<void> {
    this.resetTracking();
    await Promise.all([
      this.detector.dispose(),
      this.poseModel.dispose(),
    ]);
  }
}
