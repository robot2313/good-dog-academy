import 'dart:async';

import 'package:flutter/material.dart';

import 'core/theme/gda_theme.dart';
import 'features/camera_coach/services/vision/model_readiness.dart';
import 'features/camera_coach/services/vision/production_vision_capability.dart';
import 'features/camera_coach/services/vision/production_vision_models.dart';
import 'features/lessons/progress/lesson_progress_controller.dart';
import 'features/assessment/assessment_controller.dart';
import 'features/assessment/assessment_repository.dart';
import 'features/daily_plan/daily_plan_controller.dart';
import 'features/daily_plan/daily_plan_repository.dart';
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
  final assessmentController = AssessmentController(
    repository: const AssessmentRepository(
      storage: SharedPreferencesAssessmentStorage(),
    ),
  );
  final dailyPlanController = DailyPlanController(
    repository: const DailyPlanRepository(
      storage: SharedPreferencesDailyPlanStorage(),
    ),
  );
  unawaited(identityController.load());

  runApp(
    GoodDogAcademyApp(
      progressController: progressController,
      identityController: identityController,
      assessmentController: assessmentController,
      dailyPlanController: dailyPlanController,
    ),
  );
}

class GoodDogAcademyApp extends StatefulWidget {
  const GoodDogAcademyApp({
    super.key,
    this.progressController,
    this.identityController,
    this.assessmentController,
    this.dailyPlanController,
    this.cameraCoachVisionBundle = productionDogVisionBundle,
  });

  final LessonProgressController? progressController;
  final AppIdentityController? identityController;
  final AssessmentController? assessmentController;
  final DailyPlanController? dailyPlanController;
  final ReviewedDogVisionBundle? cameraCoachVisionBundle;

  @override
  State<GoodDogAcademyApp> createState() => _GoodDogAcademyAppState();
}

class _GoodDogAcademyAppState extends State<GoodDogAcademyApp> {
  ActiveDogBinding? _binding;
  ActiveDogAssessmentBinding? _assessmentBinding;
  DailyPlanBinding? _dailyPlanBinding;

  @override
  void initState() {
    super.initState();
    if (widget.identityController != null && widget.progressController != null) {
      _binding = ActiveDogBinding(
        widget.identityController!,
        widget.progressController!,
      );
    }
    if (widget.identityController != null && widget.assessmentController != null) {
      _assessmentBinding = ActiveDogAssessmentBinding(
        widget.identityController!,
        widget.assessmentController!,
      );
    }
    if (widget.identityController != null &&
        widget.assessmentController != null &&
        widget.progressController != null &&
        widget.dailyPlanController != null) {
      _dailyPlanBinding = DailyPlanBinding(
        identity: widget.identityController!,
        assessment: widget.assessmentController!,
        progress: widget.progressController!,
        dailyPlan: widget.dailyPlanController!,
      );
    }
  }

  @override
  void dispose() {
    _dailyPlanBinding?.dispose();
    _assessmentBinding?.dispose();
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

    Widget scopedApp = identityController == null
        ? app
        : AppIdentityScope(controller: identityController, child: app);

    final assessmentController = widget.assessmentController;
    if (assessmentController != null) {
      scopedApp = AssessmentScope(
        controller: assessmentController,
        child: scopedApp,
      );
    }

    final dailyPlanController = widget.dailyPlanController;
    if (dailyPlanController != null) {
      scopedApp = DailyPlanScope(
        controller: dailyPlanController,
        child: scopedApp,
      );
    }

    final appWithProgress = LessonProgressScope(
      controller: controller,
      child: scopedApp,
    );

    return withReviewedCameraCoachCapability(
      bundle: widget.cameraCoachVisionBundle,
      child: appWithProgress,
    );
  }
}
