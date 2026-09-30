import type { CameraFrame } from '../camera/CameraFrameSource';
import type { DogVisionEngine, DogVisionResult } from './DogVisionEngine';
import type { DogDetector } from './DogDetector';
import type { QuadrupedPoseModel } from './QuadrupedPoseModel';
import { DetectorFirstDogVisionEngine } from './DetectorFirstDogVisionEngine';
import { DogTracker } from '../../domain/vision/DogTracking';

type ModelFactory = () => Promise<QuadrupedPoseModel>;
type DetectorFactory = () => Promise<DogDetector>;

async function defaultModelFactory(): Promise<QuadrupedPoseModel> {
  const { OnnxQuadrupedPoseModel } = await import('./OnnxQuadrupedPoseModel');
  return new OnnxQuadrupedPoseModel();
}

async function defaultDetectorFactory() {
  const { OnnxYolo26DogDetector } = await import('./OnnxYolo26DogDetector');
  return new OnnxYolo26DogDetector();
}

/**
 * Production vision path during migration:
 *
 * Camera
 *   -> dedicated YOLO26 dog detector
 *   -> temporal dog tracker
 *   -> tracked dog ROI
 *   -> existing validated 17-point quadruped pose
 *   -> posture classifier
 *
 * The 17-point model remains intact as the pose/fallback layer. It is no
 * longer allowed to establish dog presence.
 */
export class ProductionDogVisionEngine implements DogVisionEngine {
  private engine: DetectorFirstDogVisionEngine | null = null;

  constructor(
    private readonly makeModel: ModelFactory = defaultModelFactory,
    private readonly makeDetector: DetectorFactory = defaultDetectorFactory,
  ) {}

  private async ensureEngine(): Promise<DetectorFirstDogVisionEngine> {
    if (this.engine) return this.engine;

    const detector = await this.makeDetector();
    const model = await this.makeModel();
    const tracker = new DogTracker();

    this.engine = new DetectorFirstDogVisionEngine(
      detector,
      tracker,
      model,
    );

    return this.engine;
  }

  async warmup(): Promise<void> {
    await (await this.ensureEngine()).warmup();
  }

  async detect(frame: CameraFrame): Promise<DogVisionResult> {
    return (await this.ensureEngine()).detect(frame);
  }

  async dispose(): Promise<void> {
    const engine = this.engine;
    this.engine = null;
    if (engine) await engine.dispose();
  }
}
