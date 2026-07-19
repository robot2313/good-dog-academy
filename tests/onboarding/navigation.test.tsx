import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

import App from '../../App';
import { sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { appStorage } from '../../src/services/appStorage';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';

type RenderedView = Awaited<ReturnType<typeof render>>;

async function navigateToOwner(view: RenderedView) {
  await fireEvent.press(await view.findByText('Get Started'));
  await view.findByText('Tell us about you.');
}

async function navigateToDog(view: RenderedView) {
  await navigateToOwner(view);
  await fireEvent.changeText(view.getByLabelText('Owner name'), 'Taylor');
  await fireEvent.press(view.getByText('Beginner'));
  await fireEvent.press(view.getByText('Family Companion'));
  await fireEvent.press(view.getByText('Continue'));
  await view.findByText('Meet your dog.');
}

describe('onboarding navigation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await cleanup();
  });

  it('navigates Welcome to Owner to Dog and preserves the owner form on back', async () => {
    const view = await render(<App />);
    await navigateToDog(view);
    await fireEvent.press(view.getByText('Back'));
    await view.findByText('Tell us about you.');
    expect(view.getByDisplayValue('Taylor')).toBeTruthy();
    expect(view.getByLabelText('Beginner').props.accessibilityState).toEqual({ checked: true });
    expect(view.getByLabelText('Family Companion').props.accessibilityState).toEqual({ checked: true });
  });

  it('handles denied photo permission without blocking the form', async () => {
    const view = await render(<App />);
    await navigateToDog(view);
    await act(async () => {
      fireEvent.press(view.getByText('Add optional photo'));
      await Promise.resolve();
    });
    expect(await view.findByText(/Photo access was not granted/)).toBeTruthy();
    expect(view.getByText('Complete Setup')).toBeTruthy();
  });

  it('skips onboarding for a complete persisted owner and dog', async () => {
    const repositories = createDomainRepositories(appStorage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.behaviourProfiles.save(sampleBehaviourProfile);

    const view = await render(<App />);
    expect(await view.findByText('One focused session today.')).toBeTruthy();
    await waitFor(() => expect(view.queryByText('Raise an amazing dog.')).toBeNull());
  });
});
