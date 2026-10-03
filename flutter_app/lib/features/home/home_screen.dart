import 'package:flutter/material.dart';

import '../../core/theme/gda_theme.dart';
import '../identity/app_identity_controller.dart';
import '../identity/dog_selector.dart';
import '../identity/dog_avatar.dart';
import '../lessons/progress/lesson_progress_controller.dart';
import '../lessons/data/production_lessons.dart';
import '../progress/learning_passport_service.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        children: [
          _header(context),
          const SizedBox(height: 24),
          _sectionTitle(context, 'Today’s Plan', 'View journey'),
          const SizedBox(height: 9),
          const _PlanCard(),
          const SizedBox(height: 24),
          _sectionTitle(context, 'Recommended For You', 'See all'),
          const SizedBox(height: 9),
          const _LessonCard(
            icon: Icons.school_rounded,
            title: 'Recommended lessons',
            subtitle: 'Personal recommendations will connect here.',
          ),
          const SizedBox(height: 24),
          _sectionTitle(context, 'Jump Back In', 'See all'),
          const SizedBox(height: 9),
          _progressCard(context),
          const SizedBox(height: 24),
          _sectionTitle(context, 'Browse by Category', 'See all'),
          const SizedBox(height: 12),
          const _CategoryRow(),
          const SizedBox(height: 24),
          const _HelpCard(),
        ],
      ),
    );
  }

  Widget _progressCard(BuildContext context) {
    final identity = AppIdentityScope.maybeOf(context);
    final progress = LessonProgressScope.maybeOf(context);
    if (identity?.selectedDog == null || identity?.owner == null) {
      return const _LessonCard(
        icon: Icons.pets,
        title: 'Choose your dog',
        subtitle: 'Your dog’s lesson progress will appear here.',
      );
    }
    if (progress == null ||
        progress.loading ||
        progress.dogId != identity!.selectedDogId ||
        progress.ownerId != identity.owner!.id) {
      return const LinearProgressIndicator(
        semanticsLabel: 'Loading training progress',
      );
    }
    if (progress.error != null) {
      return const _LessonCard(
        icon: Icons.error_outline,
        title: 'Training progress could not be loaded safely.',
        subtitle: 'Open Journey to try again.',
      );
    }
    try {
      final passport = const LearningPassportService().query(
        owner: identity.owner!,
        dog: identity.selectedDog!,
        catalogue: productionLessons,
        progress: progress.records,
      );
      return _LessonCard(
        icon: Icons.school_outlined,
        title:
            '${passport.dogName}: ${passport.completed} of ${passport.total} lessons complete',
        subtitle: passport.continueLessons.isEmpty
            ? 'Browse Categories to explore lesson paths.'
            : 'In progress: ${passport.continueLessons.first.title}',
      );
    } catch (_) {
      return const Text('Training progress could not be loaded safely.');
    }
  }

  Widget _header(BuildContext context) {
    final identity = AppIdentityScope.maybeOf(context);
    return Row(
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: const BoxDecoration(
            color: GdaColors.selected,
            shape: BoxShape.circle,
          ),
          child: DogAvatar(photoUri: identity?.selectedDog?.photoUri),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                identity?.owner == null
                    ? 'Good Dog Academy'
                    : 'Hello, ${identity!.owner!.displayName}',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 2),
              Text(
                identity?.selectedDog == null
                    ? 'Training that adapts with you'
                    : 'Training with ${identity!.selectedDog!.name}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ),
        ),
        if (identity != null)
          IconButton(
            tooltip: 'Choose active dog',
            icon: const Icon(Icons.swap_horiz),
            onPressed: () => showModalBottomSheet<void>(
              context: context,
              builder: (_) => AppIdentityScope(
                controller: identity,
                child: const SafeArea(
                  child: SingleChildScrollView(child: DogSelector()),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _sectionTitle(BuildContext context, String title, String action) {
    return Row(
      children: [
        Expanded(
          child: Text(title, style: Theme.of(context).textTheme.titleMedium),
        ),
        Text(
          action,
          style: const TextStyle(
            color: GdaColors.forest,
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.calendar_today_rounded, color: GdaColors.primary),
                SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Your next lesson',
                    style: TextStyle(
                      color: GdaColors.text,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            const Text(
              'Your existing Daily Plan logic will be migrated into this card.',
              style: TextStyle(
                color: GdaColors.muted,
                fontSize: 13,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: const LinearProgressIndicator(
                value: 0,
                minHeight: 7,
                backgroundColor: GdaColors.subtle,
                color: GdaColors.primary,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: null,
                child: const Text('Continue Lesson'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LessonCard extends StatelessWidget {
  const _LessonCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: GdaColors.selected,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: GdaColors.forest),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: GdaColors.text,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded),
          ],
        ),
      ),
    );
  }
}

class _CategoryRow extends StatelessWidget {
  const _CategoryRow();

  static const items = [
    ('Basics', Icons.star_outline_rounded),
    ('Walking', Icons.directions_walk_rounded),
    ('Home', Icons.home_outlined),
    ('Calm', Icons.self_improvement_rounded),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 94,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final item = items[index];

          return Container(
            width: 82,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: GdaColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: GdaColors.border),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(item.$2, color: GdaColors.primary),
                const SizedBox(height: 8),
                Text(
                  item.$1,
                  style: const TextStyle(
                    color: GdaColors.text,
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HelpCard extends StatelessWidget {
  const _HelpCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF2D8),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Row(
        children: [
          Icon(Icons.support_agent_rounded, color: Color(0xFF835B0E)),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Need help right now?',
                  style: TextStyle(
                    color: GdaColors.text,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'Get one safe next step for the behaviour you are seeing.',
                  style: TextStyle(color: GdaColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded),
        ],
      ),
    );
  }
}
