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

export type DogTrackingState =
  | 'searching'
  | 'acquired'
  | 'tracking'
  | 'temporarily_lost'
  | 'reacquiring'
  | 'lost';

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

function chooseDetection(
  current: NormalizedDogBox | null,
  detections: DogDetection[],
): DogDetection | null {
  const valid = detections.filter((item) => item.confidence > 0);
  if (valid.length === 0) return null;
  if (!current) {
    return [...valid].sort((a, b) => b.confidence - a.confidence)[0] ?? null;
  }

  return [...valid].sort((a, b) => {
    const aScore = iou(current, a.box) * 0.75 + a.confidence * 0.25;
    const bScore = iou(current, b.box) * 0.75 + b.confidence * 0.25;
    return bScore - aScore;
  })[0] ?? null;
}

/**
 * Temporal box tracker. Detection confidence and tracking confidence remain
 * separate. The tracker holds a stable box during short detector gaps and
 * explicitly transitions through temporary loss/reacquisition.
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

  update(detections: DogDetection[] | DogDetection | null, nowMs: number): DogTrackingResult {
    const alpha = this.options.smoothingAlpha ?? 0.32;
    const reacquireAlpha = this.options.reacquireAlpha ?? 0.55;
    const lostAfterMs = this.options.lostAfterMs ?? 1800;
    const maxMisses = this.options.maxMisses ?? 3;
    const minConfidence = this.options.minDetectionConfidence ?? 0.60;

    const candidates = detections
      ? (Array.isArray(detections) ? detections : [detections])
          .filter((item) => item.confidence >= minConfidence)
      : [];

    const detection = chooseDetection(this.box, candidates);

    if (detection) {
      const wasLost = this.state === 'lost';
      const wasSearching = this.state === 'searching' || this.box === null;

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
        smooth(this.confidence, detection.confidence, wasLost || wasSearching ? 0.65 : 0.30),
      );
      this.lastDetectionAtMs = nowMs;
      this.misses = 0;
      this.state = wasLost ? 'reacquiring' : wasSearching ? 'acquired' : 'tracking';
      this.source = detection.source;
    } else {
      this.misses += 1;
      const ageMs = this.box ? Math.max(0, nowMs - this.lastDetectionAtMs) : 0;

      if (!this.box) {
        this.state = 'searching';
        this.confidence = 0;
      } else if (ageMs > lostAfterMs || this.misses > maxMisses) {
        this.state = 'lost';
        this.confidence = 0;
        this.source = null;
      } else {
        this.state = 'temporarily_lost';
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
