import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';

import App from '../../App';
import type { Dog, TrainingSession } from '../../src/domain/models';
import {
  sampleBehaviourAssessment,
  sampleBehaviourProfile,
  sampleDog,
  sampleOwner,
  sampleTrainingSession,
} from '../../src/development/seed/sampleData';
import { appStorage } from '../../src/services/appStorage';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';

describe('Progress session-history navigation', () => {
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

  it('opens Session History without rendering legacy four-lesson progress', async () => {
    const view = render(<App />);
    expect(await view.findByText(/focused lesson(?:s)? today\./)).toBeTruthy();

    fireEvent.press(view.getByText('Progress'));
    expect(await view.findByRole('header', { name: 'Progress' })).toBeTruthy();
    expect(await view.findByRole('button', { name: 'View session history' })).toBeTruthy();
    expect(view.getByText(/completed guided sessions are saved per dog/)).toBeTruthy();
    expect(view.queryByText('Foundation completed')).toBeNull();
    expect(view.queryByText('Completed lessons')).toBeNull();
    expect(view.queryByText('Build a Marker Word')).toBeNull();

    fireEvent.press(view.getByRole('button', { name: 'View session history' }));
    expect(await view.findByRole('header', { name: 'Training history' })).toBeTruthy();
    expect(view.getByRole('header', { name: 'No sessions yet' })).toBeTruthy();
  });

  it('keeps another dog private and navigates from an unknown lesson card to detail', async () => {
    const repositories = createDomainRepositories(appStorage);
    const otherDog: Dog = { ...sampleDog, id: 'dog-private-history' };
    const otherSession: TrainingSession = {
      ...sampleTrainingSession,
      id: 'session-private-history',
      dogId: otherDog.id,
      notes: 'PRIVATE OTHER DOG NOTES',
    };
    await repositories.dogs.save(otherDog);
    await repositories.trainingSessions.save(sampleTrainingSession);
    await repositories.trainingSessions.save(otherSession);

    const view = render(<App />);
    expect(await view.findByText(/focused lesson(?:s)? today\./)).toBeTruthy();
    fireEvent.press(view.getByText('Progress'));
    fireEvent.press(await view.findByRole('button', { name: 'View session history' }));

    expect(await view.findByText(sampleTrainingSession.notes)).toBeTruthy();
    expect(view.getByText('Unknown lesson')).toBeTruthy();
    expect(view.queryByText(otherSession.notes)).toBeNull();
    fireEvent.press(view.getByRole('button', {
      name: new RegExp(`Unknown lesson.*${sampleTrainingSession.notes}`),
    }));

    expect(await view.findByText('SESSION DETAIL')).toBeTruthy();
    expect(view.getByRole('header', { name: 'Unknown lesson' })).toBeTruthy();
    expect(view.getByRole('alert')).toBeTruthy();
    expect(view.getByText(sampleTrainingSession.notes)).toBeTruthy();
    expect(view.queryByText(otherSession.notes)).toBeNull();
  });
});
