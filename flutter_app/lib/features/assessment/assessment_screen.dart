import 'package:flutter/material.dart';

import '../../core/theme/gda_theme.dart';
import '../identity/app_identity_controller.dart';
import 'assessment_catalogue.dart';
import 'assessment_controller.dart';
import 'assessment_models.dart';
import 'assessment_scoring.dart';

class AssessmentScreen extends StatefulWidget {
  const AssessmentScreen({super.key});

  @override
  State<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen> {
  int step = 0;
  final Map<String, AssessmentOption> answers = <String, AssessmentOption>{};

  static const _sections = <AssessmentSection>[
    AssessmentSection.everyday,
    AssessmentSection.home,
    AssessmentSection.control,
  ];

  @override
  Widget build(BuildContext context) {
    final assessment = AssessmentScope.of(context);
    final identity = AppIdentityScope.of(context);
    final dog = identity.selectedDog;

    if (dog == null || identity.owner == null) {
      return const Scaffold(
        body: Center(child: Text('Choose a dog before starting the assessment.')),
      );
    }

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && step > 0 && !assessment.saving) {
          setState(() => step--);
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Behaviour assessment'),
          leading: step > 0
              ? IconButton(
                  tooltip: 'Back',
                  onPressed: assessment.saving
                      ? null
                      : () => setState(() => step--),
                  icon: const Icon(Icons.arrow_back),
                )
              : null,
        ),
        body: SafeArea(
          child: AbsorbPointer(
            absorbing: assessment.saving,
            child: _body(context, assessment, identity, dog.name),
          ),
        ),
      ),
    );
  }

  Widget _body(
    BuildContext context,
    AssessmentController assessment,
    AppIdentityController identity,
    String dogName,
  ) {
    if (step == 0) {
      return _Intro(
        dogName: dogName,
        onStart: () => setState(() => step = 1),
      );
    }

    if (step >= 1 && step <= 3) {
      final section = _sections[step - 1];
      return _Section(
        step: step,
        section: section,
        answers: answers,
        onAnswer: (questionId, option) {
          setState(() => answers[questionId] = option);
        },
        onContinue: () => setState(() => step++),
      );
    }

    final complete = assessmentQuestions.every(
      (question) => answers.containsKey(question.id),
    );

    if (!complete) {
      return _Incomplete(onReturn: () => setState(() => step = 1));
    }

    final result = calculateAssessmentScores(answers);
    final known = result.calculatedScores.entries
        .where((entry) => !result.unknownSkills.contains(entry.key))
        .toList()
      ..sort((a, b) => a.value.compareTo(b.value));

    return _Results(
      dogName: dogName,
      focusAreas: known.take(3).toList(growable: false),
      unknownSkills: result.unknownSkills,
      saving: assessment.saving,
      error: assessment.error,
      onComplete: () async {
        final saved = await assessment.complete(
          ownerId: identity.owner!.id,
          dog: identity.selectedDog!,
          answers: answers,
        );
        if (!saved && mounted) setState(() {});
      },
    );
  }
}

class _Intro extends StatelessWidget {
  const _Intro({required this.dogName, required this.onStart});

  final String dogName;
  final VoidCallback onStart;

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(24),
    children: [
      const Text(
        'PERSONALISED START',
        style: TextStyle(
          color: GdaColors.forest,
          fontSize: 11,
          fontWeight: FontWeight.w900,
        ),
      ),
      const SizedBox(height: 8),
      Text(
        'Let’s understand $dogName.',
        style: Theme.of(context).textTheme.headlineMedium,
      ),
      const SizedBox(height: 12),
      const Text(
        'This takes approximately two minutes. Honest answers produce a better training plan, and there are no bad scores.',
      ),
      const SizedBox(height: 24),
      const Card(
        child: Padding(
          padding: EdgeInsets.all(18),
          child: Text(
            'Answer based on what usually happens across ten everyday skills. '
            '“Not sure / Not observed” is always available, and your responses '
            'stay on this device.',
          ),
        ),
      ),
      const SizedBox(height: 20),
      FilledButton(
        onPressed: onStart,
        child: const Text('Start Assessment'),
      ),
    ],
  );
}

class _Section extends StatelessWidget {
  const _Section({
    required this.step,
    required this.section,
    required this.answers,
    required this.onAnswer,
    required this.onContinue,
  });

