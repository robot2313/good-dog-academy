import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/gda_theme.dart';
import '../data/production_lesson_content.dart';
import '../data/production_lessons.dart';
import '../domain/lesson_models.dart';
import '../logic/lesson_unlock_service.dart';
import '../progress/lesson_progress_controller.dart';

enum _SessionPhase { prepare, training, feedback, saving, complete }

class LessonSessionScreen extends StatefulWidget {
  const LessonSessionScreen({
    super.key,
    required this.lessonId,
    required this.ownerId,
    required this.dogId,
    required this.allowPrerequisiteBypass,
  });

  final String lessonId;
  final String ownerId;
  final String dogId;
  final bool allowPrerequisiteBypass;

  @override
  State<LessonSessionScreen> createState() => _LessonSessionScreenState();
}

class _LessonSessionScreenState extends State<LessonSessionScreen> {
  _SessionPhase phase = _SessionPhase.prepare;
  Timer? timer;
  late int remainingSeconds;
  int currentStep = 0;
  int successfulRepetitions = 0;
  int needsHelpRepetitions = 0;
  int consecutiveChallenges = 0;
  bool running = false;
  bool resetSuggested = false;
  int? selectedRating;
  String? saveError;
  _CheckInSnapshot? undoSnapshot;
  String? startedAt;
  String? sessionId;

  LessonDefinition get lesson =>
      productionLessons.firstWhere((item) => item.id == widget.lessonId);

  LessonContent get content => lessonContentById(widget.lessonId);

  @override
  void initState() {
    super.initState();
    final definition =
        productionLessons.firstWhere((item) => item.id == widget.lessonId);
    remainingSeconds = definition.estimatedMinutes.clamp(1, 120) * 60;
  }

  @override
  void dispose() {
    timer?.cancel();
    super.dispose();
  }

  void startTraining() {
    final started = DateTime.now().toUtc();
    setState(() {
      startedAt ??= started.toIso8601String();
      sessionId ??=
          'training-session-${widget.dogId}-${started.microsecondsSinceEpoch}';
      phase = _SessionPhase.training;
      running = true;
    });
    _startTimer();
  }

