import { useState } from 'react';
import { Pressable, SectionList, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AppScreen } from '../../../components/AppScreen';
import { ErrorState } from '../../../components/ErrorState';
import { LoadingState } from '../../../components/LoadingState';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryTextButton } from '../../../components/SecondaryTextButton';
import { behaviourSkills, type BehaviourSkill, type LessonDifficultyLevel, type LessonId } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import { LessonLibraryCard } from './LessonLibraryCard';
import { LessonLibraryFilterChip } from './LessonLibraryFilterChip';
import { lessonDifficultyLabels, lessonLibraryErrorMessage, lessonStateLabels, skillLabel } from './lessonLibraryPresentation';
import type { LessonLibraryService } from './LessonLibraryService';
import type { LessonLibraryItem, LessonState } from './lessonLibraryTypes';

type LessonLibraryScreenViewProps = {
  hero?: React.JSX.Element;
  dogName: string | null;
  service: LessonLibraryService;
  loading: boolean;
  error: unknown | null;
  onRetry: () => void;
  onOpenLesson: (lessonId: LessonId) => void;
};

type LibrarySection = {
  skill: BehaviourSkill;
  title: string;
  data: readonly LessonLibraryItem[];
};

const difficultyOptions: readonly LessonDifficultyLevel[] = [1, 2, 3, 4, 5];
const stateOptions: readonly LessonState[] = ['AVAILABLE', 'LOCKED', 'IN_PROGRESS', 'COMPLETED'];

