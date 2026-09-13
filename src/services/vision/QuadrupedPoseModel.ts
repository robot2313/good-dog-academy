import type { CameraFrame } from '../camera/CameraFrameSource';
import type { QuadrupedPose } from '../../domain/vision/QuadrupedPose';

export type QuadrupedPoseInference = {
  dogDetected: boolean;
  detectionConfidence: number | null;
  pose: QuadrupedPose | null;
  inferenceMs: number | null;
};

export interface QuadrupedPoseModel {
  warmup(): Promise<void>;
  infer(frame: CameraFrame): Promise<QuadrupedPoseInference>;
  dispose(): Promise<void>;
}
