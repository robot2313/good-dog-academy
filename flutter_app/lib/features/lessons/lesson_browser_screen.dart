import 'package:flutter/material.dart';

import '../../core/theme/gda_theme.dart';
import 'data/lesson_collections.dart';
import 'data/production_lessons.dart';
import 'domain/lesson_models.dart';
import 'logic/lesson_unlock_service.dart';
import 'progress/lesson_progress_controller.dart';

enum LessonBrowserScopeType { skill, collection }

enum _DifficultyFilter { all, beginner, intermediate, advanced }

class LessonBrowserScreen extends StatefulWidget {
  const LessonBrowserScreen.skill({
    super.key,
    required this.title,
    required this.intro,
    required String skill,
  }) : scopeType = LessonBrowserScopeType.skill,
       scopeId = skill;

  const LessonBrowserScreen.collection({
    super.key,
    required this.title,
    required this.intro,
    required String collectionId,
  }) : scopeType = LessonBrowserScopeType.collection,
       scopeId = collectionId;

  final String title;
  final String intro;
  final LessonBrowserScopeType scopeType;
  final String scopeId;

  @override
  State<LessonBrowserScreen> createState() => _LessonBrowserScreenState();
}

class _LessonBrowserScreenState extends State<LessonBrowserScreen> {
  _DifficultyFilter difficultyFilter = _DifficultyFilter.all;

  Map<String, LessonLibraryItem> get resolvedLessons {
    final progress = LessonProgressScope.maybeOf(context);

    return const LessonUnlockService(productionLessons)
        .resolve(progress?.snapshots ?? const <LessonProgressSnapshot>[]);
  }

  List<LessonLibraryItem> get scopedLessons {
    final lessons = resolvedLessons.values;

    if (widget.scopeType == LessonBrowserScopeType.skill) {
      return lessons
          .where((lesson) => lesson.definition.skill == widget.scopeId)
          .toList(growable: false);
    }

    final lessonIds = lessonCollectionById(widget.scopeId).lessonIds.toSet();

    return lessons
        .where((lesson) => lessonIds.contains(lesson.definition.id))
        .toList(growable: false);
  }

  List<LessonLibraryItem> get filteredLessons {
    return scopedLessons
        .where(
          (lesson) => _matchesDifficulty(
            lesson.definition.difficulty,
            difficultyFilter,
          ),
        )
        .toList(growable: false);
  }

  @override
  Widget build(BuildContext context) {
    final progress = LessonProgressScope.maybeOf(context);

    if (progress?.loading == true) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(
          child: CircularProgressIndicator(
            semanticsLabel: 'Loading training progress',
          ),
        ),
      );
    }

    if (progress?.error != null) {
      return Scaffold(
        appBar: AppBar(),
        body: _ProgressLoadError(onRetry: progress!.reload),
      );
    }

    final allLessons = scopedLessons;
    final visibleLessons = filteredLessons;

    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        top: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
          children: [
            Text(
              widget.title,
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 4),
            Text(
              '${visibleLessons.length} of ${allLessons.length} lessons',
              style: const TextStyle(
                color: GdaColors.forest,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 10),
            Text(widget.intro, style: Theme.of(context).textTheme.bodyMedium),
            const SizedBox(height: 20),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final filter in _DifficultyFilter.values)
                  ChoiceChip(
                    label: Text(_filterLabel(filter)),
                    selected: difficultyFilter == filter,
                    selectedColor: GdaColors.selected,
                    backgroundColor: GdaColors.surface,
                    showCheckmark: false,
                    side: const BorderSide(color: GdaColors.border),
                    onSelected: (_) {
                      setState(() {
                        difficultyFilter = filter;
                      });
                    },
                  ),
              ],
            ),
            const SizedBox(height: 20),
            for (var index = 0; index < visibleLessons.length; index++) ...[
              _LessonRow(number: index + 1, item: visibleLessons[index]),
              if (index != visibleLessons.length - 1)
                const SizedBox(height: 10),
            ],
            if (visibleLessons.isEmpty)
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: GdaColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: GdaColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'No lessons at this level',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Choose another difficulty to see available lessons.',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ProgressLoadError extends StatelessWidget {
  const _ProgressLoadError({required this.onRetry});

  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline_rounded,
              color: GdaColors.muted,
              size: 34,
            ),
            const SizedBox(height: 12),
            Text(
              'Training progress could not be loaded safely.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 6),
            Text(
              'No saved training data was changed.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () {
                onRetry();
              },
              child: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}

class _LessonRow extends StatelessWidget {
  const _LessonRow({required this.number, required this.item});

  final int number;
  final LessonLibraryItem item;

  @override
  Widget build(BuildContext context) {
    final lesson = item.definition;

    return Semantics(
      label:
          '$number. ${lesson.title}. ${_difficultyLabel(lesson.difficulty)}. '
          '${lesson.estimatedMinutes} minutes. ${_stateLabel(item.state)}.',
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: GdaColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: GdaColors.border),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 34,
              height: 34,
              alignment: Alignment.center,
              decoration: const BoxDecoration(
                color: GdaColors.selected,
                shape: BoxShape.circle,
              ),
              child: Text(
                '$number',
                style: const TextStyle(
                  color: GdaColors.forest,
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    lesson.title,
                    style: const TextStyle(
                      color: GdaColors.text,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_difficultyLabel(lesson.difficulty)} · '
                    '${lesson.estimatedMinutes} min',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 7),
                  Row(
                    children: [
                      Icon(
                        _stateIcon(item.state),
                        size: 16,
                        color: _stateColor(item.state),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        _stateLabel(item.state),
                        style: TextStyle(
                          color: _stateColor(item.state),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  if (item.state == LessonState.locked &&
                      item.lockReason != null) ...[
                    const SizedBox(height: 5),
                    Text(
                      item.lockReason!,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

bool _matchesDifficulty(int difficulty, _DifficultyFilter filter) {
  switch (filter) {
    case _DifficultyFilter.all:
      return true;
    case _DifficultyFilter.beginner:
      return difficulty <= 2;
    case _DifficultyFilter.intermediate:
      return difficulty == 3;
    case _DifficultyFilter.advanced:
      return difficulty >= 4;
  }
}

String _filterLabel(_DifficultyFilter filter) {
  switch (filter) {
    case _DifficultyFilter.all:
      return 'All';
    case _DifficultyFilter.beginner:
      return 'Beginner';
    case _DifficultyFilter.intermediate:
      return 'Intermediate';
    case _DifficultyFilter.advanced:
      return 'Advanced';
  }
}

String _difficultyLabel(int difficulty) {
  if (difficulty <= 2) {
    return 'Beginner';
  }

  if (difficulty == 3) {
    return 'Intermediate';
  }

  return 'Advanced';
}

String _stateLabel(LessonState state) {
  switch (state) {
    case LessonState.available:
      return 'Available';
    case LessonState.locked:
      return 'Locked';
    case LessonState.inProgress:
      return 'In progress';
    case LessonState.completed:
      return 'Completed';
  }
}

IconData _stateIcon(LessonState state) {
  switch (state) {
    case LessonState.available:
      return Icons.play_circle_outline_rounded;
    case LessonState.locked:
      return Icons.lock_outline_rounded;
    case LessonState.inProgress:
      return Icons.schedule_rounded;
    case LessonState.completed:
      return Icons.check_circle_outline_rounded;
  }
}

Color _stateColor(LessonState state) {
  switch (state) {
    case LessonState.available:
    case LessonState.completed:
      return GdaColors.forest;
    case LessonState.inProgress:
      return GdaColors.gold;
    case LessonState.locked:
      return GdaColors.muted;
  }
}
