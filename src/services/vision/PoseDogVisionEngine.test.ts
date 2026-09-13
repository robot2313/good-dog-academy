import type { QuadrupedPose } from '../../domain/vision/QuadrupedPose';
import type { CameraFrame } from '../camera/CameraFrameSource';
import { PoseDogVisionEngine } from './PoseDogVisionEngine';
import type { QuadrupedPoseModel } from './QuadrupedPoseModel';

const frame: CameraFrame = {
  id: 'frame-1',
  capturedAt: '2026-09-13T00:00:00.000Z',
  width: 1280,
  height: 720,
  rotationDegrees: 0,
  uri: 'file:///frame.jpg',
};

const standingPose: QuadrupedPose = {
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

class FakePoseModel implements QuadrupedPoseModel {
  warmups = 0;
  disposes = 0;
  constructor(private readonly detected: boolean, private readonly pose: QuadrupedPose | null) {}

  async warmup(): Promise<void> { this.warmups += 1; }
  async infer() {
    return {
      dogDetected: this.detected,
      detectionConfidence: this.detected ? 0.94 : 0.12,
      pose: this.pose,
      inferenceMs: 18,
    };
  }
  async dispose(): Promise<void> { this.disposes += 1; }
}

describe('PoseDogVisionEngine', () => {
  it('converts pose inference into posture evidence without inventing stress evidence', async () => {
    const model = new FakePoseModel(true, standingPose);
    const engine = new PoseDogVisionEngine(model);

    await engine.warmup();
    const result = await engine.detect(frame);

    expect(model.warmups).toBe(1);
    expect(result.dogDetected).toBe(true);
    expect(result.detectionConfidence).toBe(0.94);
    expect(result.posture).toBe('stand_like');
    expect(result.postureConfidence).not.toBeNull();
    expect(result.stressSignal).toBe('uncertain');
    expect(result.stressConfidence).toBeNull();
  });

  it('fails closed when the pose model does not return a dog pose', async () => {
    const engine = new PoseDogVisionEngine(new FakePoseModel(false, null));
    const result = await engine.detect(frame);

    expect(result).toMatchObject({
      dogDetected: false,
      posture: 'unknown',
      postureConfidence: null,
      stressSignal: 'uncertain',
    });
  });
});
