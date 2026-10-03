import 'package:flutter/material.dart';

import '../../core/theme/gda_theme.dart';
import '../camera_coach/camera_coach_capability.dart';
import '../camera_coach/camera_coach_screen.dart';
import '../identity/app_identity_controller.dart';
import 'data/production_lesson_content.dart';
import 'data/production_lessons.dart';
import 'domain/lesson_models.dart';
import 'logic/lesson_unlock_service.dart';
import 'progress/lesson_progress_controller.dart';
import 'session/lesson_session_screen.dart';

class LessonDetailScreen extends StatelessWidget {
  const LessonDetailScreen({
    super.key,
    required this.lessonId,
    this.allowSelfDirectedStart = false,
    this.dailyPlanId,
  });

  final String lessonId;
  final bool allowSelfDirectedStart;
  final String? dailyPlanId;

  @override
  Widget build(BuildContext context) {
    final progress = LessonProgressScope.maybeOf(context);
    final identity = AppIdentityScope.maybeOf(context);
    final cameraCoach = CameraCoachCapabilityScope.maybeOf(context);

    if (progress?.loading == true) {
      return const Scaffold(
        body: SafeArea(child: Center(child: CircularProgressIndicator())),
      );
    }

    if (progress?.error != null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: FilledButton(
            onPressed: progress!.reload,
            child: const Text('Try loading progress again'),
          ),
        ),
      );
    }

    final resolved = const LessonUnlockService(productionLessons)
        .resolve(progress?.snapshots ?? const <LessonProgressSnapshot>[]);
    final item = resolved[lessonId];

    if (item == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('This lesson could not be displayed.')),
      );
    }

    final lesson = item.definition;
    final content = lessonContentById(lesson.id);
    final selfDirected =
        item.state == LessonState.locked && allowSelfDirectedStart;
    final canStart =
        lesson.isActive &&
        identity?.owner != null &&
        identity?.selectedDog != null &&
        (item.state != LessonState.locked || selfDirected);

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  Stack(
                    children: [
                      AspectRatio(
                        aspectRatio: 16 / 10,
                        child: Image.asset(
                          lessonImageAssetPath(lesson.id),
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => Container(
                            color: GdaColors.subtle,
                            alignment: Alignment.center,
                            child: const Icon(
                              Icons.pets,
                              size: 54,
                              color: GdaColors.forest,
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        left: 12,
                        top: 12,
                        child: IconButton.filledTonal(
                          tooltip: 'Back',
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.arrow_back),
                        ),
                      ),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'GET READY · ${_skillLabel(lesson.skill)}',
                          style: const TextStyle(
                            color: GdaColors.forest,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          lesson.title,
                          style: Theme.of(context).textTheme.headlineMedium,
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _chip(_difficultyLabel(lesson.difficulty)),
                            _chip('${lesson.estimatedMinutes} min'),
                            if (selfDirected) _chip('Self-directed'),
                            if (item.state == LessonState.completed)
                              _chip('Completed'),
                          ],
                        ),
                        const SizedBox(height: 18),
                        Text(
                          content.goal,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        if (item.state == LessonState.locked) ...[
                          const SizedBox(height: 16),
                          _Notice(
                            title: selfDirected
                                ? 'Later in the recommended Journey'
                                : 'Why this lesson is locked',
                            body: selfDirected
                                ? '${item.lockReason ?? 'Complete earlier lessons first.'} '
                                      'That order is recommended, but you can '
                                      'choose this lesson now from Categories or Dogs.'
                                : item.lockReason ??
                                      'Complete earlier lessons first.',
                          ),
                        ],
                        const SizedBox(height: 24),
                        _sectionTitle(context, 'You will learn'),
                        const SizedBox(height: 10),
                        for (final step in content.steps.take(4))
                          _Bullet(text: _cleanStep(step)),
                        const SizedBox(height: 24),
                        _sectionTitle(context, 'Before we start'),
                        const SizedBox(height: 10),
                        for (final equipment in content.equipment)
                          _Bullet(text: equipment),
                        const SizedBox(height: 24),
                        _sectionTitle(context, 'Step by step'),
                        const SizedBox(height: 10),
                        for (var i = 0; i < content.steps.length; i++)
                          _NumberedStep(
                            number: i + 1,
                            text: _cleanStep(content.steps[i]),
                          ),
                        if (content.tips.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          _sectionTitle(context, 'Helpful tips'),
                          const SizedBox(height: 10),
                          for (final tip in content.tips) _Bullet(text: tip),
                        ],
                        if (content.commonMistakes.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          _sectionTitle(context, 'Things that can go wrong'),
                          const SizedBox(height: 10),
                          for (final mistake in content.commonMistakes)
                            _Bullet(
                              text: mistake,
                              icon: Icons.warning_amber_rounded,
                            ),
                        ],
                        if (content.troubleshooting.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          _sectionTitle(context, 'If you get stuck'),
                          const SizedBox(height: 10),
                          for (final help in content.troubleshooting)
                            Card(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      help.problem,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(help.solution),
                                  ],
                                ),
                              ),
                            ),
                        ],
                        if (content.safetyNotes.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFFF2D8),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Safety first',
                                  style: TextStyle(fontWeight: FontWeight.w900),
                                ),
                                const SizedBox(height: 8),
                                for (final note in content.safetyNotes)
                                  Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: Text('• $note'),
                                  ),
                              ],
                            ),
                          ),
                        ],
                        const SizedBox(height: 24),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Ready to finish when',
                                  style: TextStyle(fontWeight: FontWeight.w900),
                                ),
                                const SizedBox(height: 8),
                                Text(content.completionDescription),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (canStart)
              SafeArea(
                top: false,
                child: Container(
                  padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
                  decoration: const BoxDecoration(
                    color: GdaColors.surface,
                    border: Border(
                      top: BorderSide(color: GdaColors.border),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      FilledButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => LessonSessionScreen(
                                lessonId: lesson.id,
                                ownerId: identity!.owner!.id,
                                dogId: identity.selectedDog!.id,
                                dailyPlanId: dailyPlanId,
                                allowPrerequisiteBypass: selfDirected,
                              ),
                            ),
                          );
                        },
                        child: Text(
                          item.state == LessonState.completed
                              ? 'Practise Again'
                              : 'Start Lesson',
                        ),
                      ),
                      if (cameraCoach != null) ...[
                        const SizedBox(height: 8),
                        OutlinedButton.icon(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => CameraCoachScreen(
                                  lessonId: lesson.id,
                                  ownerId: identity!.owner!.id,
                                  dogId: identity.selectedDog!.id,
                                  dogName: identity.selectedDog!.name,
                                  dailyPlanId: dailyPlanId,
                                  allowPrerequisiteBypass: selfDirected,
                                  visionEngineFactory:
                                      cameraCoach.visionEngineFactory,
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.videocam_outlined),
                          label: const Text('Train with Camera Coach'),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  static Widget _chip(String label) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(
      color: GdaColors.selected,
      borderRadius: BorderRadius.circular(999),
    ),
    child: Text(
      label,
      style: const TextStyle(
        color: GdaColors.forest,
        fontSize: 11,
        fontWeight: FontWeight.w800,
      ),
    ),
  );

  static Widget _sectionTitle(BuildContext context, String title) =>
      Text(title, style: Theme.of(context).textTheme.titleLarge);
}

