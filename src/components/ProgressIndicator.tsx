import { Text, View } from 'react-native';

import { styles } from '../theme/styles';

export function ProgressIndicator({ current, total }: { current: number; total: number }): React.JSX.Element {
  const percent = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <View style={styles.onboardingProgress} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: current }}>
      <Text style={styles.progressStep}>STEP {current} OF {total}</Text>
      <View style={styles.onboardingProgressTrack}><View style={[styles.onboardingProgressFill, { width: `${percent}%` }]} /></View>
    </View>
  );
}
