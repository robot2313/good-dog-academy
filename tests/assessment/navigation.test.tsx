import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, cleanup, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';

import App from '../../App';
import { sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { appStorage } from '../../src/services/appStorage';
import { createDomainRepositories } from '../../src/services/createDomainRepositories';
import { storageKeys } from '../../src/storage/storageKeys';

describe('behaviour assessment navigation', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    const repositories = createDomainRepositories(appStorage);
    await repositories.owners.save(sampleOwner);
    await repositories.dogs.save(sampleDog);
    await repositories.behaviourProfiles.save({ ...sampleBehaviourProfile, assessmentId: null });
  });
  afterEach(() => { jest.restoreAllMocks(); cleanup(); });

  it('requires every answer, preserves answers on back, and routes to main after atomic completion', async () => {
    const view = render(<App />);
    expect(await view.findByText('Let’s understand your dog.')).toBeTruthy();
    fireEvent.press(view.getByText('Start Assessment'));
    expect(await view.findByText('Everyday skills')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Continue' }).props.accessibilityState).toEqual({ disabled: true });
    view.getAllByText('Sometimes').forEach((option) => fireEvent.press(option));
    fireEvent.press(view.getByText('Continue'));
    expect(await view.findByText('Life at home')).toBeTruthy();
    fireEvent.press(view.getByText('Back'));
    expect(await view.findByText('Everyday skills')).toBeTruthy();
    expect(view.getAllByRole('radio').filter((radio) => radio.props.accessibilityState.checked)).toHaveLength(3);
    fireEvent.press(view.getByText('Continue'));
    view.getAllByText('Sometimes').forEach((option) => fireEvent.press(option));
    fireEvent.press(view.getByText('Continue'));
    expect(await view.findByText('Confidence and control')).toBeTruthy();
    view.getAllByText('Sometimes').forEach((option) => fireEvent.press(option));
    fireEvent.press(view.getByText('Continue'));
    expect(await view.findByText('Your starting profile')).toBeTruthy();
    fireEvent.press(view.getByText('Complete Assessment'));
    expect(await view.findByText(/focused lesson(?:s)? today\./)).toBeTruthy();
    const repositories = createDomainRepositories(appStorage);
    await expect(repositories.behaviourAssessments.findAll()).resolves.toHaveLength(1);
  });

  it('shows safety guidance for severe reactivity', async () => {
    const view = render(<App />);
    fireEvent.press(await view.findByText('Start Assessment'));
    view.getAllByText('Sometimes').forEach((option) => fireEvent.press(option));
    fireEvent.press(view.getByText('Continue'));
    view.getAllByText('Sometimes').forEach((option) => fireEvent.press(option));
    fireEvent.press(view.getByText('Continue'));
    fireEvent.press(view.getByLabelText(/lunge, snap.*: Often/));
    expect(view.getByText('Safety first')).toBeTruthy();
  });

  it('requires confirmation and recovers corrupt assessment data without deleting setup', async () => {
    const repositories = createDomainRepositories(appStorage);
    await appStorage.setItem(storageKeys.behaviourAssessments, [{ id: null }]);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const view = render(<App />);
    fireEvent.press(await view.findByText('Restart Assessment'));
    expect(alert).toHaveBeenCalledWith('Restart assessment?', expect.stringContaining('owner and dog setup will be kept'), expect.any(Array));
    const confirm = alert.mock.calls[0][2]?.find((button) => button.text === 'Restart assessment');
    await act(async () => { confirm?.onPress?.(); await Promise.resolve(); });
    expect(await view.findByText('Start Assessment')).toBeTruthy();
    await expect(repositories.owners.findById(sampleOwner.id)).resolves.toEqual(sampleOwner);
    await expect(repositories.dogs.findById(sampleDog.id)).resolves.toEqual(sampleDog);
    await expect(repositories.behaviourAssessments.findAll()).resolves.toEqual([]);
  });
});
