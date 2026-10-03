import 'package:flutter/material.dart';

import '../identity/app_identity_controller.dart';
import '../lessons/data/production_lessons.dart';
import '../lessons/progress/lesson_progress_controller.dart';
import 'learning_passport_service.dart';

class ProgressScreen extends StatelessWidget {
  const ProgressScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final identity = AppIdentityScope.maybeOf(context);
    final progress = LessonProgressScope.maybeOf(context);
    if (identity?.selectedDog == null || identity?.owner == null) {
      return const SafeArea(
        child: Center(
          child: Text('Choose a dog to view their Learning Passport.'),
        ),
      );
    }
    if (progress == null ||
        progress.loading ||
        progress.dogId != identity!.selectedDogId ||
        progress.ownerId != identity.owner!.id) {
      return const SafeArea(
        child: Center(
          child: CircularProgressIndicator(
            semanticsLabel: 'Loading training progress',
          ),
        ),
      );
    }
    if (progress.error != null) return _error(progress);
    LearningPassport passport;
    try {
      passport = const LearningPassportService().query(
        owner: identity.owner!,
        dog: identity.selectedDog!,
        catalogue: productionLessons,
        progress: progress.records,
      );
    } catch (_) {
      return _error(progress);
    }
    return SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            '${passport.dogName}’s Learning Passport',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${passport.completed} of ${passport.total} lessons complete',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 12),
                  LinearProgressIndicator(
                    value: passport.completionFraction,
                    semanticsLabel: 'Lesson completion',
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '${(passport.completionFraction * 100).round()}% complete · ${passport.inProgress} in progress',
                  ),
                ],
              ),
            ),
          ),
          if (progress.records.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Text(
                'No lesson progress has been recorded for this dog yet.',
              ),
            ),
          const SizedBox(height: 16),
          Text('Skills', style: Theme.of(context).textTheme.titleLarge),
          for (final skill in passport.skills) PassportSkillCard(group: skill),
          const SizedBox(height: 20),
          Text('Journey stages', style: Theme.of(context).textTheme.titleLarge),
          for (final stage in passport.stages) PassportSkillCard(group: stage),
          const SizedBox(height: 12),
          const Text(
            'Lesson completion shows recorded learning progress. It does not establish reliability in every environment.',
          ),
        ],
      ),
    );
  }

  Widget _error(LessonProgressController progress) => SafeArea(
    child: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Training progress could not be loaded safely.'),
          const Text('No saved training data was changed.'),
          FilledButton(
            onPressed: progress.reload,
            child: const Text('Try again'),
          ),
        ],
      ),
    ),
  );
}

class PassportSkillCard extends StatelessWidget {
  const PassportSkillCard({super.key, required this.group});
  final PassportGroup group;
  @override
  Widget build(BuildContext context) => Card(
    child: ListTile(
      title: Text(group.title),
      subtitle: Text(
        '${group.completed} of ${group.total} complete · ${group.inProgress} in progress',
      ),
      leading: Icon(
        group.completed == group.total
            ? Icons.check_circle_outline
            : Icons.school_outlined,
      ),
    ),
  );
}
