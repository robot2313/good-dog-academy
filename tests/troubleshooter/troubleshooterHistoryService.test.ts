import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { TroubleshooterHistoryService } from '../../src/features/troubleshooter/TroubleshooterHistoryService';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { troubleshooterAttempt } from '../support/troubleshooterFixtures';

describe('TroubleshooterHistoryService', () => {
  it('treats an existing legacy database with no Troubleshooter key as empty', async () => {
    const repositories = createDomainRepositories(new InMemoryStorageAdapter());
    await expect(new TroubleshooterHistoryService(repositories.troubleshooterAttempts).listForDog('dog-1')).resolves.toEqual([]);
  });

  it('records the presented fallback and outcome for the selected dog', async () => {
    const repositories = createDomainRepositories(new InMemoryStorageAdapter());
    const service = new TroubleshooterHistoryService(
      repositories.troubleshooterAttempts,
      () => new Date('2026-08-04T01:02:03.000Z'),
      () => 'attempt-new',
    );

    const saved = await service.recordOutcome({
      ownerId: 'owner-1',
      dogId: 'dog-1',
      answers: {
        topicId: 'stay', scenarioId: 'stay-breaks-immediately', bodyState: 'relaxed-and-engaged',
        responseState: 'can-eat-and-respond', environment: 'lounge room',
      },
      result: {
        failureCategory: 'difficulty_increased_too_quickly', fallbackLevel: 2,
        protocol: { id: 'stay-one-second', protocolVersion: 1 },
      } as Parameters<TroubleshooterHistoryService['recordOutcome']>[0]['result'],
      outcome: 'successful-once',
    });

    expect(saved).toEqual(expect.objectContaining({
      id: 'attempt-new', topicId: 'stay', scenarioId: 'stay-breaks-immediately', fallbackLevel: 2,
      outcome: 'successful-once', environment: 'lounge room', createdAt: '2026-08-04T01:02:03.000Z',
    }));
    await expect(repositories.troubleshooterAttempts.findById('attempt-new')).resolves.toEqual(saved);
  });

  it('returns only the selected dog history in chronological order', async () => {
    const repositories = createDomainRepositories(new InMemoryStorageAdapter());
    await repositories.troubleshooterAttempts.save(troubleshooterAttempt({ id: 'later', createdAt: '2026-08-05T00:00:00.000Z' }));
    await repositories.troubleshooterAttempts.save(troubleshooterAttempt({ id: 'other-dog', dogId: 'dog-2' }));
    await repositories.troubleshooterAttempts.save(troubleshooterAttempt({ id: 'earlier', createdAt: '2026-08-03T00:00:00.000Z' }));

    await expect(new TroubleshooterHistoryService(repositories.troubleshooterAttempts).listForDog('dog-1'))
      .resolves.toEqual([expect.objectContaining({ id: 'earlier' }), expect.objectContaining({ id: 'later' })]);
  });
});
