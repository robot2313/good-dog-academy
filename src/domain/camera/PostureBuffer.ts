import type { DogPostureEvidence } from '../models/TrainingEvidence';

export type PostureObservation = {
  posture: DogPostureEvidence;
  confidence: number | null;
};

export type PostureTransition = {
  from: Exclude<DogPostureEvidence, 'unknown'>;
  to: Exclude<DogPostureEvidence, 'unknown'>;
};

export type PostureBufferOptions = {
  windowSize?: number;
  consensusThreshold?: number;
  minConfidence?: number;
};

const DEFAULT_WINDOW_SIZE = 5;
const DEFAULT_CONSENSUS_THRESHOLD = 0.6;
const DEFAULT_MIN_CONFIDENCE = 0.72;

export class PostureBuffer {
  private readonly windowSize: number;
  private readonly consensusThreshold: number;
  private readonly minConfidence: number;
  private observations: PostureObservation[] = [];
  private stablePosture: Exclude<DogPostureEvidence, 'unknown'> | null = null;
  private lastTransition: PostureTransition | null = null;

  constructor(options: PostureBufferOptions = {}) {
    this.windowSize = Math.max(1, Math.floor(options.windowSize ?? DEFAULT_WINDOW_SIZE));
    this.consensusThreshold = Math.min(
      1,
      Math.max(0, options.consensusThreshold ?? DEFAULT_CONSENSUS_THRESHOLD),
    );
    this.minConfidence = Math.min(
      1,
      Math.max(0, options.minConfidence ?? DEFAULT_MIN_CONFIDENCE),
    );
  }

  push(observation: PostureObservation): {
    stablePosture: Exclude<DogPostureEvidence, 'unknown'> | null;
    transition: PostureTransition | null;
  } {
    this.lastTransition = null;
    this.observations.push(observation);

    if (this.observations.length > this.windowSize) {
      this.observations.shift();
    }

    const valid = this.observations.filter(
      (item): item is PostureObservation & {
        posture: Exclude<DogPostureEvidence, 'unknown'>;
        confidence: number;
      } =>
        item.posture !== 'unknown' &&
        item.confidence !== null &&
        Number.isFinite(item.confidence) &&
        item.confidence >= this.minConfidence,
    );

    if (valid.length < 3) {
      return {
        stablePosture: this.stablePosture,
        transition: null,
      };
    }

    const counts = new Map<Exclude<DogPostureEvidence, 'unknown'>, number>();

    for (const item of valid) {
      counts.set(item.posture, (counts.get(item.posture) ?? 0) + 1);
    }

    let candidate: Exclude<DogPostureEvidence, 'unknown'> | null = null;
    let candidateCount = 0;

    for (const [posture, count] of counts) {
      if (count > candidateCount) {
        candidate = posture;
        candidateCount = count;
      }
    }

    if (!candidate || candidateCount / valid.length < this.consensusThreshold) {
      return {
        stablePosture: this.stablePosture,
        transition: null,
      };
    }

    if (this.stablePosture && this.stablePosture !== candidate) {
      this.lastTransition = {
        from: this.stablePosture,
        to: candidate,
      };
    }

    this.stablePosture = candidate;

    return {
      stablePosture: this.stablePosture,
      transition: this.lastTransition,
    };
  }

  getStablePosture(): Exclude<DogPostureEvidence, 'unknown'> | null {
    return this.stablePosture;
  }

  getLastTransition(): PostureTransition | null {
    return this.lastTransition;
  }

  reset(): void {
    this.observations = [];
    this.stablePosture = null;
    this.lastTransition = null;
  }
}
