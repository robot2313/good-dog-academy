import { barkingLessons } from './barkingLessons';
import { chewingLessons } from './chewingLessons';
import { confidenceLessons } from './confidenceLessons';
import { focusLessons } from './focusLessons';
import { houseTrainingLessons } from './houseTrainingLessons';
import { impulseControlLessons } from './impulseControlLessons';
import { jumpingLessons } from './jumpingLessons';
import { looseLeadLessons } from './looseLeadLessons';
import { reactivityLessons } from './reactivityLessons';
import { recallLessons } from './recallLessons';

export { barkingLessons, chewingLessons, confidenceLessons, focusLessons, houseTrainingLessons, impulseControlLessons, jumpingLessons, looseLeadLessons, reactivityLessons, recallLessons };

export const productionLessonDefinitions = Object.freeze([
  ...recallLessons,
  ...looseLeadLessons,
  ...focusLessons,
  ...jumpingLessons,
  ...barkingLessons,
  ...chewingLessons,
  ...reactivityLessons,
  ...houseTrainingLessons,
  ...confidenceLessons,
  ...impulseControlLessons,
]);
