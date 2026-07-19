import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { useAppState } from '../state/AppStateContext';
import { styles } from '../theme/styles';

declare const require: (moduleName: string) => { DeveloperToolsSection: () => React.JSX.Element | null };
const DeveloperToolsSection = __DEV__
  ? require('../development/reset/DeveloperToolsSection').DeveloperToolsSection
  : null;

export function ProfileScreen(): React.JSX.Element {
  const { profile } = useAppState();

  return (
    <AppScreen>
      <Text style={styles.eyebrowDark}>DOG PROFILE</Text>
      <Text style={styles.pageTitle}>{profile.name || 'My Dog'}</Text>
      <View style={styles.membershipCard}>
        <Text style={styles.membershipEyebrow}>FOUNDER ACCOUNT</Text>
        <Text style={styles.membershipTitle}>Lifetime All Access</Text>
        <Text style={styles.membershipBody}>Your owner account stays unlocked as premium features are added.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Breed or mix</Text>
        <Text style={styles.profileValue}>{profile.breed || 'Not specified'}</Text>
        <Text style={styles.label}>Current build</Text>
        <Text style={styles.profileValue}>Stable Foundation 1.0</Text>
      </View>
      {__DEV__ && DeveloperToolsSection ? <DeveloperToolsSection /> : null}
    </AppScreen>
  );
}
