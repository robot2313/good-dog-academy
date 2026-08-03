import { Pressable, Text, View } from 'react-native';

import { styles } from '../theme/styles';

type LessonActionBarProps = {
  readonly back: { readonly label: string; readonly onPress: () => void };
  readonly forward?: {
    readonly label: string;
    readonly onPress: () => void;
    readonly disabled?: boolean;
    readonly accessibilityLabel?: string;
  };
};

/**
 * The stable bottom action region for the principal lesson screens: a secondary
 * Back control paired (side by side) with the dominant forward action. Both use
 * the same dark-charcoal + gold visual system; the forward action is emphasised
 * only through width and a subtle gold glow, never a different colour.
 */
export function LessonActionBar({ back, forward }: LessonActionBarProps): React.JSX.Element {
  return (
    <View style={styles.lessonActionRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={back.label}
        onPress={back.onPress}
        style={({ pressed }) => [
          styles.lessonActionButton,
          styles.lessonActionBack,
          pressed && styles.lessonActionPressed,
        ]}
      >
        <Text style={styles.lessonActionText}>{back.label}</Text>
      </Pressable>
      {forward ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={forward.accessibilityLabel ?? forward.label}
          accessibilityState={{ disabled: Boolean(forward.disabled) }}
          disabled={forward.disabled}
          onPress={forward.onPress}
          style={({ pressed }) => [
            styles.lessonActionButton,
            styles.lessonActionForward,
            forward.disabled && styles.lessonActionDisabled,
            pressed && !forward.disabled && styles.lessonActionPressed,
          ]}
        >
          <Text style={styles.lessonActionText}>{forward.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