class _Notice extends StatelessWidget {
  const _Notice({required this.title, required this.body});
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: GdaColors.selected,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: GdaColors.border),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.w900)),
        const SizedBox(height: 6),
        Text(body),
      ],
    ),
  );
}

class _Bullet extends StatelessWidget {
  const _Bullet({required this.text, this.icon = Icons.check_rounded});
  final String text;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: GdaColors.forest),
        const SizedBox(width: 9),
        Expanded(child: Text(text)),
      ],
    ),
  );
}

class _NumberedStep extends StatelessWidget {
  const _NumberedStep({required this.number, required this.text});
  final int number;
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 30,
          height: 30,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: GdaColors.selected,
            shape: BoxShape.circle,
          ),
          child: Text(
            '$number',
            style: const TextStyle(
              color: GdaColors.forest,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: Text(text)),
      ],
    ),
  );
}

String _cleanStep(String step) =>
    step.replaceFirst(RegExp(r'^\s*\d+[.)]\s*'), '').trim();

String _difficultyLabel(int difficulty) {
  if (difficulty <= 2) return 'Beginner';
  if (difficulty == 3) return 'Intermediate';
  return 'Advanced';
}

String _skillLabel(String skill) => skill
    .split('-')
    .map(
      (part) => part.isEmpty
          ? part
          : '${part[0].toUpperCase()}${part.substring(1)}',
    )
    .join(' ');
