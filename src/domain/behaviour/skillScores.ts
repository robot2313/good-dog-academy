import { behaviourSkills, type BehaviourSkill } from '../models';

export function createNeutralSkillScores(): Record<BehaviourSkill, number> {
  return Object.fromEntries(behaviourSkills.map((skill) => [skill, 50])) as Record<BehaviourSkill, number>;
}
