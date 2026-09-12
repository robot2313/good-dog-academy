import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AppScreen } from '../../../components/AppScreen';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingState } from '../../../components/LoadingState';
import { ReferenceIcon } from '../../../components/ReferenceIcon';
import type { LessonDefinition, LessonId } from '../../../domain/models';
import { referencePalette, referenceStyles } from '../../../theme/referenceStyles';
import { styles } from '../../../theme/styles';
import { lessonIllustrationForSkill } from '../coaching/LessonIllustration';
import { getLessonImageSource } from '../coaching/lessonImageManifest';
import { lessonDifficultyLabels, lessonLibraryErrorMessage, skillLabel } from './lessonLibraryPresentation';
import { LessonLibraryError } from './LessonLibraryError';
import type { LessonLibraryService } from './LessonLibraryService';
import type { LessonLibraryItem } from './lessonLibraryTypes';

export type LessonSummaryScreenViewProps = {
  lessonId: LessonId;
  lessonDefinition: LessonDefinition | null;
  dogName: string | null;
  service: LessonLibraryService;
  loading: boolean;
  error: unknown | null;
  onRetry: () => void;
  allowLockedStart?: boolean;
  onBack: () => void;
  onStart: () => void;
  onCameraCoach?: () => void;
};

const fallbackEquipment = Object.freeze(['Small rewards your dog enjoys']);

