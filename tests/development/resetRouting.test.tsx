import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, cleanup, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import App from '../../App';
import { sampleBehaviourAssessment, sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { appStorage } from '../../src/services/appStorage';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';

describe('development reset routing', () => {
  afterEach(async () => {
    jest.restoreAllMocks();
    await cleanup();
  });

  it('requires confirmation, resets persisted data, and routes immediately to Welcome', async () => {
    await AsyncStorage.clear();
    const repositories = createDomainRepositories(appStorage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.behaviourProfiles.save(sampleBehaviourProfile);
    await repositories.behaviourAssessments.save(sampleBehaviourAssessment);

    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const view = render(<App />);
    expect(await view.findByText('One focused session today.')).toBeTruthy();
    fireEvent.press(view.getByText('Dog'));
    expect(await view.findByText('Developer Tools')).toBeTruthy();
    fireEvent.press(view.getByText('Reset App Data'));

    expect(alert).toHaveBeenCalledWith(
      'Reset App Data?',
      expect.stringContaining('permanently deletes'),
      expect.any(Array),
    );
    await expect(repositories.owners.findById(sampleOwner.id)).resolves.toEqual(sampleOwner);

    const buttons = alert.mock.calls[0][2];
    const confirm = buttons?.find((button) => button.text === 'Reset App Data');
    await act(async () => {
      confirm?.onPress?.();
      await Promise.resolve();
    });

    expect(await view.findByText('Raise an amazing dog.')).toBeTruthy();
    await expect(repositories.owners.findAll()).resolves.toEqual([]);
    await expect(repositories.dogs.findAll()).resolves.toEqual([]);
    await expect(repositories.behaviourProfiles.findAll()).resolves.toEqual([]);
    await expect(repositories.behaviourAssessments.findAll()).resolves.toEqual([]);
  });
});
