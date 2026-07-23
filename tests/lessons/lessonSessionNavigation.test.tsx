import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

import App from '../../App';
import {
  sampleBehaviourAssessment,
  sampleBehaviourProfile,
  sampleDog,
  sampleOwner,
} from '../../src/development/seed/sampleData';
import { appStorage } from '../../src/services/appStorage';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';

describe('guided Lesson Session navigation', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    const repositories = createDomainRepositories(appStorage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.behaviourProfiles.save(sampleBehaviourProfile);
    await repositories.behaviourAssessments.save(sampleBehaviourAssessment);
  });

  afterEach(() => {
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it('saves once and refreshes the existing summary and library immediately', async () => {
    const view = render(<App />);
    expect(await view.findByText(/focused lesson(?:s)? today\./)).toBeTruthy();
    fireEvent.press(view.getByText('Academy'));
    expect(await view.findByText('Lesson Library')).toBeTruthy();

    fireEvent.press(view.getByRole('button', {
      name: 'Name Response. Recall. Level 1. 6 minutes. Available.',
    }));
    expect(await view.findByText('LESSON SUMMARY')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Start guided session' }));

    expect(await view.findByText('GUIDED SESSION')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Begin 6-minute session' }));
    expect(view.getByText('SESSION RUNNING')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Finish and rate session' }));
    expect(view.getByRole('header', { name: 'How did it feel?' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: /^5 out of 5/ }));
    const saveButton = view.getByRole('button', { name: 'Save session' });
    fireEvent.press(saveButton);
    fireEvent.press(saveButton);

    expect(await view.findByText('SESSION SAVED')).toBeTruthy();
    const repositories = createDomainRepositories(appStorage);
    await waitFor(async () => {
      await expect(repositories.trainingSessions.findAll()).resolves.toHaveLength(1);
    });
    await expect(repositories.progress.findAll()).resolves.toEqual([]);
    await expect(repositories.achievements.findAll()).resolves.toEqual([]);

    fireEvent.press(view.getByRole('button', { name: 'Back to lesson' }));
    expect(await view.findByText('LESSON SUMMARY')).toBeTruthy();
    expect(view.getByText('Completed')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Practise this lesson again' })).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'Back' }));
    expect(await view.findByText('Lesson Library')).toBeTruthy();
    expect(view.getByRole('button', {
      name: 'Name Response. Recall. Level 1. 6 minutes. Completed.',
    })).toBeTruthy();
    expect(view.getByRole('button', {
      name: 'Short-Distance Recall. Recall. Level 2. 9 minutes. Available.',
    })).toBeTruthy();
  });

  it('leaves an active session without creating persistent records', async () => {
    const view = render(<App />);
    expect(await view.findByText(/focused lesson(?:s)? today\./)).toBeTruthy();
    fireEvent.press(view.getByText('Academy'));
    expect(await view.findByText('Lesson Library')).toBeTruthy();
    fireEvent.press(view.getByRole('button', {
      name: 'Name Response. Recall. Level 1. 6 minutes. Available.',
    }));
    expect(await view.findByText('LESSON SUMMARY')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Start guided session' }));
    expect(await view.findByText('GUIDED SESSION')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Begin 6-minute session' }));
    fireEvent.press(view.getByRole('button', { name: 'Leave without saving' }));

    expect(await view.findByText('LESSON SUMMARY')).toBeTruthy();
    const repositories = createDomainRepositories(appStorage);
    await expect(repositories.trainingSessions.findAll()).resolves.toEqual([]);
    await expect(repositories.lessonProgress.findAll()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({
        lessonId: 'recall-name-response',
        attempts: 0,
        successfulCompletions: 0,
      })]),
    );
  });

  it('propagates dailyPlanId from Today through Lesson Summary to Guided Session', async () => {
    const view = render(<App />);
    expect(await view.findByText(/focused lesson(?:s)? today\./)).toBeTruthy();

    const planLessonButtons = await view.findAllByRole('button', {
      name: /^View /,
    });
    fireEvent.press(planLessonButtons[0]);
    expect(await view.findByText('LESSON SUMMARY')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Start guided session' }));

    expect(await view.findByText('GUIDED SESSION')).toBeTruthy();
    fireEvent.press(view.getByRole('button', {
      name: /^Begin \d+-minute session$/,
    }));
    fireEvent.press(view.getByRole('button', {
      name: 'Finish and rate session',
    }));
    fireEvent.press(view.getByRole('button', { name: /^5 out of 5/ }));
    fireEvent.press(view.getByRole('button', { name: 'Save session' }));
    expect(await view.findByText('SESSION SAVED')).toBeTruthy();

    const repositories = createDomainRepositories(appStorage);
    const [plans, sessions] = await Promise.all([
      repositories.dailyPlans.findAll(),
      repositories.trainingSessions.findAll(),
    ]);
    expect(plans).toHaveLength(1);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].dailyPlanId).toBe(plans[0].id);
  });
});
