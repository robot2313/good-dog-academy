import 'package:flutter/material.dart';

import '../../core/theme/gda_theme.dart';
import '../lessons/data/production_lessons.dart';
import '../lessons/domain/lesson_models.dart';
import '../lessons/logic/lesson_unlock_service.dart';
import '../lessons/progress/lesson_progress_controller.dart';

class JourneyScreen extends StatefulWidget {
  const JourneyScreen({super.key});

  @override
  State<JourneyScreen> createState() => _JourneyScreenState();
}

class _JourneyScreenState extends State<JourneyScreen> {
  String expandedStage = 'foundation';

  @override
  Widget build(BuildContext context) {
    final progress = LessonProgressScope.maybeOf(context);

    if (progress?.loading == true) {
      return const SafeArea(
        bottom: false,
        child: Center(
          child: CircularProgressIndicator(
            semanticsLabel: 'Loading training progress',
          ),
        ),
      );
    }

    if (progress?.error != null) {
      return SafeArea(
        bottom: false,
        child: _JourneyProgressLoadError(onRetry: progress!.reload),
      );
    }

    final lessons = const LessonUnlockService(productionLessons)
        .resolve(progress?.snapshots ?? const <LessonProgressSnapshot>[])
        .values
        .toList(growable: false);

    final stages = createJourneyStages(lessons);

    final firstIncompleteStage = stages.firstWhere(
      (stage) =>
          stage.lessons.any((lesson) => lesson.state != LessonState.completed),
      orElse: () => stages.first,
    );

    final completedCount = lessons
        .where((lesson) => lesson.state == LessonState.completed)
        .length;

    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        children: [
          Text(
            'Your Journey',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'Your personalised path to success',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 16),
          Text(
            'This is the recommended order. You can still choose any '
            'lesson from Categories whenever your dog needs something '
            'different.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 22),
          for (var index = 0; index < stages.length; index++) ...[
            _JourneyStageCard(
              stage: stages[index],
              expanded:
                  expandedStage == 'all' || expandedStage == stages[index].id,
              active: stages[index].id == firstIncompleteStage.id,
              onToggle: () {
                setState(() {
                  expandedStage = expandedStage == stages[index].id
                      ? ''
                      : stages[index].id;
                });
              },
            ),
            if (index != stages.length - 1) const SizedBox(height: 12),
          ],
          const SizedBox(height: 18),
          FilledButton(
            onPressed: () {
              setState(() {
                expandedStage = 'all';
              });
            },
            style: FilledButton.styleFrom(
              backgroundColor: GdaColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 15),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              'View Full Journey',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            '$completedCount of ${lessons.length} lessons complete',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          Text(
            'Adaptive journey adjustments will connect when Flutter '
            'adaptive training memory is migrated.',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: GdaColors.muted,
              fontSize: 11,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _JourneyProgressLoadError extends StatelessWidget {
  const _JourneyProgressLoadError({required this.onRetry});

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

class JourneyStage {
  const JourneyStage({
    required this.id,
    required this.number,
    required this.title,
    required this.lessons,
  });

  final String id;
  final int number;
  final String title;
  final List<LessonLibraryItem> lessons;
}

List<JourneyStage> createJourneyStages(List<LessonLibraryItem> lessons) {
  final stages = <JourneyStage>[
    JourneyStage(
      id: 'foundation',
      number: 1,
      title: 'Foundation',
      lessons: lessons
          .where((lesson) => lesson.definition.difficulty == 1)
          .toList(growable: false),
    ),
    JourneyStage(
      id: 'building',
      number: 2,
      title: 'Building Skills',
      lessons: lessons
          .where((lesson) => lesson.definition.difficulty == 2)
          .toList(growable: false),
    ),
    JourneyStage(
      id: 'real-world',
      number: 3,
      title: 'Real World',
      lessons: lessons
          .where((lesson) => lesson.definition.difficulty == 3)
          .toList(growable: false),
    ),
    JourneyStage(
      id: 'lifelong',
      number: 4,
      title: 'Lifelong Skills',
      lessons: lessons
          .where((lesson) => lesson.definition.difficulty >= 4)
          .toList(growable: false),
    ),
  ];

  return stages
      .where((stage) => stage.lessons.isNotEmpty)
      .toList(growable: false);
}

class _JourneyStageCard extends StatelessWidget {
  const _JourneyStageCard({
    required this.stage,
    required this.expanded,
    required this.active,
    required this.onToggle,
  });

  final JourneyStage stage;
  final bool expanded;
  final bool active;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final completed = stage.lessons
        .where((lesson) => lesson.state == LessonState.completed)
        .length;

    return Container(
      decoration: BoxDecoration(
        color: GdaColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: GdaColors.border),
      ),
      child: Column(
        children: [
          Semantics(
            button: true,
            expanded: expanded,
            label:
                'Stage ${stage.number}: ${stage.title}. '
                '$completed of ${stage.lessons.length} completed.',
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: onToggle,
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: active ? GdaColors.forest : GdaColors.subtle,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        '${stage.number}',
                        style: TextStyle(
                          color: active ? Colors.white : GdaColors.text,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Stage ${stage.number}: ${stage.title}',
                            style: const TextStyle(
                              color: GdaColors.text,
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            '$completed / '
                            '${stage.lessons.length} completed',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      expanded
                          ? Icons.expand_less_rounded
                          : Icons.expand_more_rounded,
                      color: GdaColors.muted,
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (expanded) ...[
            const Divider(height: 1, color: GdaColors.border),
            for (var index = 0; index < stage.lessons.length; index++) ...[
              _JourneyLessonRow(lesson: stage.lessons[index]),
              if (index != stage.lessons.length - 1)
                const Divider(height: 1, indent: 58, color: GdaColors.border),
            ],
          ],
        ],
      ),
    );
  }
}

class _JourneyLessonRow extends StatelessWidget {
  const _JourneyLessonRow({required this.lesson});

  final LessonLibraryItem lesson;

  @override
  Widget build(BuildContext context) {
    final stateLabel = _journeyStateLabel(lesson.state);

    return Semantics(
      label:
          '${lesson.definition.title}. $stateLabel. '
          '${lesson.definition.estimatedMinutes} minutes. '
          'Level ${lesson.definition.difficulty}.',
      child: Padding(
        padding: const EdgeInsets.fromLTRB(15, 12, 15, 12),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _markerBackground(lesson.state),
                border: Border.all(color: _markerBorder(lesson.state)),
              ),
              child: Icon(
                _markerIcon(lesson.state),
                size: 15,
                color: _markerForeground(lesson.state),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    lesson.definition.title,
                    style: const TextStyle(
                      color: GdaColors.text,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${lesson.definition.estimatedMinutes} min · '
                    'Level ${lesson.definition.difficulty} · '
                    '$stateLabel',
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

String _journeyStateLabel(LessonState state) {
  switch (state) {
    case LessonState.available:
      return 'Available';
    case LessonState.inProgress:
      return 'Available';
    case LessonState.completed:
      return 'Completed';
    case LessonState.locked:
      return 'Upcoming';
  }
}

IconData _markerIcon(LessonState state) {
  switch (state) {
    case LessonState.completed:
      return Icons.check_rounded;
    case LessonState.available:
    case LessonState.inProgress:
      return Icons.circle;
    case LessonState.locked:
      return Icons.lock_outline_rounded;
  }
}

Color _markerBackground(LessonState state) {
  switch (state) {
    case LessonState.completed:
      return GdaColors.forest;
    case LessonState.available:
    case LessonState.inProgress:
      return GdaColors.selected;
    case LessonState.locked:
      return GdaColors.surface;
  }
}

Color _markerBorder(LessonState state) {
  switch (state) {
    case LessonState.completed:
      return GdaColors.forest;
    case LessonState.available:
    case LessonState.inProgress:
      return GdaColors.forest;
    case LessonState.locked:
      return GdaColors.border;
  }
}

Color _markerForeground(LessonState state) {
  switch (state) {
    case LessonState.completed:
      return Colors.white;
    case LessonState.available:
    case LessonState.inProgress:
      return GdaColors.forest;
    case LessonState.locked:
      return GdaColors.muted;
  }
}
