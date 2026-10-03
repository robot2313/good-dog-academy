import 'dart:async';

import 'package:flutter/material.dart';

import 'core/theme/gda_theme.dart';
import 'features/lessons/progress/lesson_progress_controller.dart';
import 'features/lessons/progress/lesson_progress_repository.dart';
import 'navigation/main_shell.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final progressController = LessonProgressController(
    repository: const LessonProgressRepository(
      storage: SharedPreferencesLessonProgressStorage(),
    ),
  );

  unawaited(progressController.load());

  runApp(
    GoodDogAcademyApp(
      progressController: progressController,
    ),
  );
}

class GoodDogAcademyApp extends StatelessWidget {
  const GoodDogAcademyApp({
    super.key,
    this.progressController,
  });

  final LessonProgressController? progressController;

  @override
  Widget build(BuildContext context) {
    final app = MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Good Dog Academy',
      theme: GdaTheme.light,
      home: const MainShell(),
    );

    final controller = progressController;

    if (controller == null) {
      return app;
    }

    return LessonProgressScope(
      controller: controller,
      child: app,
    );
  }
}
