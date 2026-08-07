import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { AppScreen } from '../../../components/AppScreen';
import { IdentityHeader } from '../../../components/IdentityHeader';
import { ReferenceIcon } from '../../../components/ReferenceIcon';
import { referencePalette, referenceScreenStyles, referenceStyles } from '../../../theme/referenceStyles';
import type { RootStackParamList } from '../../../types/navigation';
import { getLessonImageSource } from '../coaching/lessonImageManifest';
import { useLessonLibraryData } from '../library/LessonLibraryContext';
import { lessonCardAccessibilityLabel, lessonDifficultyLabels } from '../library/lessonLibraryPresentation';
import { LessonLibraryService } from '../library/LessonLibraryService';
import { recommendedLessons } from './lessonDiscovery';

type Props = NativeStackScreenProps<RootStackParamList, 'Recommended'>;

export function RecommendedLessonsScreen({ navigation }: Props): React.JSX.Element {
  const { catalogue, selectedDog, progressRecords } = useLessonLibraryData();
  const dogName = selectedDog?.name ?? 'your dog';
  const service = useMemo(
    () => new LessonLibraryService(catalogue, selectedDog?.id ?? null, progressRecords),
    [catalogue, progressRecords, selectedDog?.id],
  );

  let lessons = [] as ReturnType<typeof recommendedLessons>;
  try {
    lessons = recommendedLessons(service.getAllLessons(), 12);
  } catch {
    lessons = [];
  }

  return (
    <AppScreen compact>
      <IdentityHeader onBack={() => navigation.goBack()} backLabel="Back" />

      <View style={referenceStyles.header}>
        <Text accessibilityRole="header" style={referenceStyles.title}>Recommended For You</Text>
        <Text style={referenceStyles.smallSubtitle}>
          Chosen for {dogName} from current progress · {lessons.length} lessons
        </Text>
      </View>

      <View style={referenceStyles.lessonList}>
        {lessons.map((lesson, index) => (
          <Pressable
            key={lesson.id}
            accessibilityRole="button"
            accessibilityLabel={lessonCardAccessibilityLabel(lesson, true)}
            onPress={() => navigation.navigate('LessonSummary', { lessonId: lesson.id })}
            style={({ pressed }) => [referenceStyles.lessonRow, pressed && referenceStyles.pressed]}
          >
            <Text style={referenceStyles.lessonRowNumber}>{index + 1}.</Text>
            <Image
              accessible={false}
              resizeMode="cover"
              source={getLessonImageSource(lesson.id, lesson.skill)}
              style={referenceStyles.lessonRowImage}
            />
            <View style={referenceStyles.lessonRowCopy}>
              <Text numberOfLines={2} style={referenceStyles.lessonRowTitle}>{lesson.title}</Text>
              <Text style={referenceStyles.lessonRowMeta}>
                {lessonDifficultyLabels[lesson.difficulty]} · {lesson.estimatedMinutes} min
              </Text>
              {lesson.state === 'COMPLETED' ? <Text style={referenceStyles.lessonRowState}>Completed</Text> : null}
              {lesson.state === 'IN_PROGRESS' ? <Text style={referenceStyles.lessonRowState}>In progress</Text> : null}
            </View>
            <ReferenceIcon name="chevron" size={17} color={referencePalette.inactive} />
          </Pressable>
        ))}
      </View>

      {lessons.length === 0 ? (
        <View style={referenceScreenStyles.emptyCard}>
          <Text style={referenceScreenStyles.emptyTitle}>Nothing to recommend yet</Text>
          <Text style={referenceScreenStyles.emptyBody}>
            Recommendations appear once lesson progress is ready.
          </Text>
        </View>
      ) : null}

      <View style={referenceScreenStyles.noticeInfo}>
        <Text style={referenceScreenStyles.noticeInfoTitle}>Recommendations guide — they do not restrict</Text>
        <Text style={referenceScreenStyles.noticeInfoBody}>
          You can still choose any active lesson from Categories without changing your Journey.
        </Text>
      </View>
    </AppScreen>
  );
}
