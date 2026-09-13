export type CameraCoachQaEventType =
  | 'session_started'
  | 'rep_started'
  | 'rep_cancelled_for_pause'
  | 'frame_captured'
  | 'frame_analysed'
  | 'owner_confirmation_requested'
  | 'owner_confirmation_recorded'
  | 'automatic_rep_recorded'
  | 'voice_command'
  | 'voice_unclear'
  | 'voice_error'
  | 'session_paused'
  | 'session_resumed'
  | 'save_succeeded'
  | 'save_failed';

export type CameraCoachQaEvent = {
  type: CameraCoachQaEventType;
  at: string;
  detail: string | null;
};

export type CameraCoachQaSnapshot = {
  startedAt: string | null;
  lastEventAt: string | null;
  framesCaptured: number;
  framesAnalysed: number;
  ownerConfirmationsRequested: number;
  ownerConfirmationsRecorded: number;
  automaticRepsRecorded: number;
  voiceCommands: number;
  unclearVoiceResults: number;
  voiceErrors: number;
  pauses: number;
  resumes: number;
  repsCancelledForPause: number;
  saveFailures: number;
  recentEvents: CameraCoachQaEvent[];
};

const initialSnapshot = (): CameraCoachQaSnapshot => ({
  startedAt: null,
  lastEventAt: null,
  framesCaptured: 0,
  framesAnalysed: 0,
  ownerConfirmationsRequested: 0,
  ownerConfirmationsRecorded: 0,
  automaticRepsRecorded: 0,
  voiceCommands: 0,
  unclearVoiceResults: 0,
  voiceErrors: 0,
  pauses: 0,
  resumes: 0,
  repsCancelledForPause: 0,
  saveFailures: 0,
  recentEvents: [],
});

export class CameraCoachQaTelemetry {
  private snapshot: CameraCoachQaSnapshot = initialSnapshot();

  reset(): void {
    this.snapshot = initialSnapshot();
  }

  record(type: CameraCoachQaEventType, detail: string | null = null, at = new Date().toISOString()): CameraCoachQaSnapshot {
    const event: CameraCoachQaEvent = { type, at, detail };
    const next: CameraCoachQaSnapshot = {
      ...this.snapshot,
      startedAt: type === 'session_started' ? at : this.snapshot.startedAt,
      lastEventAt: at,
      recentEvents: [...this.snapshot.recentEvents, event].slice(-20),
    };

    switch (type) {
      case 'frame_captured': next.framesCaptured += 1; break;
      case 'frame_analysed': next.framesAnalysed += 1; break;
      case 'owner_confirmation_requested': next.ownerConfirmationsRequested += 1; break;
      case 'owner_confirmation_recorded': next.ownerConfirmationsRecorded += 1; break;
      case 'automatic_rep_recorded': next.automaticRepsRecorded += 1; break;
      case 'voice_command': next.voiceCommands += 1; break;
      case 'voice_unclear': next.unclearVoiceResults += 1; break;
      case 'voice_error': next.voiceErrors += 1; break;
      case 'session_paused': next.pauses += 1; break;
      case 'session_resumed': next.resumes += 1; break;
      case 'rep_cancelled_for_pause': next.repsCancelledForPause += 1; break;
      case 'save_failed': next.saveFailures += 1; break;
      default: break;
    }

    this.snapshot = next;
    return this.getSnapshot();
  }

  getSnapshot(): CameraCoachQaSnapshot {
    return {
      ...this.snapshot,
      recentEvents: [...this.snapshot.recentEvents],
    };
  }
}
