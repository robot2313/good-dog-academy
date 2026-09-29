import type { DogPostureEvidence } from '../models/TrainingEvidence';

export type TemporalRepGateResult = {
  stablePosture: Exclude<DogPostureEvidence, 'unknown'> | null;
  readyToScore: boolean;
  waitingForTransition: boolean;
};

export class TemporalRepGate {
  private activeCueAt: string | null = null;
  private scoredForCue = false;
  private lastStablePosture: Exclude<DogPostureEvidence, 'unknown'> | null = null;
  private hasLeftExpectedPosture = true;

  beginCue(cueAt: string, expectedPosture: Exclude<DogPostureEvidence, 'unknown'>): void {
    if (this.activeCueAt === cueAt) return;

    this.activeCueAt = cueAt;
    this.scoredForCue = false;

    // If the dog was already in the target posture when the new cue started,
    // require a real departure and re-entry. This prevents a held posture from
    // being counted as multiple reps.
    this.hasLeftExpectedPosture = this.lastStablePosture !== expectedPosture;
  }

  observe(
    stablePosture: Exclude<DogPostureEvidence, 'unknown'> | null,
    expectedPosture: Exclude<DogPostureEvidence, 'unknown'>,
  ): TemporalRepGateResult {
    if (stablePosture) {
      if (stablePosture !== expectedPosture) {
        this.hasLeftExpectedPosture = true;
      }
      this.lastStablePosture = stablePosture;
    }

    const readyToScore =
      stablePosture === expectedPosture &&
      !this.scoredForCue &&
      this.hasLeftExpectedPosture;

    if (readyToScore) {
      this.scoredForCue = true;
    }

    return {
      stablePosture,
      readyToScore,
      waitingForTransition:
        stablePosture === expectedPosture &&
        !readyToScore &&
        !this.scoredForCue,
    };
  }

  reset(): void {
    this.activeCueAt = null;
    this.scoredForCue = false;
    this.lastStablePosture = null;
    this.hasLeftExpectedPosture = true;
  }
}
