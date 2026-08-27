import type { Dog, Owner, TrainingSession } from '../../src/domain/models';
import { sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import {
  maximumTrainingHistoryPageSize,
  TrainingHistoryQueryService,
} from '../../src/features/progress/history/TrainingHistoryQueryService';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { storageKeys } from '../../src/storage/storageKeys';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { foundationLesson } from '../support/lessonFixtures';

const timeZone = 'Australia/Adelaide';

describe('TrainingHistoryQueryService', () => {
  it('returns only the selected dog sessions with honest rating bands', async () => {
    const { repositories, service } = await setup();
    const otherDog = dog({ id: 'dog-other' });
    await repositories.dogs.save(otherDog);
    await saveSessions(repositories, [
      session({ id: 'success', outcome: 'success' }),
      session({ id: 'partial', outcome: 'partial-success' }),
      session({ id: 'unsuccessful', outcome: 'unsuccessful' }),
      session({ id: 'other-session', dogId: otherDog.id }),
    ]);

    const result = await service.list(request());

    expect(result.totalCount).toBe(3);
    expect(result.entries.map((entry) => ({
      id: entry.sessionId,
      dogId: entry.dogId,
      exactRating: entry.exactRating,
      ratingBand: entry.ratingBand,
    }))).toEqual([
      { id: 'partial', dogId: sampleDog.id, exactRating: null, ratingBand: '3' },
      { id: 'success', dogId: sampleDog.id, exactRating: null, ratingBand: '4-5' },
      { id: 'unsuccessful', dogId: sampleDog.id, exactRating: null, ratingBand: '1-2' },
    ]);
  });

  it('validates owner ownership before returning history', async () => {
    const storage = new InMemoryStorageAdapter();
    const repositories = createDomainRepositories(storage);
    const otherOwner = owner({ id: 'owner-other' });
    await repositories.owners.save(sampleOwner);
    await repositories.owners.save(otherOwner);
    await repositories.dogs.save(dog({ ownerId: otherOwner.id }));
    await repositories.trainingSessions.save(session());
    const service = createService(repositories);

    await expect(service.list(request())).rejects.toMatchObject({
      code: 'DOG_OWNERSHIP_MISMATCH',
      context: { ownerId: sampleOwner.id, dogId: sampleDog.id },
    });
  });

  it('does not reveal whether a session belongs to another dog', async () => {
    const { repositories, service } = await setup();
    const otherDog = dog({ id: 'dog-private' });
    await repositories.dogs.save(otherDog);
    await repositories.trainingSessions.save(session({
      id: 'private-session',
      dogId: otherDog.id,
    }));

    let captured: unknown;
    try {
      await service.getById({
        ...request(),
        sessionId: 'private-session',
      });
    } catch (cause) {
      captured = cause;
    }

    expect(captured).toMatchObject({
      code: 'SESSION_NOT_FOUND',
      context: { sessionId: 'private-session' },
    });
    expect(captured).not.toMatchObject({
      context: expect.objectContaining({ dogId: otherDog.id }),
    });
  });

  it('orders newest first and breaks equal timestamp ties by session ID', async () => {
    const { repositories, service } = await setup();
    await saveSessions(repositories, [
      session({ id: 'session-z', completedAt: '2026-07-23T03:00:00.000Z' }),
      session({ id: 'session-b', completedAt: '2026-07-23T04:00:00.000Z' }),
      session({ id: 'session-a', completedAt: '2026-07-23T04:00:00.000Z' }),
    ]);

    await expect(service.list(request())).resolves.toMatchObject({
      entries: [
        { sessionId: 'session-a' },
        { sessionId: 'session-b' },
        { sessionId: 'session-z' },
      ],
    });
  });

  it('returns bounded pages with total and continuation metadata', async () => {
    const { repositories, service } = await setup();
    await saveSessions(repositories, [
      session({ id: 'session-1', completedAt: '2026-07-23T01:00:00.000Z' }),
      session({ id: 'session-2', completedAt: '2026-07-23T02:00:00.000Z' }),
      session({ id: 'session-3', completedAt: '2026-07-23T03:00:00.000Z' }),
    ]);

    await expect(service.list(request({ offset: 1, limit: 1 }))).resolves.toMatchObject({
      entries: [{ sessionId: 'session-2' }],
      totalCount: 3,
      offset: 1,
      limit: 1,
      hasMore: true,
    });
    await expect(service.list(request({ offset: 3, limit: 1 }))).resolves.toMatchObject({
      entries: [],
      totalCount: 3,
      hasMore: false,
    });
    await expect(service.list(request({ limit: maximumTrainingHistoryPageSize + 1 })))
      .rejects.toMatchObject({ code: 'INVALID_LIMIT' });
    await expect(service.list(request({ offset: -1 })))
      .rejects.toMatchObject({ code: 'INVALID_OFFSET' });
  });

  it('uses an explicit timezone for the completed local date', async () => {
    const { repositories, service } = await setup();
    await repositories.trainingSessions.save(session({
      completedAt: '2026-07-23T16:00:00.000Z',
    }));

    await expect(service.getById({
      ...request(),
      sessionId: 'session-default',
    })).resolves.toMatchObject({ localDate: '2026-07-24' });
  });

  it('keeps sessions whose lessons are no longer in the catalogue', async () => {
    const { repositories, service } = await setup();
    await repositories.trainingSessions.save(session({ lessonId: 'retired-lesson' }));

    await expect(service.list(request())).resolves.toMatchObject({
      entries: [{
        lessonId: 'retired-lesson',
        lessonTitle: 'Unknown lesson',
        lessonAvailable: false,
        skill: null,
      }],
    });
  });

  it('excludes incomplete selected-dog records and reports their count', async () => {
    const { repositories, service } = await setup();
    const otherDog = dog({ id: 'dog-other-incomplete' });
    await repositories.dogs.save(otherDog);
    await saveSessions(repositories, [
      session({ id: 'completed' }),
      session({ id: 'no-completion', completedAt: null, outcome: null }),
      session({ id: 'no-outcome', outcome: null }),
      session({
        id: 'other-incomplete',
        dogId: otherDog.id,
        completedAt: null,
        outcome: null,
      }),
    ]);

    await expect(service.list(request())).resolves.toMatchObject({
      entries: [{ sessionId: 'completed' }],
      totalCount: 1,
      excludedIncompleteCount: 2,
    });
    await expect(service.getById({
      ...request(),
      sessionId: 'no-completion',
    })).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });

  it('returns an empty page when the selected dog has no completed history', async () => {
    const { service } = await setup();

    await expect(service.list(request())).resolves.toEqual({
      entries: [],
      totalCount: 0,
      excludedIncompleteCount: 0,
      offset: 0,
      limit: 50,
      hasMore: false,
    });
  });

  it('maps corrupt stored sessions to a typed error', async () => {
    const { storage, service } = await setup();
    await storage.setItem(storageKeys.trainingSessions, [{ id: 'invalid-session' }]);

    await expect(service.list(request())).rejects.toMatchObject({
      code: 'CORRUPT_STORED_DATA',
      context: { ownerId: sampleOwner.id, dogId: sampleDog.id },
    });
  });

  it('rejects invalid timezones before reading history', async () => {
    const { service } = await setup();

    await expect(service.list(request({ timeZone: 'Not/A_Timezone' })))
      .rejects.toMatchObject({ code: 'INVALID_TIMEZONE' });
  });
});

async function setup() {
  const storage = new InMemoryStorageAdapter();
  const repositories = createDomainRepositories(storage);
  await repositories.owners.save(sampleOwner);
  await repositories.dogs.save(sampleDog);
  return {
    storage,
    repositories,
    service: createService(repositories),
  };
}

function createService(
  repositories: ReturnType<typeof createDomainRepositories>,
): TrainingHistoryQueryService {
  return new TrainingHistoryQueryService(
    repositories,
    LessonCatalogue.load([foundationLesson]),
  );
}

function request(
  overrides: Partial<Parameters<TrainingHistoryQueryService['list']>[0]> = {},
) {
  return {
    ownerId: sampleOwner.id,
    dogId: sampleDog.id,
    timeZone,
    ...overrides,
  };
}

async function saveSessions(
  repositories: ReturnType<typeof createDomainRepositories>,
  sessions: readonly TrainingSession[],
): Promise<void> {
  for (const item of sessions) await repositories.trainingSessions.save(item);
}

function session(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 'session-default',
    dogId: sampleDog.id,
    lessonId: foundationLesson.id,
    dailyPlanId: null,
    startedAt: '2026-07-23T02:55:00.000Z',
    completedAt: '2026-07-23T03:00:00.000Z',
    durationMinutes: 5,
    outcome: 'success',
    notes: '',
    ...overrides,
  };
}

function owner(overrides: Partial<Owner> = {}): Owner {
  return { ...sampleOwner, ...overrides };
}

function dog(overrides: Partial<Dog> = {}): Dog {
  return { ...sampleDog, ...overrides };
}
