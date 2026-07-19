import type { BehaviourAssessment, BehaviourProfile, Dog, Owner } from '../../domain/models';
import type { AssessmentAnswers } from './scoring';
import { calculateAssessmentScores } from './scoring';
import type { BehaviourAssessmentTransactionService } from './BehaviourAssessmentTransactionService';

export class AssessmentCompletionService {
  constructor(
    private readonly transactions: BehaviourAssessmentTransactionService,
    private readonly createId: (prefix: string) => string,
    private readonly now: () => string,
  ) {}

  async complete(input: { owner: Owner; dog: Dog; profile: BehaviourProfile; answers: AssessmentAnswers }): Promise<BehaviourAssessment> {
    const result = calculateAssessmentScores(input.answers);
    const completedAt = this.now();
    const assessment: BehaviourAssessment = {
      id: this.createId('behaviour-assessment'),
      ownerId: input.owner.id,
      dogId: input.dog.id,
      responses: result.responses,
      calculatedScores: result.calculatedScores,
      unknownSkills: result.unknownSkills,
      completedAt,
      schemaVersion: 1,
    };
    const profile: BehaviourProfile = {
      ...input.profile,
      skillScores: result.calculatedScores,
      unknownSkills: result.unknownSkills,
      assessmentId: assessment.id,
      updatedAt: completedAt,
    };
    await this.transactions.complete(assessment, profile);
    return assessment;
  }
}
