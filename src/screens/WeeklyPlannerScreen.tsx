import { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import type { DailyPlan, LessonId } from '../domain/models';
import { appStorage } from '../services/appStorage';
import { StorageTransactionManager } from '../storage/StorageTransactionManager';
import { createLocalId } from '../utils/ids';
import { DailyPlanGenerator, dogAgeInMonths } from '../features/dailyPlan/DailyPlanGenerator';
import { WeeklyPlanService } from '../features/dailyPlan/WeeklyPlanService';
import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import { LessonEligibilityService } from '../features/lessons/eligibility';
import { useLessonProgress } from '../features/lessons/progress/LessonProgressContext';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { styles } from '../theme/styles';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'WeeklyPlanner'>;
const catalogue = loadBundledLessonCatalogue();
const weeklyPlans = new WeeklyPlanService(new StorageTransactionManager(appStorage), catalogue, new DailyPlanGenerator(catalogue), createLocalId, () => new Date().toISOString());

export function WeeklyPlannerScreen({ navigation }: Props): React.JSX.Element {
  const { status } = useOnboarding();
  const { records } = useLessonProgress();
  const [plans, setPlans] = useState<DailyPlan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<LessonId[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);
  const ageMonths = status?.state === 'complete' ? dogAgeInMonths(status.dog.dateOfBirth, status.dog.estimatedAgeYears, now) : 0;
  const eligibleLessons = useMemo(() => {
    const eligibility = new LessonEligibilityService(catalogue);
    return catalogue.definitions.filter((lesson) => eligibility.evaluate(lesson.id, ageMonths, records).eligible);
  }, [ageMonths, records]);

  useEffect(() => {
    if (status?.state !== 'complete') return;
    setLoading(true); setError(null);
    void weeklyPlans.ensureWeek(status.dog.id, status.behaviourProfile, ageMonths, records, now.toISOString().slice(0, 10))
      .then(setPlans).catch(() => setError('The weekly plan could not be prepared.')).finally(() => setLoading(false));
  }, [ageMonths, now, records, status]);

  const updatePlan = (updated: DailyPlan) => setPlans((current) => current.map((plan) => plan.id === updated.id ? updated : plan));
  const toggleLesson = (id: LessonId) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 2 ? [...current, id] : current);
  const saveLessons = async (plan: DailyPlan) => {
    if (status?.state !== 'complete' || selected.length === 0) return;
    setSaving(true); setError(null);
    try { updatePlan(await weeklyPlans.setLessons(plan.id, status.dog.id, selected, ageMonths, records)); setEditingId(null); }
    catch { setError('Those lessons could not be scheduled.'); }
    finally { setSaving(false); }
  };
  const toggleRest = async (plan: DailyPlan) => {
    if (status?.state !== 'complete') return;
    setSaving(true); setError(null);
    try { updatePlan(await weeklyPlans.toggleRestDay(plan.id, status.dog.id)); }
    catch { setError('That day could not be changed.'); }
    finally { setSaving(false); }
  };

  return <AppScreen>
    <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backButtonText}>‹ Today</Text></Pressable>
    <Text style={styles.eyebrowDark}>WEEKLY RHYTHM</Text>
    <Text style={styles.pageTitle}>7-day planner</Text>
    <Text style={styles.body}>Balance short training sessions with intentional rest. Existing plans and completed days are always preserved.</Text>
    {loading ? <Text style={styles.body}>Preparing the week…</Text> : null}
    {error ? <View style={styles.errorCard}><Text style={styles.body}>{error}</Text></View> : null}
    {plans.map((plan) => {
      const editing = editingId === plan.id;
      return <View key={plan.id} style={[styles.card, plan.status === 'skipped' && styles.restDayCard]}>
        <View style={styles.weekDayHeader}><View><Text style={styles.weekDayName}>{new Date(`${plan.date}T00:00:00.000Z`).toLocaleDateString(undefined, { weekday: 'long' })}</Text><Text style={styles.sessionMeta}>{plan.date}</Text></View><View style={styles.planStatusPill}><Text style={styles.planStatusText}>{plan.status.replace('-', ' ')}</Text></View></View>
        {plan.status === 'skipped' ? <Text style={styles.body}>Rest day — progress is protected.</Text> : plan.lessonIds.map((id) => <Text key={id} style={styles.weekLesson}>• {catalogue.findById(id)?.title ?? id}</Text>)}
        {editing ? <View style={styles.weekEditor}>
          <Text style={styles.label}>Choose one or two eligible lessons</Text>
          <View style={styles.filterRow}>{eligibleLessons.map((lesson) => <Pressable key={lesson.id} accessibilityRole="button" accessibilityState={{ selected: selected.includes(lesson.id) }} onPress={() => toggleLesson(lesson.id)} style={[styles.filterChip, selected.includes(lesson.id) && styles.filterChipActive]}><Text style={[styles.filterChipText, selected.includes(lesson.id) && styles.filterChipTextActive]}>{lesson.title}</Text></Pressable>)}</View>
          <View style={styles.journalActions}><Pressable accessibilityRole="button" onPress={() => setEditingId(null)} style={styles.planActionButton}><Text style={styles.planActionText}>Cancel</Text></Pressable><View style={styles.journalPrimary}><PrimaryButton title={saving ? 'Saving…' : 'Save day'} disabled={saving || selected.length === 0} onPress={() => void saveLessons(plan)} /></View></View>
        </View> : plan.status === 'scheduled' || plan.status === 'skipped' ? <View style={styles.weekActions}><Pressable accessibilityRole="button" onPress={() => { setEditingId(plan.id); setSelected([...plan.lessonIds]); }} style={[styles.planActionButton, styles.weekActionFlex]}><Text style={styles.planActionText}>Choose lessons</Text></Pressable><Pressable accessibilityRole="button" disabled={saving} onPress={() => void toggleRest(plan)} style={[styles.planActionButton, styles.weekActionFlex]}><Text style={styles.planActionText}>{plan.status === 'skipped' ? 'Restore training' : 'Make rest day'}</Text></Pressable></View> : null}
      </View>;
    })}
  </AppScreen>;
}
