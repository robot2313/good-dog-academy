import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render } from '@testing-library/react-native';

import App from '../../App';
import { sampleBehaviourAssessment, sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { appStorage } from '../../src/services/appStorage';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';

describe('Lesson Library navigation', () => {
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

  it('opens available and locked summaries through the existing Academy tab', async () => {
    const view = render(<App />);
    expect(await view.findByText('One focused session today.')).toBeTruthy();
    fireEvent.press(view.getByText('Academy'));

    expect(await view.findByText('Lesson Library')).toBeTruthy();
    expect(view.getByText(sampleDog.name)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Name Response. Recall. Level 1. 6 minutes. Available.' }));
    expect(await view.findByText('LESSON SUMMARY')).toBeTruthy();
    expect(view.getByText('Guided practice available')).toBeTruthy();
    expect(view.getByRole('image', { name: /Recall training illustration/ })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Start guided session' })).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'Back' }));
    expect(await view.findByText('Lesson Library')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Short-Distance Recall. Recall. Level 2. 9 minutes. Locked. Complete Name Response first.' }));
    expect(await view.findByText('WHY THIS IS LOCKED')).toBeTruthy();
    expect(view.getByText('Complete Name Response first.')).toBeTruthy();
    expect(view.getByRole('header', { name: 'Picture the task' })).toBeTruthy();
    expect(view.queryByRole('button', { name: 'Start guided session' })).toBeNull();
  });
});
