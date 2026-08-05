import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import { localDataDeletionService } from '../../src/features/privacy/localDataDeletionServiceInstance';
import { PRIVACY_CONTACT_EMAIL, PrivacyScreen } from '../../src/features/privacy/PrivacyScreen';
import type { RootStackParamList } from '../../src/types/navigation';

jest.mock('../../src/features/onboarding/OnboardingContext', () => ({ useOnboarding: jest.fn() }));
jest.mock('../../src/features/privacy/localDataDeletionServiceInstance', () => ({
  localDataDeletionService: { deleteAllLocalData: jest.fn() },
}));

const mockUseOnboarding = jest.mocked(useOnboarding);
const mockDeleteAllLocalData = jest.mocked(localDataDeletionService.deleteAllLocalData);

function renderScreen() {
  const goBack = jest.fn();
  const props = {
    navigation: { goBack },
    route: { key: 'privacy', name: 'Privacy' },
  } as unknown as NativeStackScreenProps<RootStackParamList, 'Privacy'>;
  return { goBack, view: render(<PrivacyScreen {...props} />) };
}

describe('PrivacyScreen', () => {
  const resetAfterLocalDataClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboarding.mockReturnValue({ resetAfterLocalDataClear } as unknown as ReturnType<typeof useOnboarding>);
  });

  it('truthfully explains local storage and exposes the privacy contact', () => {
    const { view } = renderScreen();

    expect(view.getByRole('header', { name: 'Privacy and Your Data' })).toBeTruthy();
    expect(view.getByText(/stays local unless you create a Team Dog account/i)).toBeTruthy();
    expect(view.getByText(PRIVACY_CONTACT_EMAIL)).toBeTruthy();
  });

  it('requires confirmation before deleting and returns the app to Welcome', async () => {
    mockDeleteAllLocalData.mockResolvedValue({ managedPhotosRemoved: true });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const { view } = renderScreen();

    fireEvent.press(view.getByRole('button', { name: 'Delete All Local Data' }));
    expect(mockDeleteAllLocalData).not.toHaveBeenCalled();
    await act(async () => {
      alert.mock.calls[0]?.[2]?.[1]?.onPress?.();
      await Promise.resolve();
    });

    await waitFor(() => expect(mockDeleteAllLocalData).toHaveBeenCalledTimes(1));
    expect(resetAfterLocalDataClear).toHaveBeenCalledTimes(1);
    expect(alert).toHaveBeenCalledWith('Local app data deleted', expect.stringMatching(/removed from this device/i));
    alert.mockRestore();
  });

  it('keeps current state and shows an error when deletion fails', async () => {
    mockDeleteAllLocalData.mockRejectedValue(new Error('storage unavailable'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    const { view } = renderScreen();

    fireEvent.press(view.getByRole('button', { name: 'Delete All Local Data' }));
    await act(async () => {
      alert.mock.calls[0]?.[2]?.[1]?.onPress?.();
      await Promise.resolve();
    });

    expect(await view.findByText(/current app state was kept/i)).toBeTruthy();
    expect(resetAfterLocalDataClear).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
