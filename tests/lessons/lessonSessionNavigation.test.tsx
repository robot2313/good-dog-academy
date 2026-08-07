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

  it('completes a lesson, returns Home, and celebrates over the updated Home', async () => {
    const view = render(<App />);
    expect(await view.findByRole('button', { name: 'Your journey so far' })).toBeTruthy();
    fireEvent.press(view.getByRole('tab', { name: 'Categories tab' }));
    expect(await view.findByRole('header', { name: 'Categories' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: /^Recall\. 6 lessons\./ }));
    expect(await view.findByRole('header', { name: 'Recall' })).toBeTruthy();

    fireEvent.press(view.getByRole('button', {
      name: 'Name Response. Recall. Level 1. 6 minutes. Available.',
    }));
    expect(await view.findByText(/GET READY/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Next' }));

    expect(await view.findByRole('header', { name: 'Before You Begin' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Start Lesson' }));

    expect(await view.findByText('SESSION RUNNING')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Complete Lesson' }));
    expect(view.getByRole('header', { name: 'How did it feel?' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: /^5 out of 5/ }));
    const saveButton = view.getByRole('button', { name: 'Save session' });
    fireEvent.press(saveButton);
    fireEvent.press(saveButton);

    // Celebration appears over the Home screen after a successful save.
    expect(await view.findByText('Lesson complete!')).toBeTruthy();
    const repositories = createDomainRepositories(appStorage);
    await waitFor(async () => {
      await expect(repositories.trainingSessions.findAll()).resolves.toHaveLength(1);
    });
    await expect(repositories.progress.findAll()).resolves.toEqual([]);
    await expect(repositories.achievements.findAll()).resolves.toEqual([]);

    // Dismiss the celebration; the updated Home remains visible.
    fireEvent.press(view.getByRole('button', { name: 'Continue' }));
    expect(await view.findByRole('button', { name: 'Your journey so far' })).toBeTruthy();

    // The library reflects the completion.
    fireEvent.press(view.getByRole('tab', { name: 'Categories tab' }));
    expect(await view.findByRole('header', { name: 'Categories' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: /^Recall\. 6 lessons\./ }));
    expect(await view.findByRole('header', { name: 'Recall' })).toBeTruthy();
    expect(view.getByRole('button', {
      name: 'Name Response. Recall. Level 1. 6 minutes. Completed.',
    })).toBeTruthy();
  });

  it('leaves an active session without creating persistent records', async () => {
    const view = render(<App />);
    expect(await view.findByRole('button', { name: 'Your journey so far' })).toBeTruthy();
    fireEvent.press(view.getByRole('tab', { name: 'Categories tab' }));
    expect(await view.findByRole('header', { name: 'Categories' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: /^Recall\. 6 lessons\./ }));
    expect(await view.findByRole('header', { name: 'Recall' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', {
      name: 'Name Response. Recall. Level 1. 6 minutes. Available.',
    }));
    expect(await view.findByText(/GET READY/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Next' }));
    expect(await view.findByRole('header', { name: 'Before You Begin' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Start Lesson' }));
    expect(await view.findByText('SESSION RUNNING')).toBeTruthy();
    // The bottom Back control leaves the active session without saving.
    fireEvent.press(view.getByRole('button', { name: 'Back' }));

    expect(await view.findByText(/GET READY/)).toBeTruthy();
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

  it('propagates dailyPlanId from the Home next-lesson action to the saved session', async () => {
    const view = render(<App />);
    await waitFor(() => expect(
      view.getByRole('button', { name: 'Start next lesson' }).props.accessibilityState,
    ).toEqual({ disabled: false }));

    fireEvent.press(view.getByRole('button', { name: 'Start next lesson' }));
    expect(await view.findByText(/GET READY/)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Next' }));

    expect(await view.findByRole('header', { name: 'Before You Begin' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Start Lesson' }));

    expect(await view.findByText('SESSION RUNNING')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Complete Lesson' }));
    fireEvent.press(view.getByRole('button', { name: /^5 out of 5/ }));
    fireEvent.press(view.getByRole('button', { name: 'Save session' }));
    expect(await view.findByText('Lesson complete!')).toBeTruthy();

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
