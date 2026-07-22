import { Text, View } from 'react-native';

import { styles } from '../../../theme/styles';
import { lessonStateLabels } from './lessonLibraryPresentation';
import type { LessonState } from './lessonLibraryTypes';

export function LessonStateBadge({ state }: { state: LessonState }): React.JSX.Element {
  return <View style={[
    styles.libraryStateBadge,
    state === 'AVAILABLE' && styles.libraryStateAvailable,
    state === 'LOCKED' && styles.libraryStateLocked,
    state === 'IN_PROGRESS' && styles.libraryStateInProgress,
    state === 'COMPLETED' && styles.libraryStateCompleted,
  ]}>
    <Text style={styles.libraryStateText}>{lessonStateLabels[state]}</Text>
  </View>;
}
