import { behaviourSkills } from '../../src/domain/models';
import { assessmentQuestions, assessmentResponseOptions } from '../../src/features/assessment/catalogue';
import { AssessmentScoringError, calculateAssessmentScores, scoreQuestion } from '../../src/features/assessment/scoring';

describe('behaviour assessment catalogue', () => {
  it('contains one immutable question for every required skill and unique ids', () => {
    expect(assessmentQuestions.map((question) => question.skill).sort()).toEqual([...behaviourSkills].sort());
    expect(new Set(assessmentQuestions.map((question) => question.id)).size).toBe(assessmentQuestions.length);
    expect(Object.isFrozen(assessmentQuestions)).toBe(true);
    expect(assessmentQuestions.every(Object.isFrozen)).toBe(true);
  });

  it('uses the exact shared frequency options and values', () => {
    expect(assessmentResponseOptions).toEqual([
      { id: 'never', label: 'Never', frequencyValue: 0 }, { id: 'rarely', label: 'Rarely', frequencyValue: 1 },
      { id: 'sometimes', label: 'Sometimes', frequencyValue: 2 }, { id: 'often', label: 'Often', frequencyValue: 3 },
      { id: 'almost-always', label: 'Almost always', frequencyValue: 4 }, { id: 'not-sure', label: 'Not sure / Not observed', frequencyValue: null },
    ]);
  });
});

describe('behaviour assessment scoring', () => {
  const positive = assessmentQuestions.find((question) => question.scoringDirection === 'positive')!;
  const negative = assessmentQuestions.find((question) => question.scoringDirection === 'negative')!;

  it.each([['never', 0], ['rarely', 25], ['sometimes', 50], ['often', 75], ['almost-always', 100]] as const)('scores positive %s as %s', (option, score) => expect(scoreQuestion(positive, option).score).toBe(score));
  it.each([['never', 100], ['rarely', 75], ['sometimes', 50], ['often', 25], ['almost-always', 0]] as const)('reverse-scores negative %s as %s', (option, score) => expect(scoreQuestion(negative, option).score).toBe(score));
  it('scores unknown neutrally and records the skill as unknown', () => {
    const answers = Object.fromEntries(assessmentQuestions.map((question) => [question.id, 'not-sure'])) as Record<string, 'not-sure'>;
    const result = calculateAssessmentScores(answers);
    expect(Object.values(result.calculatedScores)).toEqual(Array(10).fill(50));
    expect(result.unknownSkills).toEqual(assessmentQuestions.map((question) => question.skill));
    expect(result.responses.every((response) => response.frequencyValue === null)).toBe(true);
  });
  it('rejects incomplete answers', () => expect(() => calculateAssessmentScores({})).toThrow(AssessmentScoringError));
});
