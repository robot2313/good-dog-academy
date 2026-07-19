import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppScreen } from '../../../components/AppScreen';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import { styles } from '../../../theme/styles';
import type { RootStackParamList } from '../../../types/navigation';
import { useOnboarding } from '../OnboardingContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props): React.JSX.Element {
  const { status, continueExistingSetup } = useOnboarding();

  const continueSaved = async () => {
    await continueExistingSetup();
    navigation.navigate('OwnerSetup');
  };

  return (
    <AppScreen>
      <View style={styles.welcomeMark} accessibilityLabel="Good Dog Academy logo"><Text style={styles.welcomeMarkText}>G</Text></View>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>GOOD DOG ACADEMY</Text>
        <Text style={styles.heroTitle}>Raise an amazing dog.</Text>
        <Text style={styles.heroBody}>We'll create a personalised training plan for you and your dog.</Text>
      </View>
      <PrimaryButton title="Get Started" onPress={() => navigation.navigate('OwnerSetup')} />
      {status?.hasSavedData && status.state !== 'complete'
        ? <SecondaryTextButton title="Continue Existing Setup" onPress={() => void continueSaved()} />
        : null}
    </AppScreen>
  );
}
