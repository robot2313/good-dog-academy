import type { CameraFrame } from '../camera/CameraFrameSource';
import type { DogDetector } from './DogDetector';
import type { QuadrupedPoseModel } from './QuadrupedPoseModel';
import { ProductionDogVisionEngine } from './ProductionDogVisionEngine';

const frame: CameraFrame = {
  id: 'frame-1',
  capturedAt: '2026-09-12T10:00:01.000Z',
  width: 256,
  height: 256,
  rotationDegrees: 0,
  uri: 'file:///frame.jpg',
};

const poseModel = (): QuadrupedPoseModel => ({
  warmup: jest.fn().mockResolvedValue(undefined),
  infer: jest.fn().mockResolvedValue({
    dogDetected: true,
    detectionConfidence: 0.96,
    dogBoundingBox: null,
    pose: {
      keypoints: {
        left_eye: { x: 0.35, y: 0.2, confidence: 0.95 },
        right_eye: { x: 0.37, y: 0.2, confidence: 0.95 },
        nose: { x: 0.36, y: 0.23, confidence: 0.95 },
        neck: { x: 0.42, y: 0.28, confidence: 0.95 },
        tail_root: { x: 0.68, y: 0.32, confidence: 0.95 },
        left_shoulder: { x: 0.43, y: 0.31, confidence: 0.95 },
        left_elbow: { x: 0.43, y: 0.55, confidence: 0.95 },
        left_front_paw: { x: 0.43, y: 0.85, confidence: 0.95 },
        right_shoulder: { x: 0.47, y: 0.31, confidence: 0.95 },
        right_elbow: { x: 0.47, y: 0.55, confidence: 0.95 },
        right_front_paw: { x: 0.47, y: 0.85, confidence: 0.95 },
        left_hip: { x: 0.63, y: 0.32, confidence: 0.95 },
        left_knee: { x: 0.63, y: 0.55, confidence: 0.95 },
        left_back_paw: { x: 0.63, y: 0.86, confidence: 0.95 },
        right_hip: { x: 0.67, y: 0.32, confidence: 0.95 },
        right_knee: { x: 0.67, y: 0.55, confidence: 0.95 },
        right_back_paw: { x: 0.67, y: 0.86, confidence: 0.95 },
      },
    },
    inferenceMs: 42,
  }),
  dispose: jest.fn().mockResolvedValue(undefined),
});

const detector = (): DogDetector => ({
  warmup: jest.fn().mockResolvedValue(undefined),
  detect: jest.fn().mockResolvedValue({
    detections: [{
      box: { left: 0.25, top: 0.12, width: 0.5, height: 0.7 },
      confidence: 0.96,
      source: 'dedicated_detector',
    }],
    inferenceMs: 18,
    model: 'test-yolo26',
  }),
  dispose: jest.fn().mockResolvedValue(undefined),
});

describe('ProductionDogVisionEngine', () => {
  it('uses the dedicated detector for presence and the existing pose model for posture', async () => {
    const model = poseModel();
    const dogDetector = detector();
    const engine = new ProductionDogVisionEngine(
      async () => model,
      async () => dogDetector,
    );

    await engine.warmup();
    const result = await engine.detect(frame);

    expect(result.dogDetected).toBe(true);
    expect(result.detectionConfidence).toBe(0.96);
    expect(result.detectionSource).toBe('dedicated_detector');
    expect(result.posture).toBe('stand_like');
    expect(result.postureConfidence).not.toBeNull();
    expect(model.warmup).toHaveBeenCalledTimes(1);
    expect(model.infer).toHaveBeenCalledTimes(1);
    expect(dogDetector.warmup).toHaveBeenCalledTimes(1);
    expect(dogDetector.detect).toHaveBeenCalledTimes(1);

    await engine.dispose();
    expect(model.dispose).toHaveBeenCalledTimes(1);
    expect(dogDetector.dispose).toHaveBeenCalledTimes(1);
  });
});