export function LessonLibraryScreenView({ hero, dogName, service, loading, error, onRetry, onOpenLesson }: LessonLibraryScreenViewProps): React.JSX.Element {
  const [query, setQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<BehaviourSkill | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<LessonDifficultyLevel | null>(null);
  const [selectedState, setSelectedState] = useState<LessonState | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  let derivedError = error;
  let allLessons: readonly LessonLibraryItem[] = [];
  let matchingLessons: readonly LessonLibraryItem[] = [];
  let sections: readonly LibrarySection[] = [];
  if (!loading && !derivedError) {
    try {
      allLessons = service.getAllLessons();
      matchingLessons = service.queryLessons(query, {
        skill: selectedSkill ?? undefined,
        difficulty: selectedDifficulty ?? undefined,
        state: selectedState ?? undefined,
      });
      sections = service.getGroupedLessons(matchingLessons).map((group) => ({ skill: group.skill, title: group.title, data: group.lessons }));
    } catch (cause) {
      derivedError = cause;
    }
  }

  if (loading) return <AppScreen scroll={false}><LoadingState message="Loading the lesson library…" /></AppScreen>;
  if (derivedError) return <AppScreen><Text style={styles.eyebrowDark}>ACADEMY</Text><Text style={styles.pageTitle}>Lesson Library</Text><ErrorState message={lessonLibraryErrorMessage(derivedError)} onRetry={onRetry} /></AppScreen>;

  const clearFilters = () => {
    setSelectedSkill(null);
    setSelectedDifficulty(null);
    setSelectedState(null);
  };
  const resetSearchAndFilters = () => {
    setQuery('');
    clearFilters();
  };
  const activeFilterCount = Number(selectedSkill !== null) + Number(selectedDifficulty !== null) + Number(selectedState !== null);
  const hasSearch = query.length > 0;
  const hasActiveQuery = query.trim().length > 0;
  const resultLabel = `${matchingLessons.length} ${matchingLessons.length === 1 ? 'lesson' : 'lessons'}${hasActiveQuery || activeFilterCount > 0 ? ' found' : ''}`;

  if (allLessons.length === 0) {
    return <AppScreen>
      <Text style={styles.eyebrowDark}>ACADEMY</Text>
      <Text style={styles.pageTitle}>Lesson Library</Text>
      <Text style={styles.libraryDogContext}>Lesson access and progress for {dogName ?? 'your dog'}.</Text>
      <View style={styles.libraryEmptyCard} accessibilityRole="summary">
        <Text style={styles.sectionTitle}>No lessons are available yet</Text>
        <Text style={styles.body}>The lesson catalogue is empty. Your dog’s saved progress has not been changed.</Text>
      </View>
    </AppScreen>;
  }

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="light" />
    <SectionList<LessonLibraryItem, LibrarySection>
      sections={sections}
      keyExtractor={(lesson) => lesson.id}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.libraryListContent}
      ListHeaderComponent={<View style={styles.libraryHeader}>
        {hero ?? (
          <>
            <Text style={styles.eyebrowDark}>ACADEMY</Text>
            <Text style={styles.pageTitle}>Lesson Library</Text>
            <Text style={styles.libraryDogContext}>Lesson access and progress for <Text style={styles.libraryDogName}>{dogName ?? 'your dog'}</Text>.</Text>
          </>
        )}

        <View style={styles.librarySearchField}>
          <TextInput
            accessibilityLabel="Search lessons"
            placeholder="Search lessons"
            placeholderTextColor="#8A8A8A"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            style={styles.librarySearchInput}
          />
          {hasSearch ? <Pressable accessibilityRole="button" accessibilityLabel="Clear lesson search" onPress={() => setQuery('')} style={({ pressed }) => [styles.librarySearchClear, pressed && styles.pressed]}><Text style={styles.librarySearchClearText}>Clear</Text></Pressable> : null}
        </View>

        <View style={styles.libraryFilterToolbar}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ''}`} accessibilityState={{ expanded: filtersExpanded }} onPress={() => setFiltersExpanded((current) => !current)} style={({ pressed }) => [styles.libraryFilterToggle, pressed && styles.pressed]}>
            <Text style={styles.libraryFilterToggleText}>Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}</Text>
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.libraryFilterArrow}>{filtersExpanded ? '−' : '+'}</Text>
          </Pressable>
          {activeFilterCount > 0 ? <Pressable accessibilityRole="button" accessibilityLabel="Clear all lesson filters" onPress={clearFilters} style={({ pressed }) => [styles.libraryClearFiltersButton, pressed && styles.pressed]}><Text style={styles.libraryClearFiltersText}>Clear filters</Text></Pressable> : null}
        </View>

        {activeFilterCount > 0 ? <View style={styles.libraryActiveFilters} accessibilityLabel={`${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'}`}>
          {selectedSkill ? <Text style={styles.libraryActiveFilterText}>Skill: {skillLabel(selectedSkill)}</Text> : null}
          {selectedDifficulty ? <Text style={styles.libraryActiveFilterText}>{lessonDifficultyLabels[selectedDifficulty]}</Text> : null}
          {selectedState ? <Text style={styles.libraryActiveFilterText}>{lessonStateLabels[selectedState]}</Text> : null}
        </View> : null}

        {filtersExpanded ? <View style={styles.libraryFilterPanel}>
          <View style={styles.libraryFilterGroup} accessibilityRole="radiogroup" accessibilityLabel="Skill filters">
            <Text style={styles.label}>Skill</Text>
            <View style={styles.libraryFilterChips}>
              <LessonLibraryFilterChip label="All skills" selected={selectedSkill === null} onPress={() => setSelectedSkill(null)} />
              {behaviourSkills.map((skill) => <LessonLibraryFilterChip key={skill} label={skillLabel(skill)} accessibilityLabel={`Skill: ${skillLabel(skill)}`} selected={selectedSkill === skill} onPress={() => setSelectedSkill(skill)} />)}
            </View>
          </View>
          <View style={styles.libraryFilterGroup} accessibilityRole="radiogroup" accessibilityLabel="Difficulty filters">
            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.libraryFilterChips}>
              <LessonLibraryFilterChip label="All levels" selected={selectedDifficulty === null} onPress={() => setSelectedDifficulty(null)} />
              {difficultyOptions.map((difficulty) => <LessonLibraryFilterChip key={difficulty} label={lessonDifficultyLabels[difficulty]} accessibilityLabel={`Difficulty: ${lessonDifficultyLabels[difficulty]}`} selected={selectedDifficulty === difficulty} onPress={() => setSelectedDifficulty(difficulty)} />)}
            </View>
          </View>
          <View style={styles.libraryFilterGroup} accessibilityRole="radiogroup" accessibilityLabel="Lesson state filters">
            <Text style={styles.label}>Progress state</Text>
            <View style={styles.libraryFilterChips}>
              <LessonLibraryFilterChip label="All states" selected={selectedState === null} onPress={() => setSelectedState(null)} />
              {stateOptions.map((state) => <LessonLibraryFilterChip key={state} label={lessonStateLabels[state]} accessibilityLabel={`State: ${lessonStateLabels[state]}`} selected={selectedState === state} onPress={() => setSelectedState(state)} />)}
            </View>
          </View>
        </View> : null}

        <Text accessibilityLiveRegion="polite" accessibilityLabel={resultLabel} style={styles.libraryResultCount}>{resultLabel}</Text>
      </View>}
      renderSectionHeader={({ section }) => <View accessible accessibilityRole="header" accessibilityLabel={`${section.title} lessons`} style={styles.librarySectionHeader}><Text style={styles.librarySectionTitle}>{section.title}</Text><Text style={styles.librarySectionCount}>{section.data.length}</Text></View>}
      renderItem={({ item }) => <View style={styles.libraryCardSpacing}><LessonLibraryCard lesson={item} onPress={() => onOpenLesson(item.id)} /></View>}
      ListEmptyComponent={<View style={styles.libraryNoResultsCard}>
        <Text style={styles.sectionTitle}>No lessons match your search</Text>
        <Text style={styles.body}>Try a different phrase or remove one of the active filters.</Text>
        {hasSearch ? <SecondaryTextButton title="Clear search" onPress={() => setQuery('')} /> : null}
        {activeFilterCount > 0 ? <SecondaryTextButton title="Clear filters" onPress={clearFilters} /> : null}
        {hasSearch && activeFilterCount > 0 ? <PrimaryButton title="Clear all search and filters" onPress={resetSearchAndFilters} /> : null}
      </View>}
    />
  </SafeAreaView>;
}
