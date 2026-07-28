import type { PropsWithChildren } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens,
} from '../theme/tokens';

type AppModalProps = PropsWithChildren<{
  readonly visible: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly closeLabel?: string;
}>;

export function AppModal({
  visible,
  title,
  onClose,
  closeLabel = 'Close',
  children,
}: AppModalProps): React.JSX.Element | null {
  if (!visible) return null;

  return (
    <Modal
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible
    >
      <SafeAreaView style={componentStyles.backdrop}>
        <View
          accessibilityViewIsModal
          style={componentStyles.dialog}
        >
          <View style={componentStyles.header}>
            <Text accessibilityRole="header" style={componentStyles.title}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [
                componentStyles.closeButton,
                pressed && componentStyles.pressed,
              ]}
            >
              <Text style={componentStyles.closeText}>×</Text>
            </Pressable>
          </View>
          {children}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const componentStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacingTokens.lg,
    backgroundColor: 'rgba(10,26,21,0.52)',
  },
  dialog: {
    maxHeight: '90%',
    borderRadius: radiusTokens.hero,
    borderWidth: 1,
    borderColor: colorTokens.border.subtle,
    padding: spacingTokens.lg,
    gap: spacingTokens.md,
    backgroundColor: colorTokens.surface.elevated,
    ...shadowTokens.medium,
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
  },
  title: {
    ...typographyTokens.sectionTitle,
    flex: 1,
    color: colorTokens.text.primary,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: radiusTokens.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorTokens.background.subtle,
    borderWidth: 1,
    borderColor: colorTokens.border.subtle,
  },
  closeText: {
    color: colorTokens.text.primary,
    fontSize: 26,
    lineHeight: 30,
  },
  pressed: {
    opacity: 0.72,
  },
});
