import { authorLesson } from '../authorLesson';

export const focusLessons = [
  authorLesson({
    id: 'focus-check-in', title: 'Voluntary Check-Ins', shortDescription: 'Reward your dog for choosing to look towards you without being prompted.', skill: 'focus', difficultyLevel: 1, estimatedMinutes: 5,
    goal: 'Your dog voluntarily checks in with you several times during a calm session.', equipment: ['Small food rewards', 'A quiet familiar area'], prerequisites: [],
    steps: ['1. Stand or sit quietly with your dog nearby and keep rewards out of sight.', '2. Wait without saying the dog’s name or asking for eye contact.', '3. Mark the moment your dog turns their head or eyes towards you.', '4. Deliver the reward close to you, then look away and reset.', '5. Finish after five voluntary check-ins or one minute, whichever comes first.'],
    tips: ['Accept a brief glance rather than demanding a stare.', 'Keep sessions under a minute at first.', 'Practise when your dog is awake but not highly excited.'],
    commonMistakes: ['Repeatedly calling the dog to make them look.', 'Holding food near your face as a lure.', 'Waiting so long that the dog becomes frustrated.'],
    troubleshooting: [{ problem: 'No check-in happens.', solution: 'Move to a quieter space and mark even a small ear or head turn.' }, { problem: 'The dog stares only at your pocket.', solution: 'Place rewards in a container behind you and pause until attention shifts.' }, { problem: 'The dog wanders away.', solution: 'Let them take a break and try again later in a smaller safe area.' }],
    safetyNotes: ['Keep the exercise short and optional; do not restrain your dog or demand prolonged eye contact.'], completionDescription: 'The dog voluntarily checks in at least five times within two minutes in a quiet familiar area.', tags: ['foundation', 'focus', 'home'],
  }),
  authorLesson({
    id: 'focus-hold-attention', title: 'Hold Attention Briefly', shortDescription: 'Build comfortable attention for a few seconds without creating frustration.', skill: 'focus', difficultyLevel: 2, estimatedMinutes: 8,
    goal: 'Your dog can maintain relaxed attention for three seconds before being rewarded.', equipment: ['Small food rewards', 'A quiet training area', 'A timer'], prerequisites: [{ lessonId: 'focus-check-in', minimumSuccessfulCompletions: 1 }],
    steps: ['1. Wait for a voluntary check-in and mark it with calm praise.', '2. Count one second before delivering the reward.', '3. On later repetitions, extend the pause to two and then three seconds.', '4. Reward while your dog’s body remains soft and comfortable.', '5. Release with a clear finish cue and invite a sniff break.'],
    tips: ['Increase duration by only one second at a time.', 'Reward blinking and relaxed posture, not rigid staring.', 'Mix easy one-second repetitions among longer ones.'],
    commonMistakes: ['Increasing duration on every repetition.', 'Holding the reward visibly near your face.', 'Continuing after the dog looks tired or frustrated.'],
    troubleshooting: [{ problem: 'The dog looks away before three seconds.', solution: 'Reward at one second again and build in smaller increments.' }, { problem: 'The dog jumps for the reward.', solution: 'Deliver lower and sooner while all four paws are down.' }, { problem: 'The dog becomes very still or worried.', solution: 'End the eye-contact exercise and reward easier orientation such as a head turn.' }],
    safetyNotes: ['Never force eye contact; some dogs find direct staring uncomfortable, so accept relaxed orientation towards you.'], completionDescription: 'The dog maintains relaxed attention for three seconds in four of five attempts in a quiet area.', tags: ['focus', 'home', 'impulse-control'],
  }),
  authorLesson({
    id: 'focus-around-distractions', title: 'Focus Around Distractions', shortDescription: 'Help your dog reconnect with you around manageable everyday activity.', skill: 'focus', difficultyLevel: 3, estimatedMinutes: 11,
    goal: 'Your dog can notice a mild distraction and then check back in with you.', equipment: ['High-value rewards', 'A secure lead and harness if outdoors', 'One mild planned distraction'], prerequisites: [{ lessonId: 'focus-hold-attention', minimumSuccessfulCompletions: 1 }],
    steps: ['1. Begin far enough from a mild distraction that your dog can eat and respond.', '2. Allow your dog to notice the distraction without asking for attention.', '3. Mark and reward the first voluntary look back towards you.', '4. After success, take one step closer or make the distraction slightly more active—not both.', '5. Complete five check-ins, then move away for a relaxing sniff break.'],
    tips: ['Distance is your easiest difficulty control.', 'Reward spontaneous check-ins generously.', 'Keep challenging sets shorter than easy practice.'],
    commonMistakes: ['Working so close that the dog cannot disengage.', 'Repeating the dog’s name while they are absorbed.', 'Expecting continuous attention in a stimulating place.'],
    troubleshooting: [{ problem: 'The dog cannot take food.', solution: 'Increase distance until their body softens and they can eat normally.' }, { problem: 'Check-ins stop after moving closer.', solution: 'Return to the previous successful distance for the rest of the session.' }, { problem: 'The dog scans constantly.', solution: 'Use a visual barrier or quieter location and reward one brief orientation towards you.' }],
    safetyNotes: ['Use secure equipment outdoors and move away if your dog cannot disengage; focus work should not involve forced exposure.'], completionDescription: 'The dog voluntarily checks in after noticing a mild distraction in four of five opportunities at a safe working distance.', tags: ['focus', 'outdoors', 'confidence'],
  }),
] as const;
