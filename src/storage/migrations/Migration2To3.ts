import { behaviourSkills } from '../../domain/models';
import { createNeutralSkillScores } from '../../domain/behaviour/skillScores';
import { storageKeys } from '../storageKeys';
import type { Migration } from './Migration';

export const migration2To3: Migration = {
  fromVersion: 2,
  toVersion: 3,
  keys: [storageKeys.behaviourProfiles],
  async migrate(storage) {
    const profiles = await storage.getItem<Array<Record<string, unknown>>>(storageKeys.behaviourProfiles);
    if (!profiles) return;

    await storage.setItem(storageKeys.behaviourProfiles, profiles.map(({ confidenceLevel: _obsolete, ...profile }) => ({
      ...profile,
      skillScores: profile.skillScores ?? createNeutralSkillScores(),
      unknownSkills: profile.unknownSkills ?? [...behaviourSkills],
      assessmentId: profile.assessmentId ?? null,
    })));
  },
};
