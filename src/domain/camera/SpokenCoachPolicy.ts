import type { SessionDirectorDecision } from '../behaviour/LiveCoachEngine';
import type { CameraCoachPendingConfirmation } from './CameraCoachOrchestrator';

export type SpokenCoachEvent =
  | { type: 'session_started'; dogName: string }
  | { type: 'rep_started'; repNumber: number }
  | { type: 'owner_confirmation'; pending: CameraCoachPendingConfirmation }
  | { type: 'director_decision'; decision: SessionDirectorDecision }
  | { type: 'session_paused' }
  | { type: 'session_resumed' }
  | { type: 'session_finished' };

export type SpokenCoachMessage = {
  text: string;
  priority: 'normal' | 'safety';
  interrupt: boolean;
};

export function spokenCoachMessage(event: SpokenCoachEvent): SpokenCoachMessage {
  switch (event.type) {
    case 'session_started':
      return {
        text: `Camera Coach is ready for ${event.dogName}. Give each cue once, then wait for the response.`,
        priority: 'normal',
        interrupt: true,
      };
    case 'rep_started':
      return {
        text: `Rep ${event.repNumber}. Give the cue once, then wait.`,
        priority: 'normal',
        interrupt: false,
      };
    case 'owner_confirmation':
      return {
        text: 'I am not confident enough to score that rep automatically. Please confirm what happened.',
        priority: 'normal',
        interrupt: true,
      };
    case 'director_decision': {
      const { decision } = event;
      const safety = decision.action === 'break';
      return {
        text: safety
          ? `Pause here. ${decision.instruction}`
          : `${decision.headline}. ${decision.instruction}`,
        priority: safety ? 'safety' : 'normal',
        interrupt: safety || decision.action === 'finish',
      };
    }
    case 'session_paused':
      return {
        text: 'Training paused. No rep will be scored while paused. Say resume when you are ready.',
        priority: 'normal',
        interrupt: true,
      };
    case 'session_resumed':
      return {
        text: 'Training resumed. We will continue from the same session.',
        priority: 'normal',
        interrupt: true,
      };
    case 'session_finished':
      return {
        text: 'Session complete. Finish on a calm note and let your dog reset.',
        priority: 'normal',
        interrupt: true,
      };
  }
}
