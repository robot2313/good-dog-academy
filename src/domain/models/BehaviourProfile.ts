export type BehaviourChallenge = 'recall' | 'lead-pulling' | 'jumping';
export type BehaviourLevel = 'low' | 'medium' | 'high';
import type { BehaviourSkill } from './BehaviourAssessment';

export type BehaviourProfile = {
  id: string;
  dogId: string;
  energyLevel: BehaviourLevel;
  foodMotivation: BehaviourLevel;
  challenges: BehaviourChallenge[];
  skillScores: Record<BehaviourSkill, number>;
  unknownSkills: BehaviourSkill[];
  assessmentId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
};