export function LessonSummaryScreenView({ lessonId, lessonDefinition, service, loading, error, onRetry, allowLockedStart = false, onBack, onStart, onCameraCoach }: LessonSummaryScreenViewProps): React.JSX.Element {
  let lesson: LessonLibraryItem | null = null;
  let derivedError = error;
  if (!loading && !derivedError) { try { lesson = service.getLessonSummary(lessonId); } catch (cause) { derivedError = cause; } }
  if (loading) return <AppScreen scroll={false}><LoadingState message="Loading lesson…" /></AppScreen>;
  if (derivedError) {
    const invalid = derivedError instanceof LessonLibraryError && derivedError.code === 'LESSON_NOT_FOUND';
    return <AppScreen><Text style={styles.eyebrowDark}>GET READY</Text><ErrorState message={lessonLibraryErrorMessage(derivedError)} onRetry={invalid ? onBack : onRetry} actionTitle={invalid ? 'Back to Lesson Library' : 'Try again'} /></AppScreen>;
  }
  if (!lesson) return <AppScreen><ErrorState message="This lesson could not be displayed." onRetry={onBack} actionTitle="Back to Lesson Library" /></AppScreen>;

  const definitionMatches = lessonDefinition?.id === lesson.id;
  const equipment = lessonDefinition && lessonDefinition.equipment.length > 0 ? lessonDefinition.equipment : fallbackEquipment;
  const imageLabel = lessonDefinition ? lessonIllustrationForSkill(lessonDefinition.skill).accessibilityLabel : `${lesson.title} lesson photograph`;
  const selfDirectedLock = lesson.state === 'LOCKED' && allowLockedStart ? lesson.lock : null;
  const selfDirected = selfDirectedLock !== null;
  const canStart = (lesson.state !== 'LOCKED' || selfDirected) && definitionMatches;
  const learningPoints = lessonDefinition?.steps.slice(0, 4).map(cleanStep) ?? [lesson.description];

  return <SafeAreaView edges={['top', 'bottom']} style={referenceStyles.detailSafe}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={referenceStyles.detailScrollContent} showsVerticalScrollIndicator={false}>
      <View style={referenceStyles.detailHero}><Image accessible accessibilityLabel={imageLabel} accessibilityRole="image" resizeMode="cover" source={getLessonImageSource(lesson.id, lessonDefinition?.skill ?? null)} style={referenceStyles.detailHeroImage} /><View style={referenceStyles.detailOverlayTop}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={({ pressed }) => [referenceStyles.overlayIconButton, pressed && referenceStyles.pressed]}><ReferenceIcon name="back" color="#FFFFFF" /></Pressable><View accessible={false} style={referenceStyles.overlayIconButton}><ReferenceIcon name="bookmark" color="#FFFFFF" /></View></View></View>
      <View style={referenceStyles.detailContent}>
        <Text style={referenceStyles.detailKicker}>GET READY · {skillLabel(lesson.skill)}</Text>
        <Text accessibilityRole="header" style={referenceStyles.detailTitle}>{lesson.title}</Text>
        <View style={referenceStyles.detailChips}><View style={referenceStyles.detailChip}><Text style={referenceStyles.detailChipText}>{lessonDifficultyLabels[lesson.difficulty]}</Text></View><View style={referenceStyles.detailChip}><Text style={referenceStyles.detailChipText}>{lesson.estimatedMinutes} min</Text></View>{selfDirected ? <View style={[referenceStyles.detailChip, { backgroundColor: referencePalette.greenSoft }]}><Text style={[referenceStyles.detailChipText, { color: referencePalette.greenDark }]}>Self-directed</Text></View> : null}</View>
        <Text style={referenceStyles.detailGoal}>{lessonDefinition?.goal ?? lesson.description}</Text>
        {lesson.state === 'LOCKED' && !selfDirected ? <View accessible accessibilityLabel={`Locked. ${lesson.lock.reason}`} style={referenceStyles.detailNotice}><Text style={referenceStyles.detailNoticeTitle}>Why this lesson is locked</Text><Text style={referenceStyles.detailNoticeBody}>{lesson.lock.reason}</Text>{lesson.lock.missingPrerequisiteNames.length > 0 ? <Text style={referenceStyles.detailNoticeBody}>Required first: {lesson.lock.missingPrerequisiteNames.join(', ')}</Text> : null}</View> : null}
        {selfDirectedLock ? <View accessible accessibilityLabel={`Self-directed lesson. ${selfDirectedLock.reason} You can still choose this lesson now.`} style={referenceStyles.detailNotice}><Text style={referenceStyles.detailNoticeTitle}>Later in the recommended Journey</Text><Text style={referenceStyles.detailNoticeBody}>{selfDirectedLock.reason} That order is recommended, but you can still choose this lesson now.</Text></View> : null}
        <View style={{ gap: 10 }}><Text accessibilityRole="header" style={referenceStyles.detailSectionTitle}>You will learn</Text><View style={referenceStyles.detailBulletList}>{learningPoints.map((point, index) => <View key={`${lesson.id}-learn-${index}`} style={referenceStyles.detailBulletRow}><View style={referenceStyles.detailBulletIcon}><ReferenceIcon name="check" size={12} color="#FFFFFF" strokeWidth={2.4} /></View><Text style={referenceStyles.detailBulletText}>{point}</Text></View>)}</View></View>
        {lesson.state !== 'LOCKED' || selfDirected ? <View style={referenceStyles.detailEquipmentCard}><Text accessibilityRole="header" style={referenceStyles.detailSectionTitle}>Before we start</Text>{equipment.map((item, index) => <View key={`${lesson.id}-equipment-${index}`} style={referenceStyles.detailBulletRow}><View style={referenceStyles.detailBulletIcon}><ReferenceIcon name="check" size={12} color="#FFFFFF" strokeWidth={2.4} /></View><Text style={referenceStyles.detailBulletText}>{item}</Text></View>)}</View> : null}
      </View>
    </ScrollView>
    {canStart ? <View style={[referenceStyles.detailFooter, { gap: 8 }]}><Pressable accessibilityRole="button" accessibilityLabel="Start lesson" onPress={onStart} style={({ pressed }) => [referenceStyles.largeGreenButton, pressed && referenceStyles.pressed]}><Text style={referenceStyles.largeGreenButtonText}>Start Lesson</Text></Pressable>{onCameraCoach ? <Pressable accessibilityRole="button" accessibilityLabel="Use Camera Coach beta" onPress={onCameraCoach} style={({ pressed }) => [referenceStyles.largeGreenButton, { backgroundColor: '#0B2545' }, pressed && referenceStyles.pressed]}><Text style={referenceStyles.largeGreenButtonText}>Use Camera Coach (Beta)</Text></Pressable> : null}</View> : null}
  </SafeAreaView>;
}
function cleanStep(step: string): string { return step.replace(/^\s*\d+[.)]\s*/, '').trim(); }