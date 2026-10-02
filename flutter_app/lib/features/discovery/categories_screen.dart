import 'package:flutter/material.dart';

import '../../core/theme/gda_theme.dart';
import 'discovery_data.dart';

class CategoriesScreen extends StatelessWidget {
  const CategoriesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        children: [
          Text(
            'Categories',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 4),
          Text(
            'Explore training topics',
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 22),
          for (var index = 0;
              index < trainingCategories.length;
              index++) ...[
            _CategoryCard(category: trainingCategories[index]),
            if (index != trainingCategories.length - 1)
              const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({required this.category});

  final TrainingCategoryData category;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label:
          '${category.label}. ${category.lessonCount} lessons. ${category.description}',
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: GdaColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: GdaColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: category.backgroundColor,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                category.icon,
                size: 23,
                color: category.iconColor,
              ),
            ),
            const SizedBox(width: 13),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    category.label,
                    style: const TextStyle(
                      color: GdaColors.text,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    category.description,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Text(
              '${category.lessonCount} lessons',
              style: const TextStyle(
                color: GdaColors.muted,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
