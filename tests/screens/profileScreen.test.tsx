import { fireEvent, render } from '@testing-library/react-native';

import {
  sampleBehaviourAssessment,
  sampleBehaviourProfile,
  sampleDog,
  sampleOwner,
} from '../../src/development/seed/sampleData';
import { useOnboarding } from '../../src/features/onboarding/OnboardingContext';
import { ProfileScreen } from '../../src/screens/ProfileScreen';

jest.mock('../../src/features/onboarding/OnboardingContext', () => ({
  useOnboarding: jest.fn(),
}));

const mockUseOnboarding = jest.mocked(useOnboarding);
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('ProfileScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the canonical selected owner and dog from OnboardingContext', () => {
    const selectedDog = {
      ...sampleDog,
      id: 'dog-canonical-profile',
      name: 'Pepper',
      breed: 'Border Collie mix',
      breedUnknown: false,
    };
    mockUseOnboarding.mockReturnValue({
      status: {
        state: 'complete',
        hasSavedData: true,
        owner: {
          ...sampleOwner,
          displayName: 'Taylor Morgan',
        },
        dog: selectedDog,
        behaviourProfile: {
          ...sampleBehaviourProfile,
          dogId: selectedDog.id,
        },
        assessment: {
          ...sampleBehaviourAssessment,
          dogId: selectedDog.id,
        },
      },
    } as ReturnType<typeof useOnboarding>);

    const view = render(<ProfileScreen />);

    expect(view.getByRole('header', { name: 'Pepper' })).toBeTruthy();
    expect(view.getAllByText('Pepper')).toHaveLength(2);
    expect(view.getByText('Border Collie mix')).toBeTruthy();
    expect(view.getByText('Taylor Morgan')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Add photo' })).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Open Team Dog' }));
    expect(mockNavigate).toHaveBeenCalledWith('Account');
    fireEvent.press(view.getByRole('button', { name: 'Privacy and Your Data' }));
    expect(mockNavigate).toHaveBeenCalledWith('Privacy');
  });

  it('renders photo change and remove controls when dog has a photo', () => {
    const selectedDog = {
      ...sampleDog,
      id: 'dog-canonical-profile',
      name: 'Pepper',
      photoUri: 'file:///path/to/photo.jpg',
    };
    mockUseOnboarding.mockReturnValue({
      status: {
        state: 'complete',
        hasSavedData: true,
        owner: sampleOwner,
        dog: selectedDog,
        behaviourProfile: sampleBehaviourProfile,
      },
    } as ReturnType<typeof useOnboarding>);

    const view = render(<ProfileScreen />);

    expect(view.getByRole('button', { name: 'Change photo' })).toBeTruthy();
    expect(view.getByRole('button', { name: 'Remove photo' })).toBeTruthy();
  });
});
