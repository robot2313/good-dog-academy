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

  it('opens available and self-directed Get Ready screens through the Academy tab', async () => {
    const view = render(<App />);
    expect(await view.findByRole('button', { name: 'Your journey so far' })).toBeTruthy();
    fireEvent.press(view.getByText('Academy'));

    expect(await view.findByText('Lesson Library')).toBeTruthy();
    expect(view.getByText(sampleDog.name)).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: `Troubleshoot a training problem for ${sampleDog.name}` }));
    expect(await view.findByRole('header', { name: `What is ${sampleDog.name} struggling with?` })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Back' }));
    expect(await view.findByText('Lesson Library')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Name Response. Recall. Level 1. 6 minutes. Available.' }));
    expect(await view.findByText('GET READY')).toBeTruthy();
    expect(view.getByRole('header', { name: 'Before we start' })).toBeTruthy();
    expect(view.getByRole('image', { name: /Recall training photograph/ })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Next' })).toBeTruthy();

    fireEvent.press(view.getByRole('button', { name: 'Back' }));
    expect(await view.findByText('Lesson Library')).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: /Short-Distance Recall.*Self-directed choice.*You can choose this lesson now/ }));
    expect(await view.findByText('Later in the recommended Journey')).toBeTruthy();
    expect(view.getByText('Self-directed')).toBeTruthy();
    expect(view.getByText(/Complete Name Response first.*you can still choose this lesson now/i)).toBeTruthy();
    expect(view.getByRole('button', { name: 'Next' })).toBeTruthy();
  });
});
