import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import { useLessonProgress } from '../features/lessons/progress/LessonProgressContext';
import { sessionExporter } from '../features/progress/SessionExportService';
import { createSessionJournal, createSessionJournalCsv, createSessionJournalFileName, filterSessionJournal, sessionOutcomeLabels, type SessionOutcomeFilter, type SessionSkillFilter } from '../features/progress/TrainingSessionJournal';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { styles } from '../theme/styles';
import type { RootStackParamList } from '../types/navigation';
import type { BehaviourSkill } from '../domain/models';

type Props = NativeStackScreenProps<RootStackParamList, 'SessionHistory'>;
const catalogue = loadBundledLessonCatalogue();
const outcomeOptions: readonly { value: SessionOutcomeFilter; label: string }[] = [
  { value: 'all', label: 'All results' },
  { value: 'success', label: sessionOutcomeLabels.success },
  { value: 'partial-success', label: sessionOutcomeLabels['partial-success'] },
  { value: 'unsuccessful', label: sessionOutcomeLabels.unsuccessful },
];

type FilterChipProps = { label: string; selected: boolean; onPress: () => void };
function FilterChip({ label, selected, onPress }: FilterChipProps): React.JSX.Element {
  return <Pressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.filterChip, selected && styles.filterChipActive]}><Text style={[styles.filterChipText, selected && styles.filterChipTextActive]}>{label}</Text></Pressable>;
}

