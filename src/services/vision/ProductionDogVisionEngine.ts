import type { CameraFrame } from '../camera/CameraFrameSource';
import type { DogVisionEngine, DogVisionResult } from './DogVisionEngine';
import { PoseDogVisionEngine } from './PoseDogVisionEngine';
import type { QuadrupedPoseModel } from './QuadrupedPoseModel';

type ModelFactory = () => Promise<QuadrupedPoseModel>;

async function defaultModelFactory(): Promise<QuadrupedPoseModel> {
  const { OnnxQuadrupedPoseModel } = await import('./OnnxQuadrupedPoseModel');
  return new OnnxQuadrupedPoseModel();
}

/**
 * Production on-device vision adapter.
 *
 * The native ONNX runtime is loaded lazily so Expo Go/startup paths do not
 * import the native module. The same validated 17-joint pose pipeline used by
 * shadow validation is therefore used for live Camera Coach inference.
 */
export class ProductionDogVisionEngine implements DogVisionEngine {
  private engine: PoseDogVisionEngine | null = null;

  constructor(private readonly makeModel: ModelFactory = defaultModelFactory) {}

  private async ensureEngine(): Promise<PoseDogVisionEngine> {
    if (this.engine) return this.engine;
    const model = await this.makeModel();
    this.engine = new PoseDogVisionEngine(model);
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