  void _startTimer() {
    timer?.cancel();
    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted || !running || phase != _SessionPhase.training) return;
      if (remainingSeconds <= 1) {
        setState(() {
          remainingSeconds = 0;
          running = false;
        });
        timer?.cancel();
      } else {
        setState(() => remainingSeconds--);
      }
    });
  }

  void _togglePause() {
    setState(() => running = !running);
    if (running) {
      _startTimer();
    } else {
      timer?.cancel();
    }
  }

  void _record(bool success) {
    if (resetSuggested) return;
    setState(() {
      undoSnapshot = _CheckInSnapshot(
        successfulRepetitions: successfulRepetitions,
        needsHelpRepetitions: needsHelpRepetitions,
        consecutiveChallenges: consecutiveChallenges,
        running: running,
      );
      if (success) {
        successfulRepetitions++;
        consecutiveChallenges = 0;
      } else {
        needsHelpRepetitions++;
        consecutiveChallenges++;
        if (consecutiveChallenges >= 2) {
          resetSuggested = true;
          running = false;
          timer?.cancel();
        }
      }
    });
  }

  void _undo() {
    final snapshot = undoSnapshot;
    if (snapshot == null) return;
    setState(() {
      successfulRepetitions = snapshot.successfulRepetitions;
      needsHelpRepetitions = snapshot.needsHelpRepetitions;
      consecutiveChallenges = snapshot.consecutiveChallenges;
      running = snapshot.running;
      resetSuggested = false;
      undoSnapshot = null;
    });
    if (running) _startTimer();
  }

  void _acceptReset() {
    setState(() {
      consecutiveChallenges = 0;
      resetSuggested = false;
      running = remainingSeconds > 0;
      undoSnapshot = null;
    });
    if (running) _startTimer();
  }

  void _finish() {
    timer?.cancel();
    setState(() {
      running = false;
      phase = _SessionPhase.feedback;
      selectedRating = _suggestedRating();
    });
  }

  int? _suggestedRating() {
    final total = successfulRepetitions + needsHelpRepetitions;
    if (total == 0) return null;
    if (needsHelpRepetitions >= 2 &&
        successfulRepetitions <= needsHelpRepetitions) {
      return 2;
    }
    if (successfulRepetitions >= 4 &&
        successfulRepetitions >= needsHelpRepetitions * 3) {
      return 5;
    }
    return 3;
  }

  Future<void> _save(LessonProgressController progress) async {
    final rating = selectedRating;
    if (rating == null || phase != _SessionPhase.feedback) return;
    setState(() {
      phase = _SessionPhase.saving;
      saveError = null;
    });
    try {
      await progress.recordLessonAttempt(
        ownerId: widget.ownerId,
        dogId: widget.dogId,
        lessonId: widget.lessonId,
        rating: rating,
        attemptedAt: DateTime.now().toUtc().toIso8601String(),
        startedAt: startedAt,
        sessionId: sessionId,
        notes:
            'Guided check-ins: $successfulRepetitions successful; '
            '$needsHelpRepetitions needed help. '
            'Reached step ${currentStep + 1} of ${content.steps.length}.',
        allowPrerequisiteBypass: widget.allowPrerequisiteBypass,
      );
      if (!mounted) return;
      setState(() => phase = _SessionPhase.complete);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        phase = _SessionPhase.feedback;
        saveError =
            'This training result could not be saved safely. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final progress = LessonProgressScope.of(context);

    if (progress.ownerId != widget.ownerId || progress.dogId != widget.dogId) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Text(
              'The selected dog changed. Return to the lesson before saving this session.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    final item = const LessonUnlockService(productionLessons)
        .resolve(progress.snapshots)[widget.lessonId];
    if (item == null ||
        !lesson.isActive ||
        (item.state == LessonState.locked &&
            !widget.allowPrerequisiteBypass)) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              item?.lockReason ?? 'This lesson is no longer available.',
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(lesson.title),
        actions: [
          if (phase == _SessionPhase.training)
            TextButton(
              onPressed: _togglePause,
              child: Text(running ? 'Pause' : 'Resume'),
            ),
        ],
      ),
      body: SafeArea(child: _body(progress)),
    );
  }

  Widget _body(LessonProgressController progress) {
    switch (phase) {
      case _SessionPhase.prepare:
        return _prepare();
      case _SessionPhase.training:
        return _training();
      case _SessionPhase.feedback:
        return _feedback(progress);
      case _SessionPhase.saving:
        return const Center(
          child: CircularProgressIndicator(semanticsLabel: 'Saving session'),
        );
      case _SessionPhase.complete:
        return _complete();
    }
  }

  Widget _prepare() => ListView(
    padding: const EdgeInsets.all(20),
    children: [
      Text('Before You Begin', style: Theme.of(context).textTheme.headlineMedium),
      const SizedBox(height: 12),
      Text(content.goal),
      const SizedBox(height: 22),
      Text('Have these ready', style: Theme.of(context).textTheme.titleLarge),
      const SizedBox(height: 10),
      for (final item in content.equipment)
        ListTile(
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.check_circle_outline, color: GdaColors.forest),
          title: Text(item),
        ),
      const SizedBox(height: 16),
      FilledButton(
        onPressed: startTraining,
        child: const Text('Start training'),
      ),
    ],
  );

  Widget _training() {
    final step = _cleanStep(content.steps[currentStep]);
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                'SESSION ${running ? 'RUNNING' : 'PAUSED'}',
                style: const TextStyle(
                  color: GdaColors.forest,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            Text(
              _formatTime(remainingSeconds),
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ],
        ),
        const SizedBox(height: 20),
        Text(
          'Step ${currentStep + 1} of ${content.steps.length}',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 10),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Text(step, style: Theme.of(context).textTheme.titleLarge),
          ),
        ),
        const SizedBox(height: 18),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: currentStep > 0
                    ? () => setState(() => currentStep--)
                    : null,
                child: const Text('Previous'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: FilledButton(
                onPressed: currentStep < content.steps.length - 1
                    ? () => setState(() => currentStep++)
                    : null,
                child: const Text('Next Step'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 22),
        Text('How did that attempt go?', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: FilledButton.tonalIcon(
                onPressed: resetSuggested ? null : () => _record(true),
                icon: const Icon(Icons.check),
                label: const Text('Success'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: resetSuggested ? null : () => _record(false),
                icon: const Icon(Icons.tune),
                label: const Text('Needs help'),
              ),
            ),
          ],
        ),
        if (undoSnapshot != null) ...[
          const SizedBox(height: 8),
          TextButton(onPressed: _undo, child: const Text('Undo last check-in')),
        ],
        const SizedBox(height: 10),
        Text(
          '$successfulRepetitions successful · '
          '$needsHelpRepetitions needing help',
          textAlign: TextAlign.center,
        ),
        if (resetSuggested) ...[
          const SizedBox(height: 18),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF2D8),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                const Text(
                  'Two attempts felt difficult in a row. Make the setup easier before continuing.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 10),
                FilledButton(
                  onPressed: _acceptReset,
                  child: const Text('Make it easier and continue'),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 22),
        OutlinedButton(
          onPressed: _finish,
          child: const Text('Finish session'),
        ),
      ],
    );
  }

  Widget _feedback(LessonProgressController progress) => ListView(
    padding: const EdgeInsets.all(20),
    children: [
      Text('How did it go?', style: Theme.of(context).textTheme.headlineMedium),
      const SizedBox(height: 10),
      Text(
        '$successfulRepetitions successful repetitions · '
        '$needsHelpRepetitions attempts needed help',
      ),
      const SizedBox(height: 22),
      const Text('Rate this session from 1 to 5'),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8,
        children: [
          for (var rating = 1; rating <= 5; rating++)
            ChoiceChip(
              label: Text('$rating'),
              selected: selectedRating == rating,
              onSelected: (_) => setState(() => selectedRating = rating),
            ),
        ],
      ),
      if (saveError != null) ...[
        const SizedBox(height: 16),
        Text(saveError!, style: const TextStyle(color: Colors.red)),
      ],
      const SizedBox(height: 24),
      FilledButton(
        onPressed: selectedRating == null ? null : () => _save(progress),
        child: const Text('Save session'),
      ),
      TextButton(
        onPressed: () {
          setState(() {
            phase = _SessionPhase.training;
            running = remainingSeconds > 0 && !resetSuggested;
            selectedRating = null;
          });
          if (running) _startTimer();
        },
        child: const Text('Return to training'),
      ),
    ],
  );

  Widget _complete() => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.check_circle, size: 64, color: GdaColors.forest),
          const SizedBox(height: 16),
          Text('Lesson complete!', style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 8),
          const Text(
            'Your dog’s lesson progress has been saved.',
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Done'),
          ),
        ],
      ),
    ),
  );
}

class _CheckInSnapshot {
  const _CheckInSnapshot({
    required this.successfulRepetitions,
    required this.needsHelpRepetitions,
    required this.consecutiveChallenges,
    required this.running,
  });

  final int successfulRepetitions;
  final int needsHelpRepetitions;
  final int consecutiveChallenges;
  final bool running;
}

String _cleanStep(String step) =>
    step.replaceFirst(RegExp(r'^\s*\d+[.)]\s*'), '').trim();

String _formatTime(int seconds) {
  final safe = seconds < 0 ? 0 : seconds;
  final minutes = safe ~/ 60;
  final remainder = safe % 60;
  return '$minutes:${remainder.toString().padLeft(2, '0')}';
}
