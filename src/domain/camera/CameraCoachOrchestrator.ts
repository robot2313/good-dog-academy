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
import { PostureBuffer } from './PostureBuffer';
import { TemporalRepGate } from './TemporalRepGate';

export type CameraCoachPendingConfirmation = {
  vision: DogVisionResult;
  observation: CameraRepObservation;
  reason: CameraEvidenceUncertainty;
};

export type CameraCoachFrameResult =
  | { kind: 'throttled'; session: LiveCoachSession }
  | { kind: 'busy'; session: LiveCoachSession }
  | { kind: 'waiting_for_transition'; session: LiveCoachSession }
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
  private readonly postureBuffer: PostureBuffer;
  private readonly repGate: TemporalRepGate;
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
    this.postureBuffer = new PostureBuffer({
      minConfidence: this.evidencePolicy.minPostureConfidence,
    });
    this.repGate = new TemporalRepGate();
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
    this.postureBuffer.reset();
    this.repGate.reset();
    this.session = stopLiveCoachSession(this.session);
    return this.session;
  }

  async warmup(): Promise<void> {
    await this.visionEngine.warmup();
  }

  async dispose(): Promise<void> {
    this.pending = null;
    this.postureBuffer.reset();
    this.repGate.reset();
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
      if (observation.expectedPosture && observation.expectedPosture !== 'unknown' && observation.cueAt) {
        this.repGate.beginCue(observation.cueAt, observation.expectedPosture);
      }

      const vision = await this.visionEngine.detect(frame);
      if (frameMs !== null) this.lastAnalysedFrameAtMs = frameMs;

      const rawDecision = decideCameraRepEvidence(
        vision,
        observation,
        this.evidencePolicy,
      );

      if (
        rawDecision.kind === 'ask_owner' &&
        rawDecision.reason !== 'posture_mismatch'
      ) {
        this.pending = {
          vision,
          observation,
          reason: rawDecision.reason,
        };
        return {
          kind: 'owner_confirmation',
          session: this.session,
          pending: this.pending,
        };
      }

      const temporal = this.postureBuffer.push({
        posture: vision.posture,
        confidence: vision.postureConfidence,
      });

      if (!temporal.stablePosture) {
        this.pending = {
          vision: {
            ...vision,
            posture: 'unknown',
            postureConfidence: null,
          },
          observation,
          reason: 'unstable_posture',
        };
        return {
          kind: 'owner_confirmation',
          session: this.session,
          pending: this.pending,
        };
      }

      const stableVision: DogVisionResult = {
        ...vision,
        posture: temporal.stablePosture,
      };

      if (observation.expectedPosture && observation.expectedPosture !== 'unknown') {
        const gate = this.repGate.observe(temporal.stablePosture, observation.expectedPosture);
        if (!gate.readyToScore && gate.waitingForTransition) {
          return { kind: 'waiting_for_transition', session: this.session };
        }
      }

      const decision = decideCameraRepEvidence(
        stableVision,
        observation,
        this.evidencePolicy,
      );
      if (decision.kind === 'ask_owner') {
        const pending: CameraCoachPendingConfirmation = {
          vision: stableVision,
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
