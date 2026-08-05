import type { TroubleshooterTopicId } from '../../domain/models';
import type { TroubleshooterResponseState } from './troubleshooterTypes';

export type HelpNowSituation = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly topicId: TroubleshooterTopicId;
  readonly scenarioId: string;
};

export const helpNowSituations: readonly HelpNowSituation[] = Object.freeze([
  situation('dog-nearby', 'Another dog is too close', 'Create space and get a safe next step for lunging, barking, or intense staring.', 'reactivity', 'react-dogs'),
  situation('visitor-arriving', 'A visitor is arriving', 'Handle barking or over-excited greetings without forcing contact.', 'barking', 'bark-window-door'),
  situation('pulling-now', 'Pulling hard on the lead', 'Reset the walk without dragging, jerking, or battling the lead.', 'loose-lead-walking', 'lead-pulls-from-start'),
  situation('recall-now', "Won't come back", 'Protect safety and rebuild a return without repeatedly testing the cue.', 'recall', 'recall-near-distractions'),
  situation('cannot-focus', "Can't focus or take food", 'Work out whether the situation is currently too difficult for learning.', 'focus', 'focus-outdoors'),
  situation('frightened-now', 'Frightened, hiding, or panicking', 'Use distance and choice, and check whether training should stop.', 'confidence', 'fear-new-place'),
  situation('sudden-change', 'Behaviour changed suddenly', 'Pause and check pain, health, and immediate safety before treating it as training.', 'confidence', 'fear-new-place'),
]);

export const helpNowResponseOptions: readonly { id: TroubleshooterResponseState; label: string }[] = Object.freeze([
  { id: 'can-eat-and-respond', label: 'Can eat and respond to one easy cue' },
  { id: 'distraction-too-strong', label: 'Cannot focus because the trigger is too strong' },
  { id: 'usual-reward-not-working', label: 'Usually takes this reward, but will not take it now' },
  { id: 'works-only-in-familiar-place', label: 'Can do it only somewhere quieter or more familiar' },
  { id: 'disengages-quickly', label: 'Engages briefly, then switches off or moves away' },
]);

function situation(
  id: string,
  title: string,
  description: string,
  topicId: TroubleshooterTopicId,
  scenarioId: string,
): HelpNowSituation {
  return Object.freeze({ id, title, description, topicId, scenarioId });
}
