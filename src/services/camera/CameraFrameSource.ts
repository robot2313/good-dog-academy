export type CameraFrame = {
  id: string;
  capturedAt: string;
  width: number;
  height: number;
  rotationDegrees: 0 | 90 | 180 | 270;
  uri: string | null;
};

export interface CameraFrameSource {
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: (frame: CameraFrame) => void): () => void;
}
