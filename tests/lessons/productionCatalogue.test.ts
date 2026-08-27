import type { BehaviourSkill, LessonDefinition, LessonId } from '../../src/domain/models';
import { behaviourSkills } from '../../src/domain/models';
import { LessonCatalogue, bundledLessonDefinitions } from '../../src/features/lessons/catalogue';

const coreProgressions: Record<BehaviourSkill, readonly [LessonId, LessonId, LessonId]> = {
  'recall': ['recall-name-response', 'recall-short-distance', 'recall-around-distractions'],
  'loose-lead-walking': ['loose-lead-reward-zone', 'loose-lead-direction-changes', 'loose-lead-real-world-distractions'],
  'jumping': ['jumping-four-paws-down', 'jumping-calm-greetings', 'jumping-visitors-and-excitement'],
  'barking': ['barking-identify-triggers', 'barking-quiet-reinforcement', 'barking-real-world-management'],
  'chewing': ['chewing-appropriate-items', 'chewing-redirection-routine', 'chewing-independence-and-prevention'],
  'reactivity': ['reactivity-safe-distance', 'reactivity-look-and-disengage', 'reactivity-controlled-exposure'],
  'house-training': ['house-training-routine', 'house-training-signal-and-reward', 'house-training-reliability'],
  'confidence': ['confidence-choice-and-exploration', 'confidence-new-surfaces-and-sounds', 'confidence-new-environments'],
  'impulse-control': ['impulse-control-wait-for-reward', 'impulse-control-doorways', 'impulse-control-real-world-distractions'],
  'focus': ['focus-check-in', 'focus-hold-attention', 'focus-around-distractions'],
};

const expandedProgressions: Record<BehaviourSkill, readonly [LessonId, LessonId, LessonId]> = {
  'recall': ['recall-reward-reset', 'recall-collar-touch-and-release', 'recall-real-world-maintenance'],
  'loose-lead-walking': ['loose-lead-stop-and-reset', 'loose-lead-sniffing-rewards', 'loose-lead-longer-routes'],
  'jumping': ['jumping-station-on-a-mat', 'jumping-greetings-with-movement', 'jumping-maintenance-in-public'],
  'barking': ['barking-meet-needs-first', 'barking-doorbell-routine', 'barking-recovery-and-maintenance'],
  'chewing': ['chewing-puppy-teething-plan', 'chewing-leave-and-trade', 'chewing-rotation-and-settle'],
  'reactivity': ['reactivity-emergency-u-turn', 'reactivity-recovery-after-trigger', 'reactivity-generalisation-and-maintenance'],
  'house-training': ['house-training-accident-reset', 'house-training-clear-outdoor-signal', 'house-training-new-places-and-weather'],
  'confidence': ['confidence-consent-based-handling', 'confidence-recovery-after-surprise', 'confidence-generalise-brave-choices'],
  'impulse-control': ['impulse-control-leave-it', 'impulse-control-settle-on-mat', 'impulse-control-maintenance-and-release'],
  'focus': ['focus-disengage-and-reset', 'focus-predictable-patterns', 'focus-real-world-duration'],
};

function allContent(definition: LessonDefinition): string {
  return [definition.title, definition.shortDescription, definition.goal, ...definition.equipment, ...definition.steps, ...definition.tips, ...definition.commonMistakes, ...definition.troubleshooting.flatMap((item) => [item.problem, item.solution]), ...definition.safetyNotes, definition.completionCriteria.description].join(' ').toLowerCase();
}

