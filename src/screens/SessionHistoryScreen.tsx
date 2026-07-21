import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import { useLessonProgress } from '../features/lessons/progress/LessonProgressContext';
import { styles } from '../theme/styles';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionHistory'>;
const catalogue = loadBundledLessonCatalogue();

export function SessionHistoryScreen({ navigation }: Props): React.JSX.Element {
  const { sessions, updateSessionNotes, error } = useLessonProgress();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEditing = (sessionId: string, notes: string) => { setEditingId(sessionId); setDraft(notes); };
  const save = async () => {
    if (!editingId) return;
    setSaving(true);
    if (await updateSessionNotes(editingId, draft)) setEditingId(null);
    setSaving(false);
  };

  return <AppScreen>
    <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backButtonText}>‹ Progress</Text></Pressable>
    <Text style={styles.eyebrowDark}>TRAINING JOURNAL</Text>
    <Text style={styles.pageTitle}>Session history</Text>
    <Text style={styles.body}>Keep useful observations about what worked, what was distracting, and what to try next time.</Text>
    {error ? <View style={styles.errorCard}><Text style={styles.body}>{error}</Text></View> : null}
    {sessions.length === 0 ? <View style={styles.card}><Text style={styles.sectionTitle}>No sessions yet</Text><Text style={styles.body}>Complete a lesson to begin the journal.</Text></View> : sessions.map((session) => {
      const lesson = catalogue.findById(session.lessonId);
      const editing = editingId === session.id;
      return <View key={session.id} style={styles.card}>
        <View style={styles.sessionRow}>
          <View style={styles.sessionCopy}><Text style={styles.lessonTitle}>{lesson?.title ?? 'Training session'}</Text><Text style={styles.sessionMeta}>{session.durationMinutes} minutes · {session.completedAt?.slice(0, 10)}</Text></View>
          <Text style={session.outcome === 'success' ? styles.completeText : styles.notStartedText}>{session.outcome?.replace('-', ' ')}</Text>
        </View>
        {editing ? <>
          <TextInput accessibilityLabel="Session notes" multiline maxLength={1000} value={draft} onChangeText={setDraft} placeholder="What helped? What should you change next time?" placeholderTextColor="#929A94" style={styles.notesInput} />
          <View style={styles.journalActions}><Pressable accessibilityRole="button" onPress={() => setEditingId(null)} style={styles.planActionButton}><Text style={styles.planActionText}>Cancel</Text></Pressable><View style={styles.journalPrimary}><PrimaryButton title={saving ? 'Saving…' : 'Save notes'} disabled={saving} onPress={() => void save()} /></View></View>
        </> : <Pressable accessibilityRole="button" onPress={() => startEditing(session.id, session.notes)} style={styles.notesPreview}><Text style={session.notes ? styles.body : styles.notesPlaceholder}>{session.notes || 'Add session notes'}</Text></Pressable>}
      </View>;
    })}
  </AppScreen>;
}
