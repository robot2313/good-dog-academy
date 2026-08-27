import type { TroubleshooterTopicId } from '../../domain/models';
import type { TroubleshooterConcern } from './troubleshooterTypes';

const concerns: readonly TroubleshooterConcern[] = [
  concern('recall', 'recall', "Doesn't come when called", 'Build a safer, happier return without testing recall in unsafe places.', [
    ['recall-inside-not-outside', 'Comes inside but not outdoors', 'not_generalised', 'The recall works in an easy room but has not yet transferred outdoors.'],
    ['recall-near-distractions', 'Ignores the cue around people, dogs, or smells', 'high_distraction', 'The current distraction is competing strongly with the recall cue.'],
    ['recall-stops-halfway', 'Starts coming, then stops or turns away', 'reward_not_effective', 'Returning may not yet be rewarding enough through the whole movement.'],
  ]),
  concern('name-response', 'recall', "Doesn't respond to their name", 'Rebuild the name as one clear cue to turn and orient.', [
    ['name-repeated', 'Responds only after the name is repeated', 'cue_not_understood', 'Repeated use has made the first name cue less meaningful.'],
    ['name-food-visible', 'Responds only when food is visible', 'handler_timing_or_cue_issue', 'Visible food may have become part of the cue.'],
    ['name-outdoors', 'Responds indoors but not elsewhere', 'not_generalised', 'The name response has not yet transferred to harder environments.'],
  ]),
  concern('sit', 'impulse-control', "Sit isn't working", 'Clarify the signal and fade visible food without pushing the dog into position.', [
    ['sit-visible-food', 'Sits only when food is visible', 'handler_timing_or_cue_issue', 'The visible lure may have become part of the sit signal.'],
    ['sit-slow-or-reluctant', 'Sits slowly or seems reluctant', 'overexcited_frustrated_or_fearful', 'Comfort, footing, arousal, or uncertainty may be affecting the response.'],
    ['sit-new-place', 'Sits at home but not elsewhere', 'not_generalised', 'The sit response has not yet transferred to this environment.'],
  ]),
  concern('stay', 'impulse-control', 'Breaks a stay', 'Build duration in tiny increments with a clear release cue.', [
    ['stay-breaks-immediately', 'Breaks almost immediately', 'difficulty_increased_too_quickly', 'The first duration step is currently too difficult or the release is unclear.'],
    ['stay-handler-moves', 'Stays only while I stand still', 'difficulty_increased_too_quickly', 'Handler movement was added before the stationary duration was fluent.'],
    ['stay-distractions', 'Breaks when anything happens nearby', 'high_distraction', 'The distraction level is beyond the dog’s current stay skill.'],
  ]),
  concern('loose-lead-walking', 'loose-lead-walking', 'Pulls on the lead', 'Practise slack-lead movement while protecting comfort and safety.', [
    ['lead-pulls-from-start', 'Pulls from the doorway or start of the walk', 'overexcited_frustrated_or_fearful', 'Arousal is already high before loose-lead practice begins.'],
    ['lead-pulls-at-dogs', 'Pulls when dogs appear', 'high_distraction', 'Other dogs are too close or intense for the current walking skill.'],
    ['lead-late-walk', 'Walking gets worse later in the walk', 'session_too_long_or_dog_disengaged', 'Fatigue, stress, or accumulated excitement may be reducing engagement.'],
  ]),
  concern('settling', 'impulse-control', 'Finds waiting or settling difficult', 'Capture small calm moments and build short, comfortable pauses.', [
    ['settle-more-excited', 'Gets more excited when asked to settle', 'overexcited_frustrated_or_fearful', 'The request may be adding frustration when arousal is already high.'],
    ['settle-leaves-mat', 'Leaves the mat after a few seconds', 'difficulty_increased_too_quickly', 'Mat duration has increased beyond the dog’s current comfort.'],
    ['settle-busy-place', 'Settles at home but not in busy places', 'not_generalised', 'Settling has not yet transferred to that level of activity.'],
  ]),
  concern('jumping', 'jumping', 'Jumps on people', 'Use management and teach four paws down during controlled greetings.', [
    ['jump-visitors', 'Jumps when visitors arrive', 'high_distraction', 'Visitor arrival is currently too exciting for a calm greeting response.'],
    ['jump-food-visible', 'Stays down only while food is visible', 'handler_timing_or_cue_issue', 'Visible food may be prompting position rather than reinforcing it.'],
    ['jump-long-greeting', 'Starts calmly, then jumps during greeting', 'session_too_long_or_dog_disengaged', 'The greeting may be lasting longer than the dog can stay regulated.'],
  ]),
  concern('barking', 'barking', 'Barks repeatedly', 'Identify the trigger and reinforce a safe, calmer alternative.', [
    ['bark-window-door', 'Barks at sights or sounds near home', 'high_distraction', 'The trigger is close, repeated, or difficult to leave.'],
    ['bark-for-attention', 'Barks to start play, food, or attention', 'handler_timing_or_cue_issue', 'Barking may sometimes be followed by the outcome the dog wants.'],
    ['bark-unpredictable', 'Barking seems new or unpredictable', 'overexcited_frustrated_or_fearful', 'A sudden or unclear change needs health and context checks before training.'],
  ]),
  concern('focus', 'focus', 'Struggles to focus', 'Lower the difficulty and reward voluntary check-ins.', [
    ['focus-outdoors', 'Focus disappears outdoors', 'high_distraction', 'The environment is currently more rewarding or intense than the training setup.'],
    ['focus-short', 'Engages briefly, then wanders away', 'session_too_long_or_dog_disengaged', 'The working period may be longer than the dog can currently sustain.'],
    ['focus-food', 'Watches food rather than the signal', 'handler_timing_or_cue_issue', 'Food position may be overshadowing the intended cue.'],
  ]),
  concern('chewing', 'chewing', 'Chews household items', 'Prevent unsafe access and make suitable chewing choices worthwhile.', [
    ['chew-ignores-safe', 'Ignores the safe chew', 'reward_not_effective', 'The offered chew may not match the dog’s preferred texture or function.'],
    ['chew-when-alone', 'Chews destructively when left alone', 'overexcited_frustrated_or_fearful', 'Separation distress or unmet needs may be contributing.'],
    ['chew-steals-runs', 'Takes objects and runs away', 'handler_timing_or_cue_issue', 'Chasing or direct removal may have made possession more valuable.'],
  ]),
  concern('reactivity', 'reactivity', 'Lunges or reacts intensely', 'Create distance, prevent forced encounters, and prioritise safe exits.', [
    ['react-dogs', 'Reacts when dogs appear', 'high_distraction', 'The dog trigger is inside the current safe working distance.'],
    ['react-people', 'Reacts to unfamiliar people', 'overexcited_frustrated_or_fearful', 'Fear, frustration, or conflict may be building around people.'],
    ['react-cannot-recover', 'Cannot recover after a reaction', 'difficulty_increased_too_quickly', 'The exposure was too intense or lasted too long for recovery.'],
  ]),
  concern('house-training', 'house-training', 'Toilets in the wrong place', 'Use timing, supervision, and immediate outdoor reinforcement.', [
    ['toilet-predictable', 'Accidents happen at predictable times', 'handler_timing_or_cue_issue', 'The outing schedule may be arriving after the dog’s current need.'],
    ['toilet-new-room', 'Accidents happen after gaining more freedom', 'difficulty_increased_too_quickly', 'Household access increased before the routine was reliable there.'],
    ['toilet-regression', 'A previously reliable dog has suddenly regressed', 'overexcited_frustrated_or_fearful', 'Sudden regression can have medical, pain, stress, or routine causes.'],
  ]),
  concern('confidence', 'confidence', 'Worries about new things', 'Use distance, choice, and gradual exposure without forcing contact.', [
    ['fear-object', 'Avoids an unfamiliar object or surface', 'difficulty_increased_too_quickly', 'The object is currently too close, intense, or unpredictable.'],
    ['fear-sounds', 'Startles or hides after sounds', 'overexcited_frustrated_or_fearful', 'The sound level or unpredictability is creating worry.'],
    ['fear-new-place', 'Cannot relax in a new place', 'high_distraction', 'The new environment contains more novelty than the dog can process comfortably.'],
  ]),
];

export const troubleshooterConcerns: readonly TroubleshooterConcern[] = Object.freeze(concerns);

export function concernForId(id: TroubleshooterTopicId): TroubleshooterConcern {
  const concernItem = troubleshooterConcerns.find((candidate) => candidate.id === id);
  if (!concernItem) throw new Error(`Unknown troubleshooter concern: ${id}`);
  return concernItem;
}

function concern(
  id: TroubleshooterTopicId,
  lessonSkill: TroubleshooterConcern['lessonSkill'],
  title: string,
  description: string,
  scenarios: readonly (readonly [string, string, TroubleshooterScenarioCategory, string])[],
): TroubleshooterConcern {
  return Object.freeze({
    id,
    lessonSkill,
    title,
    description,
    scenarios: Object.freeze(scenarios.map(([scenarioId, label, failureCategory, selectionReason]) => Object.freeze({
      id: scenarioId,
      label,
      failureCategory,
      selectionReason,
    }))),
  });
}

type TroubleshooterScenarioCategory = TroubleshooterConcern['scenarios'][number]['failureCategory'];
