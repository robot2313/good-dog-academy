import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { sampleBehaviourProfile, sampleDog, sampleOwner } from '../../src/development/seed/sampleData';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import { dogPhotoUpdateService } from '../../src/features/onboarding/photo/dogPhotoUpdateServiceInstance';
import { ProfileScreen } from '../../src/screens/ProfileScreen';

jest.mock('../../src/features/onboarding/OnboardingContext', () => ({
  useOnboarding: jest.fn(),
}));

jest.mock('../../src/features/onboarding/photo/dogPhotoUpdateServiceInstance', () => ({
  dogPhotoUpdateService: {
    replacePhoto: jest.fn(async () => undefined),
    removePhoto: jest.fn(async () => undefined),
  },
}));

const mockUseOnboarding = jest.mocked(useOnboarding);
const requestPermission = jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync);
const launchLibrary = jest.mocked(ImagePicker.launchImageLibraryAsync);
const replacePhoto = dogPhotoUpdateService.replacePhoto as jest.Mock;
const removePhoto = dogPhotoUpdateService.removePhoto as jest.Mock;

function renderWithDog(photoUri: string | null) {
  const refreshApplicationStatus = jest.fn(async () => undefined);
  const dog = { ...sampleDog, id: 'dog-canonical-profile', name: 'Pepper', photoUri };
  mockUseOnboarding.mockReturnValue({
    status: {
      state: 'complete',
      hasSavedData: true,
      owner: sampleOwner,
      dog,
      behaviourProfile: sampleBehaviourProfile,
    },
    refreshApplicationStatus,
  } as unknown as ReturnType<typeof useOnboarding>);
  return { dog, refreshApplicationStatus, view: render(<ProfileScreen />) };
}

describe('ProfileScreen photo actions', () => {
  beforeEach(() => {
    replacePhoto.mockClear();
    removePhoto.mockClear();
    requestPermission.mockReset();
    launchLibrary.mockReset();
  });

  it('adds a photo via the transactional service, passing the cross-tab refresh callback', async () => {
    requestPermission.mockResolvedValue({ granted: true } as never);
    launchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///cache/picked.jpg' }],
    } as never);

    const { dog, refreshApplicationStatus, view } = renderWithDog(null);
    fireEvent.press(view.getByRole('button', { name: 'Add photo' }));

    await waitFor(() => {
      expect(replacePhoto).toHaveBeenCalledWith(
        dog,
        'file:///cache/picked.jpg',
        refreshApplicationStatus,
      );
    });
  });

  it('does not call the service when photo selection is cancelled', async () => {
    requestPermission.mockResolvedValue({ granted: true } as never);
    launchLibrary.mockResolvedValue({ canceled: true, assets: [] } as never);

    const { view } = renderWithDog(null);
    fireEvent.press(view.getByRole('button', { name: 'Add photo' }));

    await waitFor(() => expect(launchLibrary).toHaveBeenCalled());
    expect(replacePhoto).not.toHaveBeenCalled();
  });

  it('removes a photo via the transactional service, passing the cross-tab refresh callback', async () => {
    const { dog, refreshApplicationStatus, view } = renderWithDog('file:///documents/dog-photos/dog.jpg');
    fireEvent.press(view.getByRole('button', { name: 'Remove photo' }));

    await waitFor(() => {
      expect(removePhoto).toHaveBeenCalledWith(dog, refreshApplicationStatus);
    });
  });
});
