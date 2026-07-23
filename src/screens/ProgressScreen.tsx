import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { styles } from '../theme/styles';
import type { MainTabParamList, RootStackParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Progress'>,
  NativeStackScreenProps<RootStackParamList, 'Main'>
>;

export function ProgressScreen({ navigation }: Props): React.JSX.Element {
  return (
    <AppScreen>
      <Text style={styles.eyebrowDark}>TRAINING INTELLIGENCE</Text>
      <Text accessibilityRole="header" style={styles.pageTitle}>Progress</Text>
      <Text style={styles.body}>
        Your completed guided sessions are saved per dog and form the reliable record of your training.
      </Text>
      <View style={styles.progressHistoryCard}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Training history</Text>
        <Text style={styles.body}>Review completed guided sessions, outcomes, rating ranges, and saved notes.</Text>
        <PrimaryButton
          title="View session history"
          onPress={() => navigation.navigate('SessionHistory')}
        />
      </View>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Continue training</Text>
        <Text style={styles.body}>
          Open the Academy to review lesson progress and choose another available skill.
        </Text>
        <PrimaryButton
          title="Browse the Academy"
          onPress={() => navigation.navigate('Academy')}
        />
      </View>
    </AppScreen>
  );
}
