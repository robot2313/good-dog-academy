import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { DogIdentityHero } from '../components/DogIdentityHero';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { styles } from '../theme/styles';

declare const require: (moduleName: string) => { DeveloperToolsSection: () => React.JSX.Element | null };
const DeveloperToolsSection = __DEV__
  ? require('../development/reset/DeveloperToolsSection').DeveloperToolsSection
  : null;

export function ProfileScreen(): React.JSX.Element {
  const { status } = useOnboarding();
  const dog = status?.state === 'complete' ? status.dog : null;
  const owner = status?.state === 'complete' ? status.owner : null;
  const dogName = dog?.name ?? 'My Dog';
  const photoUri = dog?.photoUri ?? null;

  return (
    <AppScreen>
      <DogIdentityHero
        dogName={dogName}
        photoUri={photoUri}
        eyebrow="DOG PROFILE"
        title={dogName}
        size="profile"
      />
      <View style={styles.membershipCard}>
        <Text style={styles.membershipEyebrow}>FOUNDER ACCOUNT</Text>
        <Text style={styles.membershipTitle}>Lifetime All Access</Text>
        <Text style={styles.membershipBody}>Your owner account stays unlocked as premium features are added.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Current dog</Text>
        <Text style={styles.profileValue}>{dog?.name ?? 'Not selected'}</Text>
        <Text style={styles.label}>Breed or mix</Text>
        <Text style={styles.profileValue}>
          {dog ? (dog.breedUnknown ? 'Unknown' : dog.breed) : 'Not specified'}
        </Text>
        <Text style={styles.label}>Owner</Text>
        <Text style={styles.profileValue}>{owner?.displayName ?? 'Not specified'}</Text>
        <Text style={styles.label}>Current build</Text>
        <Text style={styles.profileValue}>Stable Foundation 1.0</Text>
      </View>
      {__DEV__ && DeveloperToolsSection ? <DeveloperToolsSection /> : null}
    </AppScreen>
  );
}
