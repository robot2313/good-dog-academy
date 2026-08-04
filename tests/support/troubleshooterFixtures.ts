import type { TroubleshooterAttempt } from '../../src/domain/models';

export function troubleshooterAttempt(overrides: Partial<TroubleshooterAttempt> = {}): TroubleshooterAttempt {
  return {
    id: 'troubleshooter-attempt-1',
    ownerId: 'owner-1',
    dogId: 'dog-1',
    topicId: 'recall',
    scenarioId: 'recall-inside-not-outside',
    failureCategory: 'not_generalised',
    protocolId: 'recall-reset',
    protocolVersion: 1,
    fallbackLevel: 1,
    outcome: 'no-change',
    environment: 'quiet backyard',
    createdAt: '2026-08-04T00:00:00.000Z',
    ...overrides,
  };
}
