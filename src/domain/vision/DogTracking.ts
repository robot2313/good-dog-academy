export type NormalizedDogBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type DogDetectionSource = 'dedicated_detector' | 'pose_heuristic';

export type DogDetection = {
  box: NormalizedDogBox;
  confidence: number;
  source: DogDetectionSource;
};

export type DogTrackingState = 'searching' | 'acquired' | 'tracking' | 'lost';

export type DogTrackingResult = {
  box: NormalizedDogBox | null;
  state: DogTrackingState;
  trackingConfidence: number;
  ageMs: number;
  consecutiveMisses: number;
  source: DogDetectionSource | null;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function smooth(previous: number, next: number, alpha: number): number {
  return previous + (next - previous) * alpha;
}

function iou(a: NormalizedDogBox, b: NormalizedDogBox): number {
  const left = Math.max(a.left, b.left);
  const top = Math.max(a.top, b.top);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const bottom = Math.min(a.top + a.height, b.top + b.height);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = a.width * a.height + b.width * b.height - intersection;
  return union <= 0 ? 0 : intersection / union;
}

/**
 * Lightweight temporal box tracker. It intentionally does not invent a new
 * location during a miss: it holds the last stable box for a short grace
 * period, then declares the dog lost. This is a tracker, not a detector.
 */
export class DogTracker {
  private box: NormalizedDogBox | null = null;
  private confidence = 0;
  private lastDetectionAtMs = 0;
  private misses = 0;
  private state: DogTrackingState = 'searching';
  private source: DogDetectionSource | null = null;

  constructor(
    private readonly options: {
      smoothingAlpha?: number;
      reacquireAlpha?: number;
      lostAfterMs?: number;
      maxMisses?: number;
      minDetectionConfidence?: number;
    } = {},
  ) {}

  update(detection: DogDetection | null, nowMs: number): DogTrackingResult {
    const alpha = this.options.smoothingAlpha ?? 0.32;
    const reacquireAlpha = this.options.reacquireAlpha ?? 0.55;
    const lostAfterMs = this.options.lostAfterMs ?? 1800;
    const maxMisses = this.options.maxMisses ?? 3;
    const minConfidence = this.options.minDetectionConfidence ?? 0.60;

    if (detection && detection.confidence >= minConfidence) {
      const wasLost = this.state === 'lost' || this.box === null;
      if (!this.box || wasLost) {
        this.box = detection.box;
      } else {
        const overlap = iou(this.box, detection.box);
        const a = overlap >= 0.15 ? alpha : reacquireAlpha;
        this.box = {
          left: smooth(this.box.left, detection.box.left, a),
          top: smooth(this.box.top, detection.box.top, a),
          width: smooth(this.box.width, detection.box.width, a),
          height: smooth(this.box.height, detection.box.height, a),
        };
      }

      this.confidence = clamp01(
        smooth(this.confidence, detection.confidence, wasLost ? 0.65 : 0.30),
      );
      this.lastDetectionAtMs = nowMs;
      this.misses = 0;
      this.state = wasLost ? 'acquired' : 'tracking';
      this.source = detection.source;
    } else {
      this.misses += 1;
      const ageMs = this.box ? Math.max(0, nowMs - this.lastDetectionAtMs) : 0;
      if (!this.box || ageMs > lostAfterMs || this.misses > maxMisses) {
        this.state = this.box ? 'lost' : 'searching';
        this.confidence = 0;
        if (this.state === 'lost') this.source = null;
      } else {
        this.state = 'tracking';
        this.confidence = clamp01(this.confidence * 0.82);
      }
    }

    return {
      box: this.box,
      state: this.state,
      trackingConfidence: this.confidence,
      ageMs: this.box ? Math.max(0, nowMs - this.lastDetectionAtMs) : 0,
      consecutiveMisses: this.misses,
      source: this.source,
    };
  }

  reset(): void {
    this.box = null;
    this.confidence = 0;
    this.lastDetectionAtMs = 0;
    this.misses = 0;
    this.state = 'searching';
    this.source = null;
  }
}
