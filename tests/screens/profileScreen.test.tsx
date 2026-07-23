import { render } from '@testing-library/react-native';

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

describe('ProfileScreen', () => {
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
  });
});
