# Milestone 7.1 — Lesson Library Foundation

## Goal

Provide the read-only data contract that a later Lesson Library UI can consume while preserving the Milestone 6 Daily Plan engine unchanged.

`LessonLibraryService` does not read storage directly or own selected-dog state. A caller supplies the validated `LessonCatalogue`, the currently selected dog ID, and the existing `LessonProgress` records loaded through the repository layer.

```ts
const library = new LessonLibraryService(catalogue, selectedDogId, progressRecords);

library.getAllLessons();
library.getGroupedLessons();
library.searchLessons('loose lead');
library.filterLessons({ skill: 'recall', difficulty: 1, state: 'AVAILABLE' });
library.getLessonSummary('recall-name-response');
```

## State and locking

The service delegates state derivation to the existing `LessonUnlockService`. Stored status strings are not treated as the final answer. Library states are `AVAILABLE`, `LOCKED`, `IN_PROGRESS`, or `COMPLETED`.

Locked items include a readable reason plus the stable IDs and titles of every prerequisite whose required successful-completion count has not been met. Inactive catalogue content remains represented as locked, so the library still describes every catalogue entry.

## Metadata, search, and filters

Library metadata uses the permanent lesson ID, title, short description, difficulty level, estimated minutes, and existing behaviour skill. Existing lesson tags are exposed as keywords; no parallel keyword source is introduced.

Search is case-insensitive across title, description, and keywords. Hyphens and spaces are normalized so `loose lead` matches the `loose-lead-walking` keyword. Skill, difficulty, and state filters can be combined.

All returned collections, items, keyword arrays, groups, and lock-detail arrays are frozen read-only values.

## Errors

`LessonLibraryError` exposes stable error codes:

- `MISSING_SELECTED_DOG` — library state cannot be derived without the current dog.
- `CORRUPT_PROGRESS` — progress validation failed, contains duplicate lesson records, or references missing catalogue content.
- `LESSON_NOT_FOUND` — a requested lesson ID is absent from the catalogue.

An empty catalogue is valid and returns empty collections.

## Explicitly deferred

This milestone adds no Lesson Library UI, lesson playback, timers, video, progress dashboard, AI coaching, cloud synchronization, or payment work.
