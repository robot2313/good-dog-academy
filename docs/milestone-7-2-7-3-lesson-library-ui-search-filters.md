# Milestones 7.2 and 7.3 — Lesson Library UI, Search, and Filters

## Scope

These milestones add a read-only, selected-dog-aware Lesson Library to the existing Academy tab. The library renders the immutable production catalogue through the Milestone 7.1 `LessonLibraryService`; it does not derive progress state, locking, search matches, filters, or skill groups in React components.

## Screen structure

`LessonLibraryProvider` loads validated `LessonProgress` records from the existing repository and combines them with the selected dog from onboarding state. `LessonLibraryScreen` constructs the service for that snapshot and passes it to a presentation-only view.

The phone-first screen uses one `SectionList` with:

- a title and selected-dog context;
- a labelled search field and clear-search action;
- an expandable, wrapping filter panel;
- active-filter feedback and a results announcement;
- deterministic skill sections returned by the service; and
- cards showing title, skill, difficulty, estimated time, textual state, and prerequisite guidance.

Empty skill sections are never rendered. Stable lesson IDs are used as list keys, and the screen does not nest another scrolling list.

## Search behaviour

The view keeps only the query text as local state and calls `LessonLibraryService.queryLessons`. The service normalizes case, leading and trailing whitespace, hyphens, and spaces and searches lesson titles, descriptions, and catalogue keywords. Clearing search preserves filters. When both search and filters are active, a separate action can clear both.

## Filter behaviour

Skill, difficulty, and derived lesson-state filters are single-choice within their category and combinable across categories. The active choices and count remain visible outside the expanded panel. Clearing filters preserves search. Grouping is performed only after the service applies the combined query, so filtered results keep deterministic catalogue ordering while empty groups disappear.

## State handling

- **Loading:** an accessible progress indicator replaces a blank screen while progress loads.
- **Empty catalogue:** a calm, distinct message explains that no lessons are available.
- **No results:** contextual clear-search, clear-filter, and combined-reset actions are shown based on active controls.
- **Missing dog:** the typed missing-selected-dog failure is explained without inventing a dog or progress.
- **Corrupt progress:** repository or validation failures become a recoverable corrupt-progress error rather than synthetic progress.
- **Unexpected error:** a plain-language fallback and retry action are provided.

Retry reloads progress while local search and filter state remains mounted where practical.

## Accessibility decisions

Search, filter controls, group headings, result counts, loading state, and lesson cards have explicit labels and roles. Filter chips expose selected state. Every state has visible text, so colour is supplemental. Card announcements include skill, difficulty, duration, state, and lock reason. Controls use at least a 44-point minimum target, chips wrap on narrow phones, text can shrink or wrap without fixed-height clipping, and safe-area handling follows the shared screen component.

## Navigation decision

The existing Academy tab is retained and now hosts the library. Pressing either an available or locked card opens a new native-stack `LessonSummary` route. The minimal summary shows metadata and prerequisite guidance; a locked card can be inspected but cannot start training. Missing lesson IDs render a safe return action.

## Files changed or added

- `App.tsx`
- `README.md`
- `docs/milestone-7-2-7-3-lesson-library-ui-search-filters.md`
- `src/components/ErrorState.tsx`
- `src/components/LoadingState.tsx`
- `src/features/lessons/library/LessonLibraryCard.tsx`
- `src/features/lessons/library/LessonLibraryContext.tsx`
- `src/features/lessons/library/LessonLibraryFilterChip.tsx`
- `src/features/lessons/library/LessonLibraryScreen.tsx`
- `src/features/lessons/library/LessonLibraryScreenView.tsx`
- `src/features/lessons/library/LessonLibraryService.ts`
- `src/features/lessons/library/LessonStateBadge.tsx`
- `src/features/lessons/library/LessonSummaryScreen.tsx`
- `src/features/lessons/library/LessonSummaryScreenView.tsx`
- `src/features/lessons/library/lessonLibraryPresentation.ts`
- `src/navigation/AppNavigator.tsx`
- `src/screens/AcademyScreen.tsx`
- `src/theme/styles.ts`
- `src/types/navigation.ts`
- `tests/lessons/lessonLibrary.test.ts`
- `tests/lessons/lessonLibraryNavigation.test.tsx`
- `tests/lessons/lessonLibraryScreen.test.tsx`

## Tests added

Service coverage verifies combined query/filter/group behaviour. Presentation coverage verifies content, selected-dog context, grouping, metadata, textual states, lock reasons, loading, empty catalogue, missing dog, corrupt progress, unexpected errors, retry, all search behaviours, combinable filters, active-filter feedback, result counts, empty-group removal, reset actions, card accessibility labels, and invalid summary IDs. App-level navigation coverage opens available and locked summaries through the Academy tab.

## Explicit exclusions

Lesson playback, timers, completion controls, progress writes, video, a full lesson-details experience, dashboards, achievements, streaks, AI coaching, payments, cloud sync, notifications, analytics, and advanced tablet layouts remain outside these milestones.
