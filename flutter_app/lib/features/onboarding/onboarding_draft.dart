import 'dart:math';

import '../identity/app_identity_record.dart';

String createIdentityId(String prefix) {
  final random = Random.secure();
  return '$prefix-${List.generate(16, (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0')).join()}';
}

/// Drafts stay in memory until the complete identity can be validated and saved.
class OnboardingDraft {
  String displayName = '';
  String email = '';
  TrainingExperience? experience;
  PrimaryGoal? goal;
  String name = '';
  String breed = '';
  bool breedUnknown = false;
  String birthday = '';
  bool birthdayEstimated = false;
  String estimatedAge = '';
  DogSex? sex;
  String weight = '';
  WeightUnit weightUnit = WeightUnit.kg;
  DogEnergyLevel? energy;

  Map<String, String> ownerErrors() {
    final errors = <String, String>{};
    if (displayName.trim().isEmpty) errors['displayName'] = 'Enter your name.';
    if (email.trim().isNotEmpty &&
        !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(email.trim())) {
      errors['email'] = 'Enter a valid email or leave it blank.';
    }
    if (experience == null) {
      errors['experience'] = 'Choose your training experience.';
    }
    if (goal == null) errors['goal'] = 'Choose your primary goal.';
    return errors;
  }

  Map<String, String> dogErrors() {
    final errors = <String, String>{};
    if (name.trim().isEmpty) errors['name'] = 'Enter your dog’s name.';
    if (!breedUnknown && breed.trim().isEmpty) {
      errors['breed'] = 'Enter a breed or choose Unknown.';
    }
    if (birthdayEstimated) {
      final age = double.tryParse(estimatedAge);
      if (age == null || !age.isFinite || age <= 0 || age > 30) {
        errors['estimatedAge'] =
            'Enter an age greater than 0 and at most 30 years.';
      }
    } else {
      final date = DateTime.tryParse('${birthday}T00:00:00.000Z');
      if (!RegExp(r'^\d{4}-\d{2}-\d{2}$').hasMatch(birthday) ||
          date == null ||
          date.toIso8601String().substring(0, 10) != birthday ||
          date.isAfter(DateTime.now().toUtc())) {
        errors['birthday'] =
            'Enter a valid birthday as YYYY-MM-DD, not in the future.';
      }
    }
    if (sex == null) errors['sex'] = 'Choose a sex.';
    final enteredWeight = double.tryParse(weight);
    final limit = weightUnit == WeightUnit.kg ? 150 : 330;
    if (enteredWeight == null ||
        !enteredWeight.isFinite ||
        enteredWeight <= 0 ||
        enteredWeight > limit) {
      errors['weight'] =
          'Enter a weight greater than zero and up to $limit ${weightUnit.name}.';
    }
    if (energy == null) errors['energy'] = 'Choose an energy level.';
    return errors;
  }

  AppIdentityState complete({
    AppOwnerRecord? existingOwner,
    required String ownerId,
    required String dogId,
    required String timestamp,
  }) {
    if ((existingOwner == null && ownerErrors().isNotEmpty) ||
        dogErrors().isNotEmpty) {
      throw const AppIdentityDataException(
        'Complete the required profile fields.',
      );
    }
    final owner =
        existingOwner ??
        AppOwnerRecord(
          id: ownerId,
          email: email.trim().isEmpty ? null : email.trim(),
          displayName: displayName.trim(),
          trainingExperience: experience!,
          primaryGoal: goal!,
          createdAt: timestamp,
          updatedAt: timestamp,
        );
    final enteredWeight = double.parse(weight);
    final dog = AppDogRecord(
      id: dogId,
      ownerId: owner.id,
      name: name.trim(),
      breed: breedUnknown ? '' : breed.trim(),
      breedUnknown: breedUnknown,
      dateOfBirth: birthdayEstimated ? null : birthday,
      birthdayEstimated: birthdayEstimated,
      estimatedAgeYears: birthdayEstimated ? double.parse(estimatedAge) : null,
      sex: sex!,
      weightKg: weightUnit == WeightUnit.lb
          ? enteredWeight * 0.45359237
          : enteredWeight,
      weightUnit: weightUnit,
      energyLevel: energy!,
      photoUri: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    );
    final state = AppIdentityState(
      owner: owner,
      dogs: [dog],
      selectedDogId: dog.id,
    );
    state.validate();
    return state;
  }
}
