import type { Dog, Owner } from '../../domain/models';
import { validateDog, validateOwner } from '../../domain/validation';
import type { DogFormData, OwnerFormData } from './types';

export type FormValidation<T> = {
  valid: boolean;
  errors: Partial<Record<keyof T | 'form', string>>;
};

const draftTimestamp = '2026-01-01T00:00:00.000Z';

export function ownerFromForm(form: OwnerFormData, id: string, timestamp: string): Owner {
  return {
    id,
    email: null,
    displayName: form.displayName.trim(),
    trainingExperience: form.trainingExperience ?? 'beginner',
    primaryGoal: form.primaryGoal ?? 'family-companion',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function validateOwnerForm(form: OwnerFormData): FormValidation<OwnerFormData> {
  const errors: FormValidation<OwnerFormData>['errors'] = {};
  if (!form.displayName.trim()) errors.displayName = 'Enter your name.';
  if (!form.trainingExperience) errors.trainingExperience = 'Choose your training experience.';
  if (!form.primaryGoal) errors.primaryGoal = 'Choose your primary goal.';

  if (Object.keys(errors).length === 0) {
    const result = validateOwner(ownerFromForm(form, 'owner-draft', draftTimestamp));
    if (!result.valid) errors.form = result.errors.join(' ');
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function dogFromForm(form: DogFormData, id: string, ownerId: string, timestamp: string): Dog {
  const enteredWeight = Number(form.weight);
  const weightKg = form.weight.trim() === '' ? null : form.weightUnit === 'lb' ? enteredWeight * 0.45359237 : enteredWeight;
  return {
    id,
    ownerId,
    name: form.name.trim(),
    breed: form.breedUnknown ? '' : form.breed.trim(),
    breedUnknown: form.breedUnknown,
    dateOfBirth: form.birthdayEstimated ? null : form.birthday,
    birthdayEstimated: form.birthdayEstimated,
    estimatedAgeYears: form.birthdayEstimated ? Number(form.estimatedAgeYears) : null,
    sex: form.sex ?? 'unknown',
    weightKg,
    weightUnit: form.weightUnit,
    energyLevel: form.energyLevel ?? 'medium',
    photoUri: form.photoUri,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function validateDogForm(form: DogFormData): FormValidation<DogFormData> {
  const errors: FormValidation<DogFormData>['errors'] = {};
  if (!form.name.trim()) errors.name = 'Enter your dog’s name.';
  if (!form.breedUnknown && !form.breed.trim()) errors.breed = 'Enter a breed or choose Unknown.';
  if (form.birthdayEstimated) {
    const age = Number(form.estimatedAgeYears);
    if (!form.estimatedAgeYears.trim() || !Number.isFinite(age) || age <= 0 || age > 30) errors.estimatedAgeYears = 'Enter an age between 0 and 30 years.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birthday) || Number.isNaN(Date.parse(`${form.birthday}T00:00:00.000Z`))) {
    errors.birthday = 'Enter a valid birthday as YYYY-MM-DD.';
  }
  if (!form.sex) errors.sex = 'Choose a sex.';
  const weight = Number(form.weight);
  if (!form.weight.trim() || !Number.isFinite(weight) || weight <= 0) errors.weight = 'Enter a weight greater than zero.';
  if (weight > (form.weightUnit === 'kg' ? 150 : 330)) errors.weight = `Enter a weight up to ${form.weightUnit === 'kg' ? '150 kg' : '330 lb'}.`;
  if (!form.energyLevel) errors.energyLevel = 'Choose an energy level.';

  if (Object.keys(errors).length === 0) {
    const result = validateDog(dogFromForm(form, 'dog-draft', 'owner-draft', draftTimestamp));
    if (!result.valid) errors.form = result.errors.join(' ');
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
