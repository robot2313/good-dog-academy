import 'dart:async';

import 'package:flutter/material.dart';

import 'core/theme/gda_theme.dart';
import 'features/lessons/progress/lesson_progress_controller.dart';
import 'features/lessons/progress/lesson_progress_repository.dart';
import 'navigation/main_shell.dart';
import 'features/identity/app_identity_controller.dart';
import 'features/identity/app_identity_repository.dart';
import 'features/identity/identity_gate.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final progressController = LessonProgressController(
    repository: const LessonProgressRepository(
      storage: SharedPreferencesLessonProgressStorage(),
    ),
  );

  final identityController = AppIdentityController(
    repository: const AppIdentityRepository(
      storage: SharedPreferencesAppIdentityStorage(),
    ),
  );
  unawaited(identityController.load());

  runApp(
    GoodDogAcademyApp(
      progressController: progressController,
      identityController: identityController,
    ),
  );
}

class GoodDogAcademyApp extends StatefulWidget {
  const GoodDogAcademyApp({
    super.key,
    this.progressController,
    this.identityController,
  });

  final LessonProgressController? progressController;
  final AppIdentityController? identityController;

  @override
  State<GoodDogAcademyApp> createState() => _GoodDogAcademyAppState();
}

class _GoodDogAcademyAppState extends State<GoodDogAcademyApp> {
  ActiveDogBinding? _binding;
  @override
  void initState() {
    super.initState();
    if (widget.identityController != null) {
      _binding = ActiveDogBinding(
        widget.identityController!,
        widget.progressController!,
      );
    }
  }

  @override
  void dispose() {
    _binding?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final identityController = widget.identityController;
    final progressController = widget.progressController;
    final app = MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Good Dog Academy',
      theme: GdaTheme.light,
      home: identityController == null
          ? const MainShell()
          : const IdentityGate(),
    );

    final controller = progressController;

    if (controller == null) {
      return app;
    }

    final scopedApp = identityController == null
        ? app
        : AppIdentityScope(controller: identityController, child: app);
    return LessonProgressScope(controller: controller, child: scopedApp);
  }
}
