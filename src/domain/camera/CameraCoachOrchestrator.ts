import type { CameraFrame } from '../../services/camera/CameraFrameSource';
import type { DogVisionEngine, DogVisionResult } from '../../services/vision/DogVisionEngine';
import type { TrainingOutcome } from '../models/TrainingSession';
import type { TrainingRep } from '../models/TrainingEvidence';
import {
  applyRepToLiveSession,
  stopLiveCoachSession,
  type LiveCoachSession,
  type SessionDirectorDecision,
} from '../behaviour/LiveCoachEngine';
import {
  decideCameraRepEvidence,
  type CameraEvidencePolicy,
  type CameraEvidenceUncertainty,
  type CameraRepObservation,
  DEFAULT_CAMERA_EVIDENCE_POLICY,
} from './cameraEvidence';

export type CameraCoachPendingConfirmation = {
  vision: DogVisionResult;
  observation: CameraRepObservation;
  reason: CameraEvidenceUncertainty;
};

export type CameraCoachFrameResult =
  | { kind: 'throttled'; session: LiveCoachSession }
  | { kind: 'busy'; session: LiveCoachSession }
  | { kind: 'session_complete'; session: LiveCoachSession }
  | {
      kind: 'owner_confirmation';
      session: LiveCoachSession;
      pending: CameraCoachPendingConfirmation;
    }
  | {
      kind: 'rep_recorded';
      session: LiveCoachSession;
      rep: TrainingRep;
      decision: SessionDirectorDecision;
    };

export type CameraCoachOrchestratorOptions = {
  minFrameIntervalMs?: number;
  evidencePolicy?: CameraEvidencePolicy;
  makeRepId?: (repNumber: number) => string;
};

function frameTimeMs(frame: CameraFrame): number | null {
  const value = new Date(frame.capturedAt).getTime();
  return Number.isFinite(value) ? value : null;
}

function stressSignalLabel(result: DogVisionResult): string | null {
  if (result.stressSignal === 'none') return null;
  return `stress:${result.stressSignal}`;
}

export class CameraCoachOrchestrator {
  private session: LiveCoachSession;
  private readonly visionEngine: DogVisionEngine;
  private readonly minFrameIntervalMs: number;
  private readonly evidencePolicy: CameraEvidencePolicy;
  private readonly makeRepId: (repNumber: number) => string;
  private lastAnalysedFrameAtMs: number | null = null;
  private inFlight = false;
  private pending: CameraCoachPendingConfirmation | null = null;

  constructor(
    session: LiveCoachSession,
    visionEngine: DogVisionEngine,
    options: CameraCoachOrchestratorOptions = {},
  ) {
    this.session = session;
    this.visionEngine = visionEngine;
    this.minFrameIntervalMs = Math.max(0, options.minFrameIntervalMs ?? 500);
    this.evidencePolicy = options.evidencePolicy ?? DEFAULT_CAMERA_EVIDENCE_POLICY;
    this.makeRepId = options.makeRepId ?? ((repNumber) => `${session.id}-rep-${repNumber}`);
  }

  getSession(): LiveCoachSession {
    return this.session;
  }

  getPendingConfirmation(): CameraCoachPendingConfirmation | null {
    return this.pending;
  }

  stopByOwner(): LiveCoachSession {
    this.pending = null;
    this.session = stopLiveCoachSession(this.session);
    return this.session;
  }

  async warmup(): Promise<void> {
    await this.visionEngine.warmup();
  }

  async dispose(): Promise<void> {
    this.pending = null;
    await this.visionEngine.dispose();
  }

  async processFrame(
    frame: CameraFrame,
    observation: CameraRepObservation,
  ): Promise<CameraCoachFrameResult> {
    if (this.session.status === 'complete') {
      return { kind: 'session_complete', session: this.session };
    }

    if (this.inFlight) {
      return { kind: 'busy', session: this.session };
    }

    const frameMs = frameTimeMs(frame);
    if (
      frameMs !== null &&
      this.lastAnalysedFrameAtMs !== null &&
      frameMs - this.lastAnalysedFrameAtMs < this.minFrameIntervalMs
    ) {
      return { kind: 'throttled', session: this.session };
    }

    this.inFlight = true;
    try {
      const vision = await this.visionEngine.detect(frame);
      if (frameMs !== null) this.lastAnalysedFrameAtMs = frameMs;

      const decision = decideCameraRepEvidence(vision, observation, this.evidencePolicy);
      if (decision.kind === 'ask_owner') {
        const pending: CameraCoachPendingConfirmation = {
          vision,
          observation,
          reason: decision.reason,
        };
        this.pending = pending;
        return { kind: 'owner_confirmation', session: this.session, pending };
      }

      const repNumber = this.session.reps.length + 1;
      const rep: TrainingRep = {
        id: this.makeRepId(repNumber),
        repNumber,
        evidence: decision.evidence,
        correction: null,
      };
      const applied = applyRepToLiveSession(this.session, rep);
      this.session = applied.session;
      this.pending = null;

      return {
        kind: 'rep_recorded',
        session: this.session,
        rep,
        decision: applied.decision,
      };
    } finally {
      this.inFlight = false;
    }
  }

  confirmPendingByOwner(outcome: TrainingOutcome, confirmedAt: string): CameraCoachFrameResult {
    if (this.session.status === 'complete') {
      return { kind: 'session_complete', session: this.session };
    }

    if (!this.pending) {
      throw new Error('No camera observation is awaiting owner confirmation.');
    }

    const { vision, observation } = this.pending;
    const repNumber = this.session.reps.length + 1;
    const rep: TrainingRep = {
      id: this.makeRepId(repNumber),
      repNumber,
      evidence: {
        source: 'owner_confirmed',
        confidence: null,
        observedOutcome: outcome,
        observedAt: confirmedAt,
        cueAt: observation.cueAt,
        responseAt: observation.responseAt,
        markerAt: observation.markerAt,
        rewardAt: observation.rewardAt,
        cueCount: observation.cueCount,
        signal: stressSignalLabel(vision) ?? observation.signal,
        posture: vision.posture,
        poseConfidence: vision.postureConfidence,
        notes: observation.notes ?? null,
      },
      correction: null,
    };

    const applied = applyRepToLiveSession(this.session, rep);
    this.session = applied.session;
    this.pending = null;

    return {
      kind: 'rep_recorded',
      session: this.session,
      rep,
      decision: applied.decision,
    };
  }
}
