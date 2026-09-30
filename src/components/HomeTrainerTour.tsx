import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';

import { referencePalette } from '../theme/referenceStyles';

const STORAGE_KEY = '@good-dog-academy/trainer-home-tour-v1';

type Props = {
  readonly dogName: string;
  readonly onStartTraining: () => void;
};

const steps = [
  { icon: '📋', title: 'Today’s Plan', body: 'This is your Daily Plan. I’ll give you a few focused things to work on each day, based on where your dog is at.', speech: 'This is your Daily Plan. I’ll give you a few focused things to work on each day, based on where your dog is at.' },
  { icon: '📷', title: 'Camera Coach', body: 'Camera Coach lets me watch the exercise, understand what your dog is doing, and coach you while you train.', speech: 'This is Camera Coach. Put your phone down, get your dog in view, and I can watch the exercise and coach you through it.' },
  { icon: '📈', title: 'Progress', body: 'Your progress shows what your dog is learning over time. I’ll use your training history to adapt future lessons.', speech: 'This is your progress. I’ll use what we learn together to adapt future lessons for your dog.' },
  { icon: '🧠', title: 'I keep learning', body: 'The more you train, the better I can understand what works for your dog. You don’t need to manage the technical stuff.', speech: 'And this is the important part. I keep learning from your training history, so the plan can adapt as your dog improves.' },
] as const;

export function HomeTrainerTour({ dogName, onStartTraining }: Props): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const current = steps[step]!;
  const progress = useMemo(() => `${step + 1} of ${steps.length}`, [step]);

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (mounted && value !== 'complete') setVisible(true);
    });
    return () => { mounted = false; Speech.stop(); };
  }, []);

  useEffect(() => {
    if (!visible) return;
    Speech.stop();
    const spoken = current.speech.replace('your dog', dogName || 'your dog');
    Speech.speak(spoken, { language: 'en-AU', rate: 0.92, pitch: 1.02 });
    return () => { Speech.stop(); };
  }, [current.speech, dogName, visible]);

  const finish = async () => {
    Speech.stop();
    await AsyncStorage.setItem(STORAGE_KEY, 'complete');
    setVisible(false);
  };

  const next = () => {
    if (step >= steps.length - 1) { void finish(); return; }
    setStep((value) => value + 1);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => void finish()}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>🐕</Text><View style={styles.badge}><Text style={styles.badgeText}>GD</Text></View></View>
          <Text style={styles.kicker}>YOUR TRAINER · {progress}</Text>
          <Text style={styles.title}>Let me show you around, {dogName || 'friend'}.</Text>
          <View style={styles.bubble}>
            <View style={styles.iconCircle}><Text style={styles.icon}>{current.icon}</Text></View>
            <View style={styles.copy}><Text style={styles.stepTitle}>{current.title}</Text><Text style={styles.body}>{current.body}</Text></View>
          </View>
          <View style={styles.voiceRow}><Text style={styles.voiceIcon}>🔊</Text><Text style={styles.voiceText}>I’m speaking this guide aloud for you.</Text></View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" onPress={() => void finish()} style={styles.skip}><Text style={styles.skipText}>Skip tour</Text></Pressable>
            {step === steps.length - 1 ? (
              <Pressable accessibilityRole="button" onPress={() => { void finish(); onStartTraining(); }} style={styles.primary}><Text style={styles.primaryText}>Start Training →</Text></Pressable>
            ) : (
              <Pressable accessibilityRole="button" onPress={next} style={styles.primary}><Text style={styles.primaryText}>Show me →</Text></Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(10, 19, 32, 0.58)', justifyContent: 'flex-end', padding: 18 },
  card: { backgroundColor: '#FDFCF9', borderRadius: 28, padding: 20, gap: 15, shadowColor: '#000000', shadowOpacity: 0.22, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  avatar: { alignSelf: 'center', width: 76, height: 76, borderRadius: 38, backgroundColor: '#F2E6D5', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' },
  avatarText: { fontSize: 40 },
  badge: { position: 'absolute', right: -3, bottom: -2, width: 25, height: 25, borderRadius: 13, backgroundColor: referencePalette.green, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  kicker: { textAlign: 'center', color: referencePalette.green, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: referencePalette.navy, fontSize: 23, lineHeight: 29, fontWeight: '900', textAlign: 'center' },
  bubble: { flexDirection: 'row', gap: 12, backgroundColor: '#F3F6F1', borderRadius: 20, padding: 15, borderWidth: 1, borderColor: '#DCE6DA' },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  copy: { flex: 1, gap: 5 },
  stepTitle: { color: referencePalette.navy, fontSize: 16, fontWeight: '900' },
  body: { color: '#5D6878', fontSize: 14, lineHeight: 21, fontWeight: '600' },
  voiceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  voiceIcon: { fontSize: 14 },
  voiceText: { color: '#737C89', fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  skip: { paddingVertical: 13, paddingHorizontal: 4 },
  skipText: { color: '#737C89', fontSize: 12, fontWeight: '800' },
  primary: { backgroundColor: referencePalette.green, borderRadius: 15, paddingHorizontal: 19, paddingVertical: 13 },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
