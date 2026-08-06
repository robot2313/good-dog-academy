import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, Text, View } from 'react-native';

import { LessonLibraryScreen } from '../library/LessonLibraryScreen';
import { styles } from '../../../theme/styles';
import type { RootStackParamList } from '../../../types/navigation';
import {
  lessonCollectionById,
  trainingCategoryForSkill,
  type LessonDiscoveryScope,
} from './lessonDiscovery';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonBrowse'>;

export function LessonBrowseScreen({ navigation, route }: Props): React.JSX.Element {
  const { scope, title, intro } = browsePresentation(route.params);

  return (
    <LessonLibraryScreen
      scope={scope}
      allowLockedSelection
      hero={(
        <View style={styles.lessonBrowseHero}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Academy"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.lessonBrowseBack, pressed && styles.pressed]}
          >
            <Text style={styles.lessonBrowseBackText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.eyebrowDark}>CHOOSE YOUR TRAINING</Text>
          <Text accessibilityRole="header" style={styles.pageTitle}>{title}</Text>
          <Text style={styles.libraryDogContext}>{intro}</Text>
        </View>
      )}
    />
  );
}

function browsePresentation(params: Props['route']['params']): {
  scope: LessonDiscoveryScope;
  title: string;
  intro: string;
} {
  if (params?.skill) {
    const category = trainingCategoryForSkill(params.skill);
    return {
      scope: { type: 'skill', skill: params.skill },
      title: category.label,
      intro: category.description,
    };
  }

  if (params?.collectionId) {
    const collection = lessonCollectionById(params.collectionId);
    return {
      scope: { type: 'collection', collectionId: collection.id },
      title: `${collection.label} Lessons`,
      intro: `${collection.ageLabel}. ${collection.description}`,
    };
  }

  if (params?.recommended) {
    return {
      scope: { type: 'recommended' },
      title: 'Recommended for You',
      intro: 'Available and in-progress lessons selected from your current training progress.',
    };
  }

  return {
    scope: { type: 'all' },
    title: 'All Lessons',
    intro: 'Browse every lesson and choose the training that matters most right now.',
  };
}
