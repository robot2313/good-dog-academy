import type { CameraFrame } from '../camera/CameraFrameSource';
import type { DogPostureEvidence } from '../../domain/models/TrainingEvidence';

export type VisionStressSignal =
  | 'none'
  | 'avoidance_like'
  | 'freezing_like'
  | 'escape_like'
  | 'uncertain';

export type DogVisionResult = {
  frameId: string;
  analysedAt: string;
  dogDetected: boolean;
  detectionConfidence: number | null;
  posture: DogPostureEvidence;
  postureConfidence: number | null;
  stressSignal: VisionStressSignal;
  stressConfidence: number | null;
};

export interface DogVisionEngine {
  warmup(): Promise<void>;
  detect(frame: CameraFrame): Promise<DogVisionResult>;
  dispose(): Promise<void>;
}
