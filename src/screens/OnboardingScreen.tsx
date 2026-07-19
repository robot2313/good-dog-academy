import { Text, TextInput, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAppState } from '../state/AppStateContext';
import { styles } from '../theme/styles';

export function OnboardingScreen(): React.JSX.Element {
  const { profile, setDogName, setBreed, completeOnboarding } = useAppState();

  return (
    <AppScreen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>GOOD DOG ACADEMY</Text>
        <Text style={styles.heroTitle}>Private training built around your dog.</Text>
        <Text style={styles.heroBody}>This is the clean stable foundation. We only add more after this version opens correctly.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Create your first dog profile</Text>
        <Text style={styles.label}>Dog's name</Text>
        <TextInput value={profile.name} onChangeText={setDogName} placeholder="Buddy" placeholderTextColor="#929A94" style={styles.input} />
        <Text style={styles.label}>Breed or mix</Text>
        <TextInput value={profile.breed} onChangeText={setBreed} placeholder="Labrador mix" placeholderTextColor="#929A94" style={styles.input} />
        <PrimaryButton title="Create training plan" onPress={completeOnboarding} />
      </View>
    </AppScreen>
  );
}
