import 'package:flutter/material.dart';

import '../identity/app_identity_controller.dart';
import '../identity/app_identity_record.dart';
import 'onboarding_draft.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final draft = OnboardingDraft();
  int step = 0;
  Map<String, String> errors = {};
  bool saving = false;
  String? saveError;
  @override
  Widget build(BuildContext context) {
    final identity = AppIdentityScope.of(context);
    final existingOwner = identity.owner;
    final dogStep = step == 2 || existingOwner != null;
    return PopScope(
      canPop: !saving,
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            dogStep
                ? 'Tell us about your dog'
                : step == 1
                ? 'Tell us about you'
                : 'Good Dog Academy',
          ),
          leading: step > 0 && existingOwner == null
              ? IconButton(
                  tooltip: 'Back',
                  onPressed: saving
                      ? null
                      : () => setState(() {
                          step--;
                          errors = {};
                        }),
                  icon: const Icon(Icons.arrow_back),
                )
              : null,
        ),
        body: SafeArea(
          child: AbsorbPointer(
            absorbing: saving,
            child: ListView(
              padding: const EdgeInsets.all(24),
              children: [
                if (step == 0 && existingOwner == null) ...[
                  const Icon(Icons.pets, size: 72),
                  Text(
                    'Build a better life together.',
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Set up your profile and your dog’s profile to begin exploring the Academy.',
                  ),
                  const SizedBox(height: 24),
                  FilledButton(
                    onPressed: () => setState(() => step = 1),
                    child: const Text('Get started'),
                  ),
                ] else if (!dogStep) ...[
                  _text(
                    'displayName',
                    'Owner name',
                    draft.displayName,
                    (v) => draft.displayName = v,
                  ),
                  _text(
                    'email',
                    'Email (optional)',
                    draft.email,
                    (v) => draft.email = v,
                    keyboard: TextInputType.emailAddress,
                  ),
                  _choice(
                    'experience',
                    'Training experience',
                    TrainingExperience.values,
                    draft.experience,
                    (v) => draft.experience = v,
                  ),
                  _choice(
                    'goal',
                    'Primary goal',
                    PrimaryGoal.values,
                    draft.goal,
                    (v) => draft.goal = v,
                  ),
                  FilledButton(
                    onPressed: () {
                      setState(() {
                        errors = draft.ownerErrors();
                        if (errors.isEmpty) step = 2;
                      });
                    },
                    child: const Text('Continue'),
                  ),
                ] else ...[
                  if (existingOwner != null)
                    Text(
                      'Finish setting up a dog for ${existingOwner.displayName}.',
                    ),
                  _text('name', 'Dog name', draft.name, (v) => draft.name = v),
                  SwitchListTile(
                    title: const Text('Breed unknown'),
                    value: draft.breedUnknown,
                    onChanged: (v) => setState(() => draft.breedUnknown = v),
                  ),
                  if (!draft.breedUnknown)
                    _text(
                      'breed',
                      'Breed',
                      draft.breed,
                      (v) => draft.breed = v,
                    ),
                  SwitchListTile(
                    title: const Text('Use estimated age'),
                    value: draft.birthdayEstimated,
                    onChanged: (v) =>
                        setState(() => draft.birthdayEstimated = v),
                  ),
                  if (draft.birthdayEstimated)
                    _text(
                      'estimatedAge',
                      'Estimated age in years',
                      draft.estimatedAge,
                      (v) => draft.estimatedAge = v,
                      keyboard: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                    )
                  else
                    _text(
                      'birthday',
                      'Birthday (YYYY-MM-DD)',
                      draft.birthday,
                      (v) => draft.birthday = v,
                      keyboard: TextInputType.datetime,
                    ),
                  _choice(
                    'sex',
                    'Sex',
                    DogSex.values,
                    draft.sex,
                    (v) => draft.sex = v,
                  ),
                  _text(
                    'weight',
                    'Weight',
                    draft.weight,
                    (v) => draft.weight = v,
                    keyboard: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                  ),
                  _choice(
                    'weightUnit',
                    'Weight unit',
                    WeightUnit.values,
                    draft.weightUnit,
                    (v) => draft.weightUnit = v,
                  ),
                  _choice(
                    'energy',
                    'Energy level',
                    DogEnergyLevel.values,
                    draft.energy,
                    (v) => draft.energy = v,
                  ),
                  const Text('You can continue without a photo.'),
                  if (saveError != null)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Text(saveError!, semanticsLabel: saveError),
                    ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: saving ? null : () => _complete(identity),
                    child: Text(saving ? 'Saving…' : 'Complete setup'),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _text(
    String key,
    String label,
    String initial,
    ValueChanged<String> changed, {
    TextInputType? keyboard,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: TextFormField(
      key: ValueKey(key),
      initialValue: initial,
      onChanged: changed,
      keyboardType: keyboard,
      decoration: InputDecoration(labelText: label, errorText: errors[key]),
    ),
  );
  Widget _choice<T extends Enum>(
    String key,
    String label,
    List<T> values,
    T? value,
    ValueChanged<T> changed,
  ) => Padding(
    padding: const EdgeInsets.only(bottom: 16),
    child: DropdownButtonFormField<T>(
      key: ValueKey(key),
      initialValue: value,
      isExpanded: true,
      decoration: InputDecoration(labelText: label, errorText: errors[key]),
      items: values
          .map((v) => DropdownMenuItem(value: v, child: Text(_label(v.name))))
          .toList(),
      onChanged: (v) {
        if (v != null) setState(() => changed(v));
      },
    ),
  );
  String _label(String value) => value.replaceAllMapped(
    RegExp(r'[A-Z]'),
    (m) => ' ${m[0]!.toLowerCase()}',
  );
  Future<void> _complete(AppIdentityController identity) async {
    setState(() {
      errors = draft.dogErrors();
      saveError = null;
    });
    if (errors.isNotEmpty) return;
    setState(() => saving = true);
    try {
      final state = draft.complete(
        existingOwner: identity.owner,
        ownerId: createIdentityId('owner'),
        dogId: createIdentityId('dog'),
        timestamp: DateTime.now().toUtc().toIso8601String(),
      );
      final saved = await identity.replace(state);
      if (!saved && mounted) {
        setState(
          () =>
              saveError = 'Your profile could not be saved. Please try again.',
        );
      }
    } catch (_) {
      if (mounted) {
        setState(
          () => saveError = 'Your profile could not be saved. Please check the fields and try again.',
        );
      }
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }
}
