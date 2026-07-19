import type { AssessmentOption, AssessmentResponse, BehaviourSkill } from '../../domain/models';
import { createNeutralSkillScores } from '../../domain/behaviour/skillScores';
import { assessmentQuestions, type AssessmentQuestion } from './catalogue';

export type AssessmentAnswers = Record<string, AssessmentOption | undefined>;
export type AssessmentScoreResult = {
  responses: AssessmentResponse[];
  calculatedScores: Record<BehaviourSkill, number>;
  unknownSkills: BehaviourSkill[];
};

export class AssessmentScoringError extends Error {}

export function scoreQuestion(question: AssessmentQuestion, option: AssessmentOption): { score: number; response: AssessmentResponse; unknown: boolean } {
  const responseOption = question.options.find((candidate) => candidate.id === option);
  if (!responseOption) throw new AssessmentScoringError(`Invalid response option for ${question.id}.`);
  const value = responseOption.frequencyValue;
  const score = value === null ? 50 : question.scoringDirection === 'positive' ? value * 25 : (4 - value) * 25;
  return {
    score,
    unknown: value === null,
    response: { questionId: question.id, skill: question.skill, selectedOption: option, frequencyValue: value, scoringDirection: question.scoringDirection },
  };
}

export function calculateAssessmentScores(answers: AssessmentAnswers): AssessmentScoreResult {
  const calculatedScores = createNeutralSkillScores();
  const unknownSkills: BehaviourSkill[] = [];
  const responses = assessmentQuestions.map((question) => {
    const answer = answers[question.id];
    if (!answer) throw new AssessmentScoringError(`Missing response for ${question.id}.`);
    const result = scoreQuestion(question, answer);
    calculatedScores[question.skill] = result.score;
    if (result.unknown) unknownSkills.push(question.skill);
    return result.response;
  });
  return { responses, calculatedScores, unknownSkills };
}

export function hasSevereReactivityResponse(answers: AssessmentAnswers): boolean {
  const response = answers.reactivity;
  return response === 'often' || response === 'almost-always';
}
