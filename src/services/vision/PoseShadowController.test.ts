import type { QuadrupedPose } from '../../domain/vision/QuadrupedPose';
import type { CameraFrame } from '../camera/CameraFrameSource';
import { PoseShadowController } from './PoseShadowController';
import type { QuadrupedPoseModel } from './QuadrupedPoseModel';

const frame: CameraFrame = {
  id: 'frame-1',
  capturedAt: '2026-09-13T00:00:00.000Z',
  width: 1000,
  height: 1400,
  rotationDegrees: 0,
  uri: 'file:///frame.jpg',
};

const pose: QuadrupedPose = {
  keypoints: {
    left_eye: { x: 0.4, y: 0.2, confidence: 0.95 },
    right_eye: { x: 0.44, y: 0.2, confidence: 0.95 },
    nose: { x: 0.38, y: 0.22, confidence: 0.95 },
    neck: { x: 0.42, y: 0.24, confidence: 0.95 },
    tail_root: { x: 0.67, y: 0.31, confidence: 0.95 },
    left_shoulder: { x: 0.43, y: 0.30, confidence: 0.95 },
    left_elbow: { x: 0.43, y: 0.58, confidence: 0.95 },
    left_front_paw: { x: 0.43, y: 0.85, confidence: 0.95 },
    right_shoulder: { x: 0.47, y: 0.30, confidence: 0.95 },
    right_elbow: { x: 0.47, y: 0.58, confidence: 0.95 },
    right_front_paw: { x: 0.47, y: 0.85, confidence: 0.95 },
    left_hip: { x: 0.63, y: 0.32, confidence: 0.95 },
    left_knee: { x: 0.63, y: 0.60, confidence: 0.95 },
    left_back_paw: { x: 0.63, y: 0.86, confidence: 0.95 },
    right_hip: { x: 0.67, y: 0.32, confidence: 0.95 },
    right_knee: { x: 0.67, y: 0.60, confidence: 0.95 },
    right_back_paw: { x: 0.67, y: 0.86, confidence: 0.95 },
  },
};

class FakeModel implements QuadrupedPoseModel {
  warmups = 0;
  disposes = 0;
  async warmup(): Promise<void> { this.warmups += 1; }
  async infer() {
    return {
      dogDetected: true,
      detectionConfidence: 0.91,
      pose,
      inferenceMs: 22,
    };
  }
  async dispose(): Promise<void> { this.disposes += 1; }
}

describe('PoseShadowController', () => {
  it('enables the model and reports posture only as shadow diagnostics', async () => {
    const model = new FakeModel();
    const controller = new PoseShadowController(async () => model);

    await expect(controller.enable()).resolves.toEqual({ state: 'ready' });
    const result = await controller.analyse(frame);

    expect(model.warmups).toBe(1);
    expect(result).toMatchObject({
      dogDetected: true,
      detectionConfidence: 0.91,
      posture: 'stand_like',
      inferenceMs: 22,
    });
    expect(controller.getDiagnostics()).toMatchObject({
      framesRequested: 1,
      framesAnalysed: 1,
      framesSkippedBusy: 0,
      inferenceErrors: 0,
      lastInferenceMs: 22,
      lastDetectionConfidence: 0.91,
    });
  });

  it('fails closed when native model startup fails', async () => {
    const controller = new PoseShadowController(async () => { throw new Error('native module unavailable'); });
    const status = await controller.enable();

    expect(status).toEqual({ state: 'error', message: 'native module unavailable' });
    await expect(controller.analyse(frame)).resolves.toBeNull();
  });

  it('records inference errors and exposes the failed state', async () => {
    const model: QuadrupedPoseModel = {
      async warmup() {},
      async infer() { throw new Error('inference exploded'); },
      async dispose() {},
    };
    const controller = new PoseShadowController(async () => model);
    await controller.enable();

    await expect(controller.analyse(frame)).resolves.toBeNull();
    expect(controller.getStatus()).toEqual({ state: 'error', message: 'inference exploded' });
    expect(controller.getDiagnostics()).toMatchObject({
      framesRequested: 1,
      framesAnalysed: 0,
      inferenceErrors: 1,
    });
  });

  it('counts frames skipped while inference is already running', async () => {
    type InferenceResult = Awaited<ReturnType<QuadrupedPoseModel['infer']>>;
    let resolveInference!: (value: InferenceResult) => void;
    const inferencePromise = new Promise<InferenceResult>((resolve) => {
      resolveInference = resolve;
    });
    const model: QuadrupedPoseModel = {
      async warmup() {},
      async infer() {
        return inferencePromise;
      },
      async dispose() {},
    };
    const controller = new PoseShadowController(async () => model);
    await controller.enable();

    const first = controller.analyse(frame);
    await expect(controller.analyse({ ...frame, id: 'frame-2' })).resolves.toBeNull();
    expect(controller.getDiagnostics().framesSkippedBusy).toBe(1);

    resolveInference({
      dogDetected: true,
      detectionConfidence: 0.91,
      pose,
      inferenceMs: 25,
    });
    await first;
  });

  it('disposes the native model when shadow mode is disabled', async () => {
    const model = new FakeModel();
    const controller = new PoseShadowController(async () => model);
    await controller.enable();

    await controller.disable();

    expect(model.disposes).toBe(1);
    expect(controller.getStatus()).toEqual({ state: 'off' });
  });
});
