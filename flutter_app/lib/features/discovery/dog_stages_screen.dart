import 'package:flutter/material.dart';

import '../../core/theme/gda_theme.dart';
import '../lessons/data/lesson_collections.dart';
import '../lessons/lesson_browser_screen.dart';
import 'discovery_data.dart';

class DogStagesScreen extends StatelessWidget {
  const DogStagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        children: [
          Text(
            'Training by Life Stage',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'Choose your dog’s stage',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 22),
          for (var index = 0; index < dogStages.length; index++) ...[
            _DogStageCard(stage: dogStages[index]),
            if (index != dogStages.length - 1) const SizedBox(height: 12),
          ],
        ],
      ),
    );
  }
}

class _DogStageCard extends StatelessWidget {
  const _DogStageCard({required this.stage});

  final DogStageData stage;

  @override
  Widget build(BuildContext context) {
    final collection = lessonCollectionById(stage.id);

    return Semantics(
      button: true,
      label:
          '${stage.label}. ${stage.age}. ${stage.lessonCount} lessons. ${stage.summary}',
      child: Material(
        color: GdaColors.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: GdaColors.border),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => LessonBrowserScreen.collection(
                  title: collection.label,
                  intro: '${collection.ageLabel}. ${collection.description}',
                  collectionId: collection.id,
                ),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    color: GdaColors.selected,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(stage.icon, size: 32, color: GdaColors.forest),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        stage.label,
                        style: const TextStyle(
                          color: GdaColors.text,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        stage.age,
                        style: const TextStyle(
                          color: GdaColors.forest,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        stage.summary,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.chevron_right_rounded, color: GdaColors.muted),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