export function SessionHistoryScreen({ navigation }: Props): React.JSX.Element {
  const { sessions, updateSessionNotes, error } = useLessonProgress();
  const { status } = useOnboarding();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [outcome, setOutcome] = useState<SessionOutcomeFilter>('all');
  const [skill, setSkill] = useState<SessionSkillFilter>('all');
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const journal = useMemo(() => createSessionJournal(sessions, catalogue), [sessions]);
  const availableSkills = useMemo(() => [...new Set(journal.flatMap((entry) => entry.skill ? [entry.skill] : []))].sort(), [journal]);
  const filteredJournal = useMemo(() => filterSessionJournal(journal, { query, outcome, skill }), [journal, outcome, query, skill]);
  const filtersActive = query.trim().length > 0 || outcome !== 'all' || skill !== 'all';

  const startEditing = (sessionId: string, notes: string) => { setEditingId(sessionId); setDraft(notes); };
  const save = async () => {
    if (!editingId) return;
    setSaving(true);
    if (await updateSessionNotes(editingId, draft)) setEditingId(null);
    setSaving(false);
  };
  const exportSessions = async () => {
    if (filteredJournal.length === 0 || status?.state !== 'complete') return;
    setExporting(true);
    setExportError(null);
    setExportMessage(null);
    try {
      const result = await sessionExporter.exportCsv(createSessionJournalCsv(filteredJournal), createSessionJournalFileName(status.dog.name));
      setExportMessage(result === 'downloaded' ? 'Training journal downloaded.' : result === 'shared' ? 'Training journal is ready to share.' : 'File sharing is not available on this device.');
    } catch {
      setExportError('The training journal could not be exported. Please try again.');
    } finally {
      setExporting(false);
    }
  };
  const resetFilters = () => { setQuery(''); setOutcome('all'); setSkill('all'); };

  return <AppScreen>
    <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backButtonText}>‹ Progress</Text></Pressable>
    <Text style={styles.eyebrowDark}>TRAINING JOURNAL</Text>
    <Text style={styles.pageTitle}>Session history</Text>
    <Text style={styles.body}>Keep useful observations about what worked, what was distracting, and what to try next time.</Text>
    {error ? <View style={styles.errorCard}><Text style={styles.body}>{error}</Text></View> : null}
    {sessions.length > 0 ? <View style={styles.card}>
      <Text style={styles.sectionTitle}>Find sessions</Text>
      <TextInput accessibilityLabel="Search sessions" value={query} onChangeText={setQuery} placeholder="Search lessons, skills, or notes" placeholderTextColor="#929A94" style={styles.input} />
      <View accessibilityRole="radiogroup" accessibilityLabel="Filter sessions by result" style={styles.fieldGroup}>
        <Text style={styles.label}>Result</Text>
        <View style={styles.filterRow}>{outcomeOptions.map((option) => <FilterChip key={option.value} label={option.label} selected={outcome === option.value} onPress={() => setOutcome(option.value)} />)}</View>
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel="Filter sessions by skill" style={styles.fieldGroup}>
        <Text style={styles.label}>Skill</Text>
        <View style={styles.filterRow}>
          <FilterChip label="All skills" selected={skill === 'all'} onPress={() => setSkill('all')} />
          {availableSkills.map((option: BehaviourSkill) => <FilterChip key={option} label={option.replaceAll('-', ' ')} selected={skill === option} onPress={() => setSkill(option)} />)}
        </View>
      </View>
      <View style={styles.journalToolbar}><Text style={styles.resultsText}>{filteredJournal.length} {filteredJournal.length === 1 ? 'session' : 'sessions'}</Text>{filtersActive ? <Pressable accessibilityRole="button" onPress={resetFilters} style={styles.clearFilterButton}><Text style={styles.planActionText}>Clear filters</Text></Pressable> : null}</View>
      <PrimaryButton title={exporting ? 'Preparing export…' : `Export ${filteredJournal.length} ${filteredJournal.length === 1 ? 'session' : 'sessions'}`} accessibilityLabel="Export visible sessions as CSV" disabled={exporting || filteredJournal.length === 0} onPress={() => void exportSessions()} />
      <Text style={styles.exportHint}>Exports the visible results, including your private session notes, as a CSV file.</Text>
      {exportMessage ? <Text accessibilityRole="alert" style={styles.reminderSuccess}>{exportMessage}</Text> : null}
      {exportError ? <Text accessibilityRole="alert" style={styles.validationText}>{exportError}</Text> : null}
    </View> : null}
    {sessions.length === 0 ? <View style={styles.card}><Text style={styles.sectionTitle}>No sessions yet</Text><Text style={styles.body}>Complete a lesson to begin the journal.</Text></View> : filteredJournal.length === 0 ? <View style={styles.card}><Text style={styles.sectionTitle}>No matching sessions</Text><Text style={styles.body}>Try a different search or clear the filters.</Text></View> : filteredJournal.map(({ session, lessonTitle }) => {
      const editing = editingId === session.id;
      return <View key={session.id} style={styles.card}>
        <View style={styles.sessionRow}>
          <View style={styles.sessionCopy}><Text style={styles.lessonTitle}>{lessonTitle}</Text><Text style={styles.sessionMeta}>{session.durationMinutes} minutes · {(session.completedAt ?? session.startedAt).slice(0, 10)}</Text></View>
          <Text style={session.outcome === 'success' ? styles.completeText : styles.notStartedText}>{session.outcome ? sessionOutcomeLabels[session.outcome] : 'Not rated'}</Text>
        </View>
        {editing ? <>
          <TextInput accessibilityLabel="Session notes" multiline maxLength={1000} value={draft} onChangeText={setDraft} placeholder="What helped? What should you change next time?" placeholderTextColor="#929A94" style={styles.notesInput} />
          <View style={styles.journalActions}><Pressable accessibilityRole="button" onPress={() => setEditingId(null)} style={styles.planActionButton}><Text style={styles.planActionText}>Cancel</Text></Pressable><View style={styles.journalPrimary}><PrimaryButton title={saving ? 'Saving…' : 'Save notes'} disabled={saving} onPress={() => void save()} /></View></View>
        </> : <Pressable accessibilityRole="button" onPress={() => startEditing(session.id, session.notes)} style={styles.notesPreview}><Text style={session.notes ? styles.body : styles.notesPlaceholder}>{session.notes || 'Add session notes'}</Text></Pressable>}
      </View>;
    })}
  </AppScreen>;
}
