import type {
  TroubleshooterAttempt,
  TroubleshooterFallbackLevel,
  TroubleshooterOutcome,
} from '../../domain/models';
import type { TroubleshooterAttemptRepository } from '../../domain/repositories';
import { createLocalId } from '../../utils/ids';
import type { ResolvedTroubleshooterResult, TroubleshooterDiagnosticAnswers } from './troubleshooterTypes';

export type RecordTroubleshooterOutcomeRequest = {
  readonly ownerId: string;
  readonly dogId: string;
  readonly answers: TroubleshooterDiagnosticAnswers;
  readonly result: Pick<ResolvedTroubleshooterResult, 'failureCategory' | 'fallbackLevel' | 'protocol'>;
  readonly outcome: TroubleshooterOutcome;
};

export class TroubleshooterHistoryService {
  constructor(
    private readonly repository: TroubleshooterAttemptRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: (prefix: string) => string = createLocalId,
  ) {}

  async listForDog(dogId: string): Promise<readonly TroubleshooterAttempt[]> {
    if (!dogId.trim()) throw new Error('dogId is required');
    return Object.freeze((await this.repository.findAll())
      .filter((attempt) => attempt.dogId === dogId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  }

  async recordOutcome(request: RecordTroubleshooterOutcomeRequest): Promise<TroubleshooterAttempt> {
    if (!request.ownerId.trim() || !request.dogId.trim()) throw new Error('ownerId and dogId are required');
    const attempt: TroubleshooterAttempt = Object.freeze({
      id: this.createId('troubleshooter-attempt'),
      ownerId: request.ownerId,
      dogId: request.dogId,
      topicId: request.answers.topicId,
      scenarioId: request.answers.scenarioId,
      failureCategory: request.result.failureCategory,
      protocolId: request.result.protocol.id,
      protocolVersion: request.result.protocol.protocolVersion,
      fallbackLevel: request.result.fallbackLevel as TroubleshooterFallbackLevel,
      outcome: request.outcome,
      environment: request.answers.environment.trim() || 'the current environment',
      createdAt: this.now().toISOString(),
    });
    await this.repository.save(attempt);
    return attempt;
  }
}
