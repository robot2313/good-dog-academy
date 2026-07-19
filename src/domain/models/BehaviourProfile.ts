export type BehaviourChallenge = 'recall' | 'lead-pulling' | 'jumping';
export type BehaviourLevel = 'low' | 'medium' | 'high';

export type BehaviourProfile = {
  id: string;
  dogId: string;
  energyLevel: BehaviourLevel;
  confidenceLevel: BehaviourLevel;
  foodMotivation: BehaviourLevel;
  challenges: BehaviourChallenge[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};
