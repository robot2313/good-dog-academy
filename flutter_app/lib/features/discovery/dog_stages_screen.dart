import 'package:flutter/material.dart';

import '../../core/theme/gda_theme.dart';
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
    return Semantics(
      label:
          '${stage.label}. ${stage.age}. ${stage.lessonCount} lessons. ${stage.summary}',
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: GdaColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: GdaColors.border),
        ),
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
              child: Icon(
                stage.icon,
                size: 32,
                color: GdaColors.forest,
              ),
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
          ],
        ),
      ),
    );
  }
}
