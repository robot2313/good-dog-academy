import type { CameraFrame } from '../camera/CameraFrameSource';
import type { QuadrupedPose } from '../../domain/vision/QuadrupedPose';
import type { NormalizedDogBox } from '../../domain/vision/DogTracking';

export type QuadrupedPoseInference = {
  dogDetected: boolean;
  detectionConfidence: number | null;
  dogBoundingBox: NormalizedDogBox | null;
  pose: QuadrupedPose | null;
  inferenceMs: number | null;
};

export interface QuadrupedPoseModel {
  warmup(): Promise<void>;
  infer(frame: CameraFrame): Promise<QuadrupedPoseInference>;
  dispose(): Promise<void>;
}
