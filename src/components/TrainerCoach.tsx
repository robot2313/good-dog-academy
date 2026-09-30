import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';

import { referencePalette } from '../theme/referenceStyles';

type Props = {
  readonly message: string;
  readonly label?: string;
  readonly speaking?: boolean;
  readonly autoSpeak?: boolean;
  readonly onContinue?: () => void;
  readonly continueLabel?: string;
  readonly compact?: boolean;
};

export function TrainerCoach({
  message,
  label = 'Your Good Dog Trainer',
  speaking = false,
  autoSpeak = true,
  onContinue,
  continueLabel = 'Continue',
  compact = false,
}: Props): React.JSX.Element {
  const pulse = useRef(new Animated.Value(1)).current;
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!autoSpeak) return;
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(message, {
      language: 'en-AU',
      rate: 0.92,
      pitch: 1.02,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
    return () => { Speech.stop(); };
  }, [autoSpeak, message]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const replay = () => {
    Speech.stop();
    setIsSpeaking(true);
    Speech.speak(message, {
      language: 'en-AU',
      rate: 0.92,
      pitch: 1.02,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  return (
    <View style={[styles.wrapper, compact && styles.compactWrapper]}>
      <View style={styles.row}>
        <Animated.View style={[styles.avatar, { transform: [{ scale: pulse }] }]}>
          <Text style={styles.avatarFace}>🐕</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>GD</Text></View>
        </Animated.View>
        <View style={styles.copy}>
          <View style={styles.nameRow}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>{isSpeaking || speaking ? 'Speaking' : 'Trainer'}</Text></View>
          </View>
          <View style={styles.bubble}>
            <View style={styles.tail} />
            <Text style={styles.message}>{message}</Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Hear trainer message again" onPress={replay} style={({ pressed }) => [styles.replay, pressed && styles.pressed]}>
          <Text style={styles.replayText}>🔊 Hear again</Text>
        </Pressable>
        {onContinue ? (
          <Pressable accessibilityRole="button" onPress={onContinue} style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
            <Text style={styles.continueText}>{continueLabel}  →</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 14 },
  compactWrapper: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F2E6D5', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#142033', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  avatarFace: { fontSize: 31 },
  badge: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: referencePalette.green, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  badgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  copy: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { color: referencePalette.navy, fontSize: 12, fontWeight: '900', letterSpacing: 0.3 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: referencePalette.green },
  liveText: { color: '#6E7888', fontSize: 10, fontWeight: '800' },
  bubble: { position: 'relative', backgroundColor: '#FFFFFF', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E9E5DE', shadowColor: '#142033', shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  tail: { position: 'absolute', left: -6, top: 14, width: 12, height: 12, backgroundColor: '#FFFFFF', transform: [{ rotate: '45deg' }], borderLeftWidth: 1, borderBottomWidth: 1, borderColor: '#E9E5DE' },
  message: { color: referencePalette.navy, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  replay: { paddingVertical: 10, paddingHorizontal: 4 },
  replayText: { color: '#667085', fontSize: 12, fontWeight: '800' },
  continueButton: { backgroundColor: referencePalette.green, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  continueText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.78 },
});
