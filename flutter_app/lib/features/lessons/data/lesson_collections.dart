class LessonCollectionData {
  const LessonCollectionData({
    required this.id,
    required this.label,
    required this.ageLabel,
    required this.description,
    required this.anchorLessonId,
    required this.lessonIds,
  });

  final String id;
  final String label;
  final String ageLabel;
  final String description;
  final String anchorLessonId;
  final List<String> lessonIds;
}

const lessonCollections = <LessonCollectionData>[
  LessonCollectionData(
    id: 'puppy',
    label: 'Puppy',
    ageLabel: 'Up to about 12 months',
    description: 'Short foundation lessons for toilet training, chewing, focus, greetings and early recall.',
    anchorLessonId: 'chewing-puppy-teething-plan',
    lessonIds: <String>[
      'recall-name-response',
      'recall-short-distance',
      'focus-check-in',
      'focus-hold-attention',
      'jumping-four-paws-down',
      'jumping-calm-greetings',
      'chewing-appropriate-items',
      'chewing-redirection-routine',
      'chewing-puppy-teething-plan',
      'house-training-routine',
      'house-training-signal-and-reward',
      'house-training-accident-reset',
      'house-training-clear-outdoor-signal',
      'confidence-choice-and-exploration',
      'confidence-new-surfaces-and-sounds',
      'impulse-control-wait-for-reward',
      'impulse-control-settle-on-mat',
      'loose-lead-reward-zone',
    ],
  ),
  LessonCollectionData(
    id: 'adult',
    label: 'Adult Dog',
    ageLabel: 'About 1 to 7 years',
    description: 'Build reliable everyday skills, solve current problems and maintain good habits.',
    anchorLessonId: 'loose-lead-longer-routes',
    lessonIds: <String>[
      'recall-around-distractions',
      'recall-real-world-maintenance',
      'loose-lead-real-world-distractions',
      'loose-lead-sniffing-rewards',
      'loose-lead-longer-routes',
      'focus-around-distractions',
      'focus-real-world-duration',
      'jumping-visitors-and-excitement',
      'jumping-maintenance-in-public',
      'barking-real-world-management',
      'barking-doorbell-routine',
      'chewing-independence-and-prevention',
      'reactivity-controlled-exposure',
      'reactivity-generalisation-and-maintenance',
      'confidence-new-environments',
      'impulse-control-real-world-distractions',
      'impulse-control-maintenance-and-release',
      'house-training-reliability',
    ],
  ),
  LessonCollectionData(
    id: 'senior',
    label: 'Senior Dog',
    ageLabel: 'Usually 7+ years',
    description: 'Gentle, lower-pressure lessons that support comfort, confidence and familiar routines.',
    anchorLessonId: 'confidence-consent-based-handling',
    lessonIds: <String>[
      'recall-name-response',
      'recall-reward-reset',
      'focus-check-in',
      'focus-predictable-patterns',
      'barking-meet-needs-first',
      'barking-recovery-and-maintenance',
      'house-training-routine',
      'house-training-clear-outdoor-signal',
      'confidence-choice-and-exploration',
      'confidence-consent-based-handling',
      'confidence-recovery-after-surprise',
      'impulse-control-wait-for-reward',
      'impulse-control-settle-on-mat',
      'loose-lead-sniffing-rewards',
      'loose-lead-longer-routes',
    ],
  ),
  LessonCollectionData(
    id: 'rescue',
    label: 'Rescue Dog',
    ageLabel: 'Any age',
    description: 'Patient, choice-led lessons for settling in, trust, safety, confidence and everyday routines.',
    anchorLessonId: 'confidence-recovery-after-surprise',
    lessonIds: <String>[
      'recall-name-response',
      'recall-collar-touch-and-release',
      'focus-check-in',
      'focus-predictable-patterns',
      'jumping-four-paws-down',
      'jumping-station-on-a-mat',
      'barking-identify-triggers',
      'barking-meet-needs-first',
      'chewing-appropriate-items',
      'house-training-routine',
      'confidence-choice-and-exploration',
      'confidence-consent-based-handling',
      'confidence-recovery-after-surprise',
      'reactivity-safe-distance',
      'reactivity-emergency-u-turn',
      'reactivity-recovery-after-trigger',
      'impulse-control-settle-on-mat',
      'impulse-control-leave-it',
    ],
  ),
];

LessonCollectionData lessonCollectionById(String id) {
  return lessonCollections.firstWhere(
    (collection) => collection.id == id,
    orElse: () => lessonCollections.first,
  );
}
