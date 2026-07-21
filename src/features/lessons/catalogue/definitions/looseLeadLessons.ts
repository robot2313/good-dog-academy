import { authorLesson } from '../authorLesson';

export const looseLeadLessons = [
  authorLesson({
    id: 'loose-lead-reward-zone', title: 'Find the Reward Zone', shortDescription: 'Show your dog that staying near you on a loose lead pays well.', skill: 'loose-lead-walking', difficultyLevel: 1, estimatedMinutes: 6,
    goal: 'Your dog takes several relaxed steps beside you while the lead stays loose.', equipment: ['A secure well-fitted harness or flat collar', 'A standard lead', 'Small food rewards'], prerequisites: [],
    steps: ['1. Fit the equipment comfortably and begin in a quiet room or yard.', '2. Choose the side where you want rewards to appear and deliver three treats beside that leg.', '3. Take one step; mark and reward if the lead remains loose.', '4. Build to three or four steps, rewarding in the same zone.', '5. Pause for sniffing or a short break before another brief set.'],
    tips: ['Keep your reward hand close to your leg.', 'Walk at a comfortable pace for your dog.', 'Use sniff breaks as an additional reward.'],
    commonMistakes: ['Holding the lead continuously tight.', 'Rewarding out in front where the dog learns to forge.', 'Taking too many steps before rewarding.'],
    troubleshooting: [{ problem: 'The dog rushes ahead.', solution: 'Start beside a wall, reward after one step, and build more slowly.' }, { problem: 'The dog bites the lead.', solution: 'Pause movement, offer a food scatter, and resume when the lead is still.' }, { problem: 'The dog lags behind.', solution: 'Use a lighter pace and reward any voluntary movement beside you.' }],
    safetyNotes: ['Use secure, correctly fitted equipment and reward-based handling; avoid painful equipment and sharp lead corrections.'], completionDescription: 'The dog walks five consecutive steps in the reward zone with a loose lead in four of five short attempts indoors or in a quiet yard.', tags: ['foundation', 'walking', 'home'],
  }),
  authorLesson({
    id: 'loose-lead-direction-changes', title: 'Calm Direction Changes', shortDescription: 'Teach your dog to notice and follow smooth changes of direction.', skill: 'loose-lead-walking', difficultyLevel: 2, estimatedMinutes: 9,
    goal: 'Your dog follows gentle turns while keeping slack in the lead.', equipment: ['A secure well-fitted harness or flat collar', 'A standard lead', 'Food rewards'], prerequisites: [{ lessonId: 'loose-lead-reward-zone', minimumSuccessfulCompletions: 1 }],
    steps: ['1. Begin walking in a quiet open area and reward two loose-lead steps.', '2. Say a consistent phrase such as “this way” before slowing down.', '3. Turn in a broad curve rather than pivoting sharply.', '4. Mark when your dog turns with you and reward beside your leg.', '5. Practise left, right, and gentle U-turns with sniff breaks between sets.'],
    tips: ['Signal before every direction change.', 'Keep turns broad enough for your dog to balance.', 'Reward check-ins as well as position.'],
    commonMistakes: ['Turning without warning and tightening the lead.', 'Drilling rapid turns until the dog is dizzy or frustrated.', 'Expecting perfect heel position.'],
    troubleshooting: [{ problem: 'The dog reaches the end of the lead.', solution: 'Make the cue earlier and begin the turn before the lead tightens.' }, { problem: 'The dog stops during turns.', solution: 'Use a larger curve and reward the first step that follows you.' }, { problem: 'The dog loses interest.', solution: 'Add a sniff break after two successful turns and shorten the session.' }],
    safetyNotes: ['Check that the walking surface is safe and never use a turn to jerk or pull the dog off balance.'], completionDescription: 'The dog follows four of five signalled direction changes in a quiet area without the lead becoming tight.', tags: ['walking', 'outdoors', 'focus'],
  }),
  authorLesson({
    id: 'loose-lead-real-world-distractions', title: 'Loose Lead in the Real World', shortDescription: 'Practise relaxed walking near manageable everyday distractions.', skill: 'loose-lead-walking', difficultyLevel: 3, estimatedMinutes: 13,
    goal: 'Your dog maintains a mostly loose lead on a short route with planned distractions.', equipment: ['A secure well-fitted harness', 'A standard lead', 'High-value rewards', 'A quiet planned route'], prerequisites: [{ lessonId: 'loose-lead-direction-changes', minimumSuccessfulCompletions: 1 }],
    steps: ['1. Choose a short route at a quiet time and begin before your dog becomes highly excited.', '2. Reward several easy steps before approaching a mild distraction.', '3. Create more space or change direction as soon as the lead begins to tighten.', '4. Reward check-ins and loose-lead movement past the distraction.', '5. Finish with a sniff in a safe area and note which distance worked.'],
    tips: ['Plan escape routes before starting.', 'Pay more often in harder sections.', 'Count overall loose-lead stretches rather than expecting perfection.'],
    commonMistakes: ['Starting on the busiest possible route.', 'Continuing forward while the dog pulls hard.', 'Using painful equipment or sharp corrections.'],
    troubleshooting: [{ problem: 'The dog pulls from the doorway.', solution: 'Practise the first ten metres at a quieter time and scatter food before leaving.' }, { problem: 'A surprise distraction appears.', solution: 'Turn away calmly, add distance, and reward once your dog can respond.' }, { problem: 'Walking deteriorates late in the route.', solution: 'Shorten the route and finish before fatigue or over-arousal builds.' }],
    safetyNotes: ['Use secure equipment, avoid traffic hazards, and choose distance rather than force when a distraction is too difficult.'], completionDescription: 'Across a five-minute planned walk, the dog completes at least four separate ten-step stretches on a loose lead around mild distractions.', tags: ['walking', 'outdoors', 'safety'],
  }),
] as const;
