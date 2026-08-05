import type { Dog, Owner, TrainingSession } from '../../src/domain/models';
import { sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { LessonCatalogue } from '../../src/features/lessons/catalogue';
import { DogLearningPassportQueryService } from '../../src/features/progress/passport/DogLearningPassportQueryService';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { InMemoryStorageAdapter } from '../support/InMemoryStorageAdapter';
import { foundationLesson, lessonProgress, recallLesson } from '../support/lessonFixtures';
import { troubleshooterAttempt } from '../support/troubleshooterFixtures';

const timeZone = 'Australia/Adelaide';

describe('DogLearningPassportQueryService', () => {
  it('combines lesson, session, and real-world evidence without overstating reliability', async () => {
    const { repositories, service } = await setup();
    await repositories.lessonProgress.save(lessonProgress({
      status: 'completed', attempts: 2, successfulCompletions: 1,
      lastAttemptedAt: '2026-08-01T01:00:00.000Z', lastCompletedAt: '2026-08-01T01:00:00.000Z',
    }));
    await repositories.lessonProgress.save(lessonProgress({
      id: 'progress-recall', lessonId: recallLesson.id, status: 'available',
    }));
    await repositories.trainingSessions.save(session({ id: 'focus-session', completedAt: '2026-08-02T01:00:00.000Z' }));
    await repositories.troubleshooterAttempts.save(troubleshooterAttempt({
      id: 'focus-reliable', ownerId: sampleOwner.id, dogId: sampleDog.id,
      topicId: 'focus', scenarioId: 'focus-outdoors', protocolId: 'focus-check-in',
      outcome: 'reliable', environment: 'quiet park', createdAt: '2026-08-03T01:00:00.000Z',
    }));

    const result = await service.get(request());

    expect(result.snapshot).toEqual({
      completedLessons: 1, activeLessons: 0, completedSessions: 1,
      successfulSessions: 1, trainingMinutes: 5, recordedEnvironments: 1,
    });
    expect(result.skills.find((record) => record.skill === 'focus')).toMatchObject({
      evidenceLevel: 'reliable', completedLessons: 1, completedSessions: 1,
      reliableEnvironments: ['quiet park'],
    });
    expect(result.timeline).toEqual([
      expect.objectContaining({ id: 'help:focus-reliable', title: 'Struggles to focus', detail: 'Reliable here · quiet park' }),
      expect.objectContaining({ id: 'session:focus-session', title: foundationLesson.title, detail: 'Successful session · 5 min' }),
    ]);
    expect(result.nextStep).toMatchObject({
      kind: 'lesson', title: `Start ${recallLesson.title}`, lessonId: recallLesson.id,
    });
  });

  it('records a positive check as growing until reliability is explicitly reported', async () => {
    const { repositories, service } = await setup();
    await repositories.troubleshooterAttempts.save(troubleshooterAttempt({
      ownerId: sampleOwner.id, dogId: sampleDog.id, topicId: 'focus', scenarioId: 'focus-outdoors',
      protocolId: 'focus-check-in', outcome: 'slightly-better', environment: 'front yard',
    }));

    const result = await service.get(request());
    expect(result.skills.find((record) => record.skill === 'focus')).toMatchObject({
      evidenceLevel: 'growing', improvingEnvironments: ['front yard'], reliableEnvironments: [],
    });
  });

  it('recommends Help Me Now when the latest real-world check did not improve', async () => {
    const { repositories, service } = await setup();
    await repositories.lessonProgress.save(lessonProgress({ status: 'inProgress', attempts: 1 }));
    await repositories.troubleshooterAttempts.save(troubleshooterAttempt({
      ownerId: sampleOwner.id, dogId: sampleDog.id, outcome: 'no-change', createdAt: '2026-08-05T01:00:00.000Z',
    }));

    await expect(service.get(request())).resolves.toMatchObject({
      nextStep: { kind: 'help-now', title: "Recheck: Doesn't come when called", lessonId: null },
    });
  });

  it('keeps another dog entirely out of the selected dog passport', async () => {
    const { repositories, service } = await setup();
    const otherDog = dog({ id: 'dog-private' });
    await repositories.dogs.save(otherDog);
    await repositories.trainingSessions.save(session({ id: 'selected-session' }));
    await repositories.trainingSessions.save(session({ id: 'private-session', dogId: otherDog.id, durationMinutes: 25 }));
    await repositories.troubleshooterAttempts.save(troubleshooterAttempt({
      id: 'private-help', ownerId: sampleOwner.id, dogId: otherDog.id,
      outcome: 'reliable', environment: 'PRIVATE OTHER DOG PLACE',
    }));

    const result = await service.get(request());
    expect(result.snapshot).toMatchObject({ completedSessions: 1, trainingMinutes: 5, recordedEnvironments: 0 });
    expect(result.timeline.map((item) => item.id)).toEqual(['session:selected-session']);
    expect(JSON.stringify(result)).not.toContain('PRIVATE OTHER DOG PLACE');
  });

  it('fails closed when the selected dog or its evidence has the wrong owner', async () => {
    const ownershipRepositories = createDomainRepositories(new InMemoryStorageAdapter());
    const otherOwner = owner({ id: 'owner-other' });
    await ownershipRepositories.owners.save(sampleOwner);
    await ownershipRepositories.owners.save(otherOwner);
    await ownershipRepositories.dogs.save(dog({ ownerId: otherOwner.id }));

    await expect(createService(ownershipRepositories).get(request())).rejects.toMatchObject({
      code: 'DOG_OWNERSHIP_MISMATCH',
    });

    const { repositories, service } = await setup();
    await repositories.troubleshooterAttempts.save(troubleshooterAttempt({
      ownerId: otherOwner.id, dogId: sampleDog.id,
    }));
    await expect(service.get(request())).rejects.toMatchObject({ code: 'HISTORY_OWNERSHIP_MISMATCH' });
  });
});

async function setup() {
  const repositories = createDomainRepositories(new InMemoryStorageAdapter());
  await repositories.owners.save(sampleOwner);
  await repositories.dogs.save(sampleDog);
  return { repositories, service: createService(repositories) };
}

function createService(repositories: ReturnType<typeof createDomainRepositories>) {
  return new DogLearningPassportQueryService(repositories, LessonCatalogue.load([foundationLesson, recallLesson]));
}

function request() {
  return { ownerId: sampleOwner.id, dogId: sampleDog.id, timeZone };
}

function session(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: 'session-default', dogId: sampleDog.id, lessonId: foundationLesson.id, dailyPlanId: null,
    startedAt: '2026-08-02T00:55:00.000Z', completedAt: '2026-08-02T01:00:00.000Z',
    durationMinutes: 5, outcome: 'success', notes: '', ...overrides,
  };
}

function owner(overrides: Partial<Owner> = {}): Owner { return { ...sampleOwner, ...overrides }; }
function dog(overrides: Partial<Dog> = {}): Dog { return { ...sampleDog, ...overrides }; }
