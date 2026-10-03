import 'dart:async';

import 'package:flutter/material.dart';

import '../lessons/progress/lesson_progress_controller.dart';
import '../assessment/assessment_controller.dart';
import '../assessment/assessment_screen.dart';
import '../../navigation/main_shell.dart';
import 'app_identity_controller.dart';
import 'dog_selector.dart';
import '../onboarding/onboarding_screen.dart';

class ActiveDogBinding {
  ActiveDogBinding(this.identity, this.progress) {
    progress.clear();
    identity.addListener(_bind);
    _bind();
  }
  final AppIdentityController identity;
  final LessonProgressController progress;
  String? _owner;
  String? _dog;
  void _bind() {
    final owner = identity.loaded && !identity.loading
        ? identity.owner?.id
        : null;
    final dog = identity.loaded && !identity.loading
        ? identity.selectedDogId
        : null;
    if (_owner == owner && _dog == dog) return;
    _owner = owner;
    _dog = dog;
    if (owner == null || dog == null) {
      progress.clear();
    } else {
      unawaited(progress.loadForDog(ownerId: owner, dogId: dog));
    }
  }

  void dispose() => identity.removeListener(_bind);
}

class ActiveDogAssessmentBinding {
  ActiveDogAssessmentBinding(this.identity, this.assessment) {
    assessment.clear();
    identity.addListener(_bind);
    _bind();
  }

  final AppIdentityController identity;
  final AssessmentController assessment;
  String? _owner;
  String? _dog;

  void _bind() {
    final owner = identity.loaded && !identity.loading
        ? identity.owner?.id
        : null;
    final dog = identity.loaded && !identity.loading
        ? identity.selectedDog
        : null;

    if (_owner == owner && _dog == dog?.id) return;
    _owner = owner;
    _dog = dog?.id;

    if (owner == null || dog == null) {
      assessment.clear();
    } else {
      unawaited(assessment.loadForDog(ownerId: owner, dog: dog));
    }
  }

  void dispose() => identity.removeListener(_bind);
}

class IdentityGate extends StatelessWidget {
  const IdentityGate({super.key});
  @override
  Widget build(BuildContext context) {
    final identity = AppIdentityScope.of(context);
    if (identity.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!identity.loaded) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('Your saved dog profile could not be loaded safely.'),
              const Text('No saved data was changed.'),
              FilledButton(
                onPressed: identity.reload,
                child: const Text('Try again'),
              ),
            ],
          ),
        ),
      );
    }
    if (identity.owner == null || identity.dogs.isEmpty) {
      return const OnboardingScreen();
    }
    if (identity.selectedDog == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Choose your active dog')),
        body: const SingleChildScrollView(child: DogSelector()),
      );
    }

    final assessment = AssessmentScope.maybeOf(context);
    if (assessment != null) {
      if (assessment.loading || !assessment.loaded) {
        if (assessment.error != null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Behaviour assessment')),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Your saved behaviour assessment could not be loaded safely.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'No saved data was changed.',
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    FilledButton(
                      onPressed: () => assessment.loadForDog(
                        ownerId: identity.owner!.id,
                        dog: identity.selectedDog!,
                      ),
                      child: const Text('Try again'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }
        return const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        );
      }

      if (!assessment.completed) {
        return const AssessmentScreen();
      }
    }

    return const MainShell();
  }
}
