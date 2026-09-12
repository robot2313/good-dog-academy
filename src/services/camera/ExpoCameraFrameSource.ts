import type { CameraFrame, CameraFrameSource } from './CameraFrameSource';

export type ExpoCapturedFrame = {
  uri: string;
  width: number;
  height: number;
};

export type ExpoCameraCapture = () => Promise<ExpoCapturedFrame | null>;

export class ExpoCameraFrameSource implements CameraFrameSource {
  private readonly capture: ExpoCameraCapture;
  private readonly intervalMs: number;
  private readonly listeners = new Set<(frame: CameraFrame) => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private captureInFlight = false;
  private sequence = 0;

  constructor(capture: ExpoCameraCapture, intervalMs = 750) {
    this.capture = capture;
    this.intervalMs = Math.max(250, intervalMs);
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.scheduleNext(0);
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  subscribe(listener: (frame: CameraFrame) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private scheduleNext(delay: number): void {
    if (!this.running) return;
    this.timer = setTimeout(() => {
      void this.captureAndEmit();
    }, delay);
  }

  private async captureAndEmit(): Promise<void> {
    if (!this.running || this.captureInFlight) {
      this.scheduleNext(this.intervalMs);
      return;
    }

    this.captureInFlight = true;
    try {
      const captured = await this.capture();
      if (!captured || !this.running) return;

      const capturedAt = new Date().toISOString();
      this.sequence += 1;
      const frame: CameraFrame = {
        id: `camera-frame-${capturedAt}-${this.sequence}`,
        capturedAt,
        width: captured.width,
        height: captured.height,
        rotationDegrees: 0,
        uri: captured.uri,
      };

      this.listeners.forEach((listener) => listener(frame));
    } finally {
      this.captureInFlight = false;
      this.scheduleNext(this.intervalMs);
    }
  }
}
