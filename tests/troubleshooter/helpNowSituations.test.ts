import { helpNowSituations } from '../../src/features/troubleshooter/helpNowSituations';
import { concernForId } from '../../src/features/troubleshooter/troubleshooterCatalogue';

describe('Help Me Now situations', () => {
  it('maps every quick situation to a valid Troubleshooter scenario', () => {
    for (const situation of helpNowSituations) {
      const concern = concernForId(situation.topicId);
      expect(concern.scenarios.some((scenario) => scenario.id === situation.scenarioId)).toBe(true);
    }
  });

  it('keeps situation ids and labels unique', () => {
    expect(new Set(helpNowSituations.map((situation) => situation.id)).size).toBe(helpNowSituations.length);
    expect(new Set(helpNowSituations.map((situation) => situation.title)).size).toBe(helpNowSituations.length);
  });
});
