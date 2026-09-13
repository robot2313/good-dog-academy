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

export type PoseShadowDiagnostics = {
  framesRequested: number;
  framesAnalysed: number;
  framesSkippedBusy: number;
  inferenceErrors: number;
  lastInferenceAt: string | null;
  lastInferenceMs: number | null;
  lastTotalMs: number | null;
  lastDetectionConfidence: number | null;
  lastPostureConfidence: number | null;
};

type ModelFactory = () => Promise<QuadrupedPoseModel>;

const initialDiagnostics = (): PoseShadowDiagnostics => ({
  framesRequested: 0,
  framesAnalysed: 0,
  framesSkippedBusy: 0,
  inferenceErrors: 0,
  lastInferenceAt: null,
  lastInferenceMs: null,
  lastTotalMs: null,
  lastDetectionConfidence: null,
  lastPostureConfidence: null,
});

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
  private diagnostics: PoseShadowDiagnostics = initialDiagnostics();

  constructor(private readonly makeModel: ModelFactory = defaultModelFactory) {}

  getStatus(): PoseShadowStatus {
    return this.status;
  }

  getDiagnostics(): PoseShadowDiagnostics {
    return { ...this.diagnostics };
  }

  async enable(): Promise<PoseShadowStatus> {
    if (this.status.state === 'ready') return this.status;
    this.status = { state: 'loading' };
    this.diagnostics = initialDiagnostics();
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
    if (this.status.state !== 'ready' || !this.model) return null;

    this.diagnostics.framesRequested += 1;
    if (this.inFlight) {
      this.diagnostics.framesSkippedBusy += 1;
      return null;
    }

    this.inFlight = true;
    const startedAt = Date.now();
    try {
      const inference = await this.model.infer(frame);
      const classification = inference.pose
        ? classifyQuadrupedPosture(inference.pose)
        : { posture: 'unknown' as const, confidence: null };
      const totalMs = Date.now() - startedAt;
      const observation: PoseShadowObservation = {
        dogDetected: inference.dogDetected,
        detectionConfidence: inference.detectionConfidence,
        posture: classification.posture,
        postureConfidence: classification.confidence,
        inferenceMs: inference.inferenceMs,
        totalMs,
      };

      this.diagnostics.framesAnalysed += 1;
      this.diagnostics.lastInferenceAt = new Date().toISOString();
      this.diagnostics.lastInferenceMs = inference.inferenceMs;
      this.diagnostics.lastTotalMs = totalMs;
      this.diagnostics.lastDetectionConfidence = inference.detectionConfidence;
      this.diagnostics.lastPostureConfidence = classification.confidence;

      return observation;
    } catch (error) {
      this.diagnostics.inferenceErrors += 1;
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
    this.inFlight = false;
    if (model) await model.dispose();
  }
}