describe('production lesson catalogue audit', () => {
  const catalogue = LessonCatalogue.load(bundledLessonDefinitions);

  it('contains exactly 60 active lessons, six for every required skill, and every permanent ID', () => {
    expect(catalogue.definitions).toHaveLength(60);
    expect(catalogue.definitions.every((lesson) => lesson.isActive)).toBe(true);
    for (const skill of behaviourSkills) {
      const expected = [...coreProgressions[skill], ...expandedProgressions[skill]];
      expect(catalogue.definitions.filter((lesson) => lesson.skill === skill)).toHaveLength(6);
      expect(catalogue.definitions.filter((lesson) => lesson.skill === skill).map((lesson) => lesson.id).sort()).toEqual(expected.sort());
    }
    expect(new Set(catalogue.definitions.map((lesson) => lesson.id)).size).toBe(60);
  });

  it('uses content version 1 and complete meaningful production content', () => {
    for (const lesson of catalogue.definitions) {
      expect(lesson.contentVersion).toBe(1);
      expect(lesson.title.length).toBeGreaterThan(5);
      expect(lesson.shortDescription.length).toBeGreaterThan(30);
      expect(lesson.goal.length).toBeGreaterThan(30);
      expect(lesson.equipment.length).toBeGreaterThan(0);
      expect(lesson.steps.length).toBeGreaterThanOrEqual(4);
      expect(lesson.steps.length).toBeLessThanOrEqual(8);
      expect(lesson.steps.every((step, index) => step.startsWith(`${index + 1}. `))).toBe(true);
      expect(lesson.tips.length).toBeGreaterThanOrEqual(3);
      expect(lesson.commonMistakes.length).toBeGreaterThanOrEqual(3);
      expect(lesson.troubleshooting.length).toBeGreaterThanOrEqual(3);
      expect(lesson.safetyNotes.length).toBeGreaterThanOrEqual(1);
      expect(lesson.tags.length).toBeGreaterThan(0);
      expect(lesson.completionCriteria.description.length).toBeGreaterThan(50);
      expect(allContent(lesson)).not.toMatch(/\b(?:placeholder|lorem ipsum|todo|coming soon|fully trained|perfectly trained)\b/);
    }
  });

  it('retains the original three-stage prerequisite paths and time ranges', () => {
    for (const skill of behaviourSkills) {
      const [foundationId, developingId, advancedId] = coreProgressions[skill];
      const foundation = catalogue.requireById(foundationId);
      const developing = catalogue.requireById(developingId);
      const advanced = catalogue.requireById(advancedId);
      expect(foundation).toMatchObject({ difficultyLevel: 1, prerequisites: [] });
      expect(developing).toMatchObject({ difficultyLevel: 2, prerequisites: [{ lessonId: foundationId, minimumSuccessfulCompletions: 1 }] });
      expect(advanced).toMatchObject({ difficultyLevel: 3, prerequisites: [{ lessonId: developingId, minimumSuccessfulCompletions: 1 }] });
      expect(foundation.estimatedMinutes).toBeGreaterThanOrEqual(5);
      expect(foundation.estimatedMinutes).toBeLessThanOrEqual(8);
      expect(developing.estimatedMinutes).toBeGreaterThanOrEqual(7);
      expect(developing.estimatedMinutes).toBeLessThanOrEqual(12);
      expect(advanced.estimatedMinutes).toBeGreaterThanOrEqual(10);
      expect(advanced.estimatedMinutes).toBeLessThanOrEqual(15);
      expect(foundation.estimatedMinutes).toBeLessThan(developing.estimatedMinutes);
      expect(developing.estimatedMinutes).toBeLessThan(advanced.estimatedMinutes);
    }
  });

  it('adds a support, applied, and maintenance path to every skill', () => {
    for (const skill of behaviourSkills) {
      const [foundationId, developingId, advancedId] = coreProgressions[skill];
      const [supportId, appliedId, maintenanceId] = expandedProgressions[skill];
      const support = catalogue.requireById(supportId);
      const applied = catalogue.requireById(appliedId);
      const maintenance = catalogue.requireById(maintenanceId);

      expect(support).toMatchObject({
        difficultyLevel: 2,
        prerequisites: [{ lessonId: foundationId, minimumSuccessfulCompletions: 1 }],
      });
      expect(applied).toMatchObject({
        difficultyLevel: 3,
        prerequisites: [
          { lessonId: developingId, minimumSuccessfulCompletions: 1 },
          { lessonId: supportId, minimumSuccessfulCompletions: 1 },
        ],
      });
      expect(maintenance).toMatchObject({
        difficultyLevel: 4,
        prerequisites: [
          { lessonId: advancedId, minimumSuccessfulCompletions: 1 },
          { lessonId: appliedId, minimumSuccessfulCompletions: 1 },
        ],
      });
      expect(support.estimatedMinutes).toBeLessThan(applied.estimatedMinutes);
      expect(applied.estimatedMinutes).toBeLessThan(maintenance.estimatedMinutes);
    }
  });

  it('has valid references, no cycles, recognised skills/categories, and deterministic ordering', () => {
    const reverseLoaded = LessonCatalogue.load([...bundledLessonDefinitions].reverse());
    expect(reverseLoaded.definitions.map((lesson) => lesson.id)).toEqual(catalogue.definitions.map((lesson) => lesson.id));
    expect(catalogue.definitions.every((lesson) => behaviourSkills.includes(lesson.skill))).toBe(true);
    expect(catalogue.definitions.every((lesson) => ['foundation', 'life-skills', 'behaviour', 'safety'].includes(lesson.category))).toBe(true);
  });

  it('contains no recommendation of prohibited aversive methods', () => {
    const prohibited = ['shock collars', 'prong collars', 'choke chains', 'alpha rolls', 'dominance corrections', 'physical punishment', 'leash jerks'];
    for (const lesson of catalogue.definitions) {
      const sentences = allContent(lesson).split(/[.!?;]/).map((sentence) => sentence.trim()).filter(Boolean);
      for (const phrase of prohibited) {
        for (const sentence of sentences.filter((candidate) => candidate.includes(phrase))) expect(sentence).toMatch(/\b(?:do not|never|avoid|without)\b/);
      }
    }
  });
});
