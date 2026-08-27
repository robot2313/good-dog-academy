import { Pressable, Text, View } from 'react-native';

import { styles } from '../theme/styles';
import { HomePathIcon, type HomePathIconKind } from './HomePathIcon';

type Props = {
  readonly title: string;
  readonly body: string;
  readonly kind: HomePathIconKind;
  readonly accent: string;
  readonly onPress: () => void;
  readonly accessibilityLabel?: string;
};

export function HomeChoiceCard({ title, body, kind, accent, onPress, accessibilityLabel }: Props): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${title}. ${body}`}
      onPress={onPress}
      style={({ pressed }) => [styles.homeChoiceCard, pressed && styles.homeButtonPressed]}
    >
      <View style={[styles.homeChoiceIcon, { backgroundColor: `${accent}16` }]}>
        <HomePathIcon kind={kind} color={accent} />
      </View>
      <View style={styles.homeChoiceCopy}>
        <Text style={styles.homeChoiceTitle}>{title}</Text>
        <Text style={styles.homeChoiceBody}>{body}</Text>
      </View>
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.homeChoiceArrow}>›</Text>
    </Pressable>
  );
}
