import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  colorTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '../theme/tokens';

type AppBackHeaderProps = {
  onPress: () => void;
  label?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

export function AppBackHeader({
  onPress,
  label = 'Back',
  accessibilityLabel,
  accessibilityHint = 'Returns to the previous screen',
  testID,
}: AppBackHeaderProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        hitSlop={8}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text
          accessible={false}
          style={styles.icon}
        >
          ‹
        </Text>

        <Text
          accessible={false}
          style={styles.label}
        >
          {label}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacingTokens.lg,
    backgroundColor: colorTokens.background.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colorTokens.border.subtle,
  },
  button: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacingTokens.sm,
    borderRadius: radiusTokens.pill,
  },
  buttonPressed: {
    backgroundColor: colorTokens.surface.selected,
  },
  icon: {
    color: colorTokens.brand.primary,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '600',
    marginRight: spacingTokens.xs,
  },
  label: {
    ...typographyTokens.body,
    color: colorTokens.text.primary,
    fontWeight: '700',
  },
});