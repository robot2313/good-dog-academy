import type { CameraFrame } from '../camera/CameraFrameSource';
import type { DogDetection } from '../../domain/vision/DogTracking';

export type DogDetectorResult = {
  detections: DogDetection[];
  inferenceMs: number | null;
  model: string;
};

export interface DogDetector {
  warmup(): Promise<void>;
  detect(frame: CameraFrame): Promise<DogDetectorResult>;
  dispose(): Promise<void>;
};