  final int step;
  final AssessmentSection section;
  final Map<String, AssessmentOption> answers;
  final void Function(String questionId, AssessmentOption option) onAnswer;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final questions = questionsForSection(section);
    final complete = questions.every((question) => answers[question.id] != null);
    final details = switch (section) {
      AssessmentSection.everyday => (
        title: 'Everyday skills',
        body: 'Think about what usually happens in familiar, ordinary situations.',
      ),
      AssessmentSection.home => (
        title: 'Life at home',
        body: 'Tell us about routines and behaviour around the home.',
      ),
      AssessmentSection.control => (
        title: 'Confidence and control',
        body: 'Choose the closest answer based on what you have personally observed.',
      ),
    };

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'STEP ${step + 1} OF 5',
          style: const TextStyle(
            color: GdaColors.forest,
            fontSize: 11,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 6),
        Text(details.title, style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 8),
        Text(details.body),
        const SizedBox(height: 18),
        for (final question in questions) ...[
          _QuestionCard(
            question: question,
            value: answers[question.id],
            onChanged: (option) => onAnswer(question.id, option),
          ),
          const SizedBox(height: 14),
        ],
        if (section == AssessmentSection.control &&
            hasSevereReactivityResponse(answers)) ...[
          const _SafetyNotice(),
          const SizedBox(height: 18),
        ],
        FilledButton(
          onPressed: complete ? onContinue : null,
          child: const Text('Continue'),
        ),
      ],
    );
  }
}

class _QuestionCard extends StatelessWidget {
  const _QuestionCard({
    required this.question,
    required this.value,
    required this.onChanged,
  });

  final AssessmentQuestion question;
  final AssessmentOption? value;
  final ValueChanged<AssessmentOption> onChanged;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.fromLTRB(14, 16, 14, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            question.text,
            style: Theme.of(context).textTheme.titleMedium,
          ),
          if (question.explanation != null) ...[
            const SizedBox(height: 6),
            Text(
              question.explanation!,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
          const SizedBox(height: 8),
          RadioGroup<AssessmentOption>(
            groupValue: value,
            onChanged: (selected) {
              if (selected != null) {
                onChanged(selected);
              }
            },
            child: Column(
              children: [
                for (final option in AssessmentOption.values)
                  RadioListTile<AssessmentOption>(
                    key: ValueKey(
                      '${question.id}-${assessmentOptionStorageValue(option)}',
                    ),
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    title: Text(assessmentOptionLabel(option)),
                    value: option,
                  ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _SafetyNotice extends StatelessWidget {
  const _SafetyNotice();

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: const Color(0xFFFFF2D8),
      borderRadius: BorderRadius.circular(12),
    ),
    child: const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Safety first', style: TextStyle(fontWeight: FontWeight.w900)),
        SizedBox(height: 6),
        Text(
          'Intense reactions can carry safety risks. Avoid forced greetings and '
          'create distance from triggers. If there is a risk of injury, seek help '
          'from a qualified, force-free professional trainer or veterinarian.',
        ),
      ],
    ),
  );
}

class _Results extends StatelessWidget {
  const _Results({
    required this.dogName,
    required this.focusAreas,
    required this.unknownSkills,
    required this.saving,
    required this.error,
    required this.onComplete,
  });

  final String dogName;
  final List<MapEntry<String, int>> focusAreas;
  final List<String> unknownSkills;
  final bool saving;
  final Object? error;
  final VoidCallback onComplete;

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20),
    children: [
      const Text(
        'STEP 5 OF 5',
        style: TextStyle(
          color: GdaColors.forest,
          fontSize: 11,
          fontWeight: FontWeight.w900,
        ),
      ),
      const SizedBox(height: 6),
      Text(
        '$dogName’s starting profile',
        style: Theme.of(context).textTheme.headlineMedium,
      ),
      const SizedBox(height: 8),
      const Text(
        'These are the three known areas with the most room to grow. '
        'Scores describe a starting point, not a judgement.',
      ),
      const SizedBox(height: 20),
      if (focusAreas.isEmpty)
        const Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Text(
              'You marked every skill as not yet observed. Good Dog Academy will '
              'begin from a neutral starting point and update as you train.',
            ),
          ),
        )
      else
        for (final entry in focusAreas)
          Card(
            child: ListTile(
              title: Text(behaviourSkillLabel(entry.key)),
              subtitle: LinearProgressIndicator(value: entry.value / 100),
              trailing: Text('${entry.value}'),
            ),
          ),
      if (unknownSkills.isNotEmpty) ...[
        const SizedBox(height: 16),
        Text(
          'Not yet observed',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 6),
        Text(
          unknownSkills.map(behaviourSkillLabel).join(', '),
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
      if (error != null) ...[
        const SizedBox(height: 16),
        const Text(
          'Your assessment could not be saved. Nothing was partially written.',
          style: TextStyle(color: Colors.red),
        ),
      ],
      const SizedBox(height: 24),
      FilledButton(
        onPressed: saving ? null : onComplete,
        child: Text(saving ? 'Saving…' : 'Complete Assessment'),
      ),
    ],
  );
}

class _Incomplete extends StatelessWidget {
  const _Incomplete({required this.onReturn});
  final VoidCallback onReturn;

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Assessment incomplete',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          const Text('Please answer every question before viewing results.'),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: onReturn,
            child: const Text('Return to Questions'),
          ),
        ],
      ),
    ),
  );
}
