import type { AssessmentOption, BehaviourSkill, ScoringDirection } from '../../domain/models';

export type AssessmentSection = 'everyday' | 'home' | 'control';
export type AssessmentResponseOption = { id: AssessmentOption; label: string; frequencyValue: 0 | 1 | 2 | 3 | 4 | null };
export type AssessmentQuestion = {
  id: string;
  section: AssessmentSection;
  skill: BehaviourSkill;
  text: string;
  explanation?: string;
  scoringDirection: ScoringDirection;
  options: readonly AssessmentResponseOption[];
};

export const assessmentResponseOptions: readonly AssessmentResponseOption[] = Object.freeze([
  Object.freeze({ id: 'never', label: 'Never', frequencyValue: 0 }),
  Object.freeze({ id: 'rarely', label: 'Rarely', frequencyValue: 1 }),
  Object.freeze({ id: 'sometimes', label: 'Sometimes', frequencyValue: 2 }),
  Object.freeze({ id: 'often', label: 'Often', frequencyValue: 3 }),
  Object.freeze({ id: 'almost-always', label: 'Almost always', frequencyValue: 4 }),
  Object.freeze({ id: 'not-sure', label: 'Not sure / Not observed', frequencyValue: null }),
]);

const questions: AssessmentQuestion[] = [
  { id: 'recall-familiar', section: 'everyday', skill: 'recall', text: 'How often does your dog return when called in a familiar, low-distraction area?', scoringDirection: 'positive', options: assessmentResponseOptions },
  { id: 'lead-pulling', section: 'everyday', skill: 'loose-lead-walking', text: 'How often does your dog pull hard while walking on lead?', explanation: 'Think about ordinary walks rather than unusually exciting situations.', scoringDirection: 'negative', options: assessmentResponseOptions },
  { id: 'focus-handler', section: 'everyday', skill: 'focus', text: 'How often can your dog focus on you for a few seconds in a familiar place?', scoringDirection: 'positive', options: assessmentResponseOptions },
  { id: 'jumping-greetings', section: 'home', skill: 'jumping', text: 'How often does your dog jump up when greeting people?', scoringDirection: 'negative', options: assessmentResponseOptions },
  { id: 'barking-home', section: 'home', skill: 'barking', text: 'How often does your dog bark repeatedly at everyday sounds or activity around the home?', scoringDirection: 'negative', options: assessmentResponseOptions },
  { id: 'chewing-items', section: 'home', skill: 'chewing', text: 'How often does your dog chew household items that are not intended for them?', scoringDirection: 'negative', options: assessmentResponseOptions },
  { id: 'house-training', section: 'home', skill: 'house-training', text: 'How often does your dog toilet in the appropriate place?', scoringDirection: 'positive', options: assessmentResponseOptions },
  { id: 'reactivity', section: 'control', skill: 'reactivity', text: 'How often does your dog lunge, snap, or react intensely toward people or other dogs?', explanation: 'Choose the closest answer based on what you have observed. This is not a diagnosis.', scoringDirection: 'negative', options: assessmentResponseOptions },
  { id: 'confidence-new', section: 'control', skill: 'confidence', text: 'How often does your dog recover calmly after encountering something unfamiliar?', scoringDirection: 'positive', options: assessmentResponseOptions },
  { id: 'impulse-control', section: 'control', skill: 'impulse-control', text: 'How often can your dog pause or wait briefly before taking something they want?', scoringDirection: 'positive', options: assessmentResponseOptions },
];

export const assessmentQuestions: readonly AssessmentQuestion[] = Object.freeze(questions.map((question) => Object.freeze(question)));

export function questionsForSection(section: AssessmentSection): readonly AssessmentQuestion[] {
  return assessmentQuestions.filter((question) => question.section === section);
}
