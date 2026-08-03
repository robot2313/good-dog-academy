import type { BehaviourSkill } from '../../domain/models';

export type TroubleshooterConcernId = BehaviourSkill;

export type TroubleshooterConcern = {
  readonly id: TroubleshooterConcernId;
  readonly title: string;
  readonly description: string;
  readonly safetyMessage?: string;
};

const concerns: readonly TroubleshooterConcern[] = [
  { id: 'recall', title: "Doesn't come when called", description: 'Build a happier, more reliable response to recall cues.' },
  { id: 'loose-lead-walking', title: 'Pulls on the lead', description: 'Practise calmer movement together without lead pressure.' },
  { id: 'focus', title: 'Struggles to focus', description: 'Help your dog check in and respond around distractions.' },
  { id: 'jumping', title: 'Jumps on people', description: 'Teach calmer greetings with four paws on the floor.' },
  { id: 'barking', title: 'Barks repeatedly', description: 'Understand common triggers and reinforce calmer alternatives.' },
  {
    id: 'chewing',
    title: 'Chews household items',
    description: 'Redirect chewing towards safer, appropriate choices.',
    safetyMessage: 'If your dog may swallow an object or guards items, avoid grabbing it directly. Use distance and seek veterinary or qualified force-free help when safety is uncertain.',
  },
  {
    id: 'reactivity',
    title: 'Lunges or reacts intensely',
    description: 'Start with safe distance, calm observation, and an easy exit.',
    safetyMessage: 'Do not force a greeting or deliberately provoke a reaction. Create distance and seek a qualified force-free trainer or veterinary behaviour professional if reactions are worsening, unpredictable, or could cause injury.',
  },
  {
    id: 'house-training',
    title: 'Toilets in the wrong place',
    description: 'Build a predictable toileting routine and clearer signals.',
    safetyMessage: 'Frequent toileting or a sudden change in a previously reliable dog can have a medical cause. Arrange veterinary advice before assuming it is a training problem.',
  },
  { id: 'confidence', title: 'Worries about new things', description: 'Build confidence gradually without forcing interaction.' },
  { id: 'impulse-control', title: 'Finds waiting difficult', description: 'Practise short, achievable pauses around things your dog wants.' },
];

export const troubleshooterConcerns: readonly TroubleshooterConcern[] = Object.freeze(
  concerns.map((concern) => Object.freeze(concern)),
);

export function concernForId(id: TroubleshooterConcernId): TroubleshooterConcern {
  const concern = troubleshooterConcerns.find((candidate) => candidate.id === id);
  if (!concern) throw new Error(`Unknown troubleshooter concern: ${id}`);
  return concern;
}
