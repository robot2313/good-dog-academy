import { classifyQuadrupedPosture } from '../../domain/vision/QuadrupedPose';
import type { CameraFrame } from '../camera/CameraFrameSource';
import type { QuadrupedPoseModel } from './QuadrupedPoseModel';

export type PoseShadowObservation = {
  dogDetected: boolean;
  detectionConfidence: number | null;
  posture: 'stand_like' | 'sit_like' | 'down_like' | 'unknown';
  postureConfidence: number | null;
  inferenceMs: number | null;
  totalMs: number;
};

export type PoseShadowStatus =
  | { state: 'off' }
  | { state: 'loading' }
  | { state: 'ready' }
  | { state: 'error'; message: string };

type ModelFactory = () => Promise<QuadrupedPoseModel>;

async function defaultModelFactory(): Promise<QuadrupedPoseModel> {
  // Keep the native ONNX module out of Expo Go startup. It is loaded only when
  // the owner explicitly enables the private real-vision shadow test.
  const { OnnxQuadrupedPoseModel } = await import('./OnnxQuadrupedPoseModel');
  return new OnnxQuadrupedPoseModel();
}

export class PoseShadowController {
  private model: QuadrupedPoseModel | null = null;
  private status: PoseShadowStatus = { state: 'off' };
  private inFlight = false;

  constructor(private readonly makeModel: ModelFactory = defaultModelFactory) {}

  getStatus(): PoseShadowStatus {
    return this.status;
  }

  async enable(): Promise<PoseShadowStatus> {
    if (this.status.state === 'ready') return this.status;
    this.status = { state: 'loading' };
    try {
      const model = await this.makeModel();
      await model.warmup();
      this.model = model;
      this.status = { state: 'ready' };
    } catch (error) {
      this.model = null;
      this.status = {
        state: 'error',
        message: error instanceof Error ? error.message : 'Real vision could not be started in this build.',
      };
    }
    return this.status;
  }

  async analyse(frame: CameraFrame): Promise<PoseShadowObservation | null> {
    if (this.status.state !== 'ready' || !this.model || this.inFlight) return null;
    this.inFlight = true;
    const startedAt = Date.now();
    try {
      const inference = await this.model.infer(frame);
      const classification = inference.pose
        ? classifyQuadrupedPosture(inference.pose)
        : { posture: 'unknown' as const, confidence: null };
      return {
        dogDetected: inference.dogDetected,
        detectionConfidence: inference.detectionConfidence,
        posture: classification.posture,
        postureConfidence: classification.confidence,
        inferenceMs: inference.inferenceMs,
        totalMs: Date.now() - startedAt,
      };
    } catch (error) {
      this.status = {
        state: 'error',
        message: error instanceof Error ? error.message : 'Real vision inference failed.',
      };
      return null;
    } finally {
      this.inFlight = false;
    }
  }

  async disable(): Promise<void> {
    const model = this.model;
    this.model = null;
    this.status = { state: 'off' };
    if (model) await model.dispose();
  }
}
