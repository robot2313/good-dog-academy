import 'assessment_models.dart';

enum AssessmentSection { everyday, home, control }

class AssessmentQuestion {
  const AssessmentQuestion({
    required this.id,
    required this.section,
    required this.skill,
    required this.text,
    required this.scoringDirection,
    this.explanation,
  });

  final String id;
  final AssessmentSection section;
  final String skill;
  final String text;
  final String? explanation;
  final ScoringDirection scoringDirection;
}

const assessmentQuestions = <AssessmentQuestion>[
  AssessmentQuestion(
    id: 'recall-familiar',
    section: AssessmentSection.everyday,
    skill: 'recall',
    text: 'How often does your dog return when called in a familiar, low-distraction area?',
    scoringDirection: ScoringDirection.positive,
  ),
  AssessmentQuestion(
    id: 'lead-pulling',
    section: AssessmentSection.everyday,
    skill: 'loose-lead-walking',
    text: 'How often does your dog pull hard while walking on lead?',
    explanation: 'Think about ordinary walks rather than unusually exciting situations.',
    scoringDirection: ScoringDirection.negative,
  ),
  AssessmentQuestion(
    id: 'focus-handler',
    section: AssessmentSection.everyday,
    skill: 'focus',
    text: 'How often can your dog focus on you for a few seconds in a familiar place?',
    scoringDirection: ScoringDirection.positive,
  ),
  AssessmentQuestion(
    id: 'jumping-greetings',
    section: AssessmentSection.home,
    skill: 'jumping',
    text: 'How often does your dog jump up when greeting people?',
    scoringDirection: ScoringDirection.negative,
  ),
  AssessmentQuestion(
    id: 'barking-home',
    section: AssessmentSection.home,
    skill: 'barking',
    text: 'How often does your dog bark repeatedly at everyday sounds or activity around the home?',
    scoringDirection: ScoringDirection.negative,
  ),
  AssessmentQuestion(
    id: 'chewing-items',
    section: AssessmentSection.home,
    skill: 'chewing',
    text: 'How often does your dog chew household items that are not intended for them?',
    scoringDirection: ScoringDirection.negative,
  ),
  AssessmentQuestion(
    id: 'house-training',
    section: AssessmentSection.home,
    skill: 'house-training',
    text: 'How often does your dog toilet in the appropriate place?',
    scoringDirection: ScoringDirection.positive,
  ),
  AssessmentQuestion(
    id: 'reactivity',
    section: AssessmentSection.control,
    skill: 'reactivity',
    text: 'How often does your dog lunge, snap, or react intensely toward people or other dogs?',
    explanation: 'Choose the closest answer based on what you have observed. This is not a diagnosis.',
    scoringDirection: ScoringDirection.negative,
  ),
  AssessmentQuestion(
    id: 'confidence-new',
    section: AssessmentSection.control,
    skill: 'confidence',
    text: 'How often does your dog recover calmly after encountering something unfamiliar?',
    scoringDirection: ScoringDirection.positive,
  ),
  AssessmentQuestion(
    id: 'impulse-control',
    section: AssessmentSection.control,
    skill: 'impulse-control',
    text: 'How often can your dog pause or wait briefly before taking something they want?',
    scoringDirection: ScoringDirection.positive,
  ),
];

List<AssessmentQuestion> questionsForSection(AssessmentSection section) =>
    assessmentQuestions.where((question) => question.section == section).toList(growable: false);

String assessmentOptionLabel(AssessmentOption option) {
  switch (option) {
    case AssessmentOption.never:
      return 'Never';
    case AssessmentOption.rarely:
      return 'Rarely';
    case AssessmentOption.sometimes:
      return 'Sometimes';
    case AssessmentOption.often:
      return 'Often';
    case AssessmentOption.almostAlways:
      return 'Almost always';
    case AssessmentOption.notSure:
      return 'Not sure / Not observed';
  }
}

String behaviourSkillLabel(String skill) {
  const labels = <String, String>{
    'recall': 'Recall',
    'loose-lead-walking': 'Loose lead walking',
    'jumping': 'Jumping',
    'barking': 'Barking',
    'chewing': 'Chewing',
    'reactivity': 'Reactivity',
    'house-training': 'House training',
    'confidence': 'Confidence',
    'impulse-control': 'Impulse control',
    'focus': 'Focus',
  };
  return labels[skill] ?? skill;
}
