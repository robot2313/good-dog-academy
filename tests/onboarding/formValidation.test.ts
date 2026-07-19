import { emptyDogForm, emptyOwnerForm } from '../../src/features/onboarding/types';
import { dogFromForm, validateDogForm, validateOwnerForm } from '../../src/features/onboarding/validation';

const validOwner = { displayName: 'Alex Morgan', trainingExperience: 'beginner', primaryGoal: 'family-companion' } as const;
const validDog = {
  ...emptyDogForm,
  name: 'Milo',
  breed: 'Labrador mix',
  birthday: '2024-03-12',
  sex: 'male',
  weight: '24.5',
  weightUnit: 'kg',
  energyLevel: 'high',
} as const;

describe('owner onboarding validation', () => {
  it('accepts a complete owner form', () => expect(validateOwnerForm(validOwner).valid).toBe(true));
  it('rejects every missing required field', () => {
    expect(validateOwnerForm(emptyOwnerForm).errors).toMatchObject({ displayName: expect.any(String), trainingExperience: expect.any(String), primaryGoal: expect.any(String) });
  });
});

describe('dog onboarding validation', () => {
  it('accepts a complete form with no optional photo', () => expect(validateDogForm({ ...validDog, photoUri: null }).valid).toBe(true));
  it('accepts a selected photo', () => expect(validateDogForm({ ...validDog, photoUri: 'file:///milo.jpg' }).valid).toBe(true));
  it('accepts an unknown breed', () => expect(validateDogForm({ ...validDog, breed: '', breedUnknown: true }).valid).toBe(true));
  it('accepts an estimated birthday', () => expect(validateDogForm({ ...validDog, birthday: '', birthdayEstimated: true, estimatedAgeYears: '2.5' }).valid).toBe(true));
  it('rejects a future exact birthday', () => expect(validateDogForm({ ...validDog, birthday: '2999-01-01' }).valid).toBe(false));
  it('rejects incomplete required data', () => expect(validateDogForm(emptyDogForm).valid).toBe(false));

  it('enforces kilogram weight boundaries', () => {
    expect(validateDogForm({ ...validDog, weight: '0' }).valid).toBe(false);
    expect(validateDogForm({ ...validDog, weight: '0.1' }).valid).toBe(true);
    expect(validateDogForm({ ...validDog, weight: '150' }).valid).toBe(true);
    expect(validateDogForm({ ...validDog, weight: '150.1' }).valid).toBe(false);
  });

  it('enforces pound weight boundaries and converts to kilograms', () => {
    expect(validateDogForm({ ...validDog, weight: '330', weightUnit: 'lb' }).valid).toBe(true);
    expect(validateDogForm({ ...validDog, weight: '330.1', weightUnit: 'lb' }).valid).toBe(false);
    expect(dogFromForm({ ...validDog, weight: '22.0462', weightUnit: 'lb' }, 'dog', 'owner', '2026-07-19T00:00:00.000Z').weightKg).toBeCloseTo(10, 3);
  });
});
