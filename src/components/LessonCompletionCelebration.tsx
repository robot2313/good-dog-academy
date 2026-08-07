import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  colorTokens,
  radiusTokens,
  shadowTokens,
  spacingTokens,
  typographyTokens,
} from '../theme/tokens';
import { DogAvatar } from './DogAvatar';

type LessonCompletionCelebrationProps = {
  visible: boolean;
  dogName: string;
  photoUri: string | null;
  lessonTitle?: string;
  onContinue: () => void;
  testID?: string;
};

export function LessonCompletionCelebration({
  visible,
  dogName,
  photoUri,
  lessonTitle,
  onContinue,
  testID,
}: LessonCompletionCelebrationProps): React.JSX.Element {
  const [reduceMotion, setReduceMotion] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduceMotion(enabled);
        }
      })
      .catch(() => undefined);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      opacity.setValue(0);
      scale.setValue(0.92);
      return undefined;
    }

    if (reduceMotion) {
      opacity.setValue(1);
      scale.setValue(1);
      return undefined;
    }

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 170,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [opacity, reduceMotion, scale, visible]);

  const trimmedName = dogName.trim();
  const displayName = trimmedName || 'your dog';
  const trimmedLessonTitle = lessonTitle?.trim();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onContinue}
      transparent
      visible={visible}
    >
      <View
        accessibilityViewIsModal
        style={styles.backdrop}
        testID={testID}
      >
        <Animated.View
          style={[
            styles.card,
            {
              opacity,
              transform: [{ scale }],
            },
          ]}
        >
          <View
            accessible={false}
            style={styles.decorations}
          >
            <Text
              accessible={false}
              style={styles.decoration}
            >
              ★
            </Text>
            <Text
              accessible={false}
              style={styles.decoration}
            >
              ★
            </Text>
            <Text
              accessible={false}
              style={styles.decoration}
            >
              ★
            </Text>
          </View>

          <DogAvatar
            decorative
            dogName={dogName}
            photoUri={photoUri}
            size={104}
          />

          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="header"
            style={styles.title}
          >
            Lesson complete!
          </Text>

          <Text style={styles.message}>
            {trimmedLessonTitle
              ? `${displayName} completed ${trimmedLessonTitle}.`
              : `${displayName} completed the lesson.`}
          </Text>

          <Text style={styles.supportingText}>
            Great work. Every successful session builds stronger habits.
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={onContinue}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>
              Continue
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacingTokens.lg,
    backgroundColor: 'rgba(32, 40, 37, 0.52)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    padding: spacingTokens.xl,
    borderRadius: radiusTokens.hero,
    backgroundColor: colorTokens.surface.primary,
    borderWidth: 1,
    borderColor: colorTokens.border.subtle,
    ...shadowTokens.medium,
  },
  decorations: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacingTokens.sm,
  },
  decoration: {
    color: colorTokens.brand.primary,
    fontSize: 24,
  },
  paw: {
    fontSize: 28,
  },
  title: {
    ...typographyTokens.sectionTitle,
    color: colorTokens.text.primary,
    textAlign: 'center',
    marginTop: spacingTokens.md,
  },
  message: {
    ...typographyTokens.body,
    color: colorTokens.text.primary,
    textAlign: 'center',
    marginTop: spacingTokens.sm,
  },
  supportingText: {
    ...typographyTokens.supporting,
    color: colorTokens.text.secondary,
    textAlign: 'center',
    marginTop: spacingTokens.xs,
  },
  button: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacingTokens.lg,
    paddingHorizontal: spacingTokens.lg,
    borderRadius: radiusTokens.pill,
    backgroundColor: colorTokens.brand.primary,
  },
  buttonPressed: {
    backgroundColor: colorTokens.brand.pressed,
  },
  buttonText: {
    ...typographyTokens.body,
    color: colorTokens.text.inverse,
    fontWeight: '800',
  },
});