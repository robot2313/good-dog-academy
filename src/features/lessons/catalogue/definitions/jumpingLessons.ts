import { authorLesson } from '../authorLesson';

export const jumpingLessons = [
  authorLesson({
    id: 'jumping-four-paws-down', title: 'Four Paws Down', shortDescription: 'Reinforce calm standing before jumping becomes the way to get attention.', skill: 'jumping', difficultyLevel: 1, estimatedMinutes: 6,
    goal: 'Your dog learns that keeping four paws on the floor makes attention and rewards happen.', equipment: ['Small food rewards', 'A quiet room', 'A treat pot near the entry'], prerequisites: [],
    steps: ['1. Approach your dog calmly when all four paws are on the floor.', '2. Mark the grounded position before your dog starts to jump.', '3. Deliver the reward low, close to the floor between the front paws.', '4. Step away briefly, then return and reward another grounded greeting.', '5. Add calm stroking for one second before rewarding if your dog remains grounded.'],
    tips: ['Reward before excitement builds.', 'Keep your hands and rewards low.', 'Ask household members to use the same routine.'],
    commonMistakes: ['Waiting for the dog to jump before reacting.', 'Holding food high above the dog’s head.', 'Using kneeing, pushing, shouting, or frightening corrections.'],
    troubleshooting: [{ problem: 'The dog jumps as you approach.', solution: 'Stop farther away, wait for paws down, then toss the reward low.' }, { problem: 'The dog jumps after eating.', solution: 'Deliver several small rewards low before calmly stepping away.' }, { problem: 'The dog becomes more excited with touch.', solution: 'Skip stroking and use quiet food delivery until greetings are steadier.' }],
    safetyNotes: ['Avoid physical or frightening corrections; use barriers when jumping could knock over a child or vulnerable person.'], completionDescription: 'The dog keeps four paws on the floor during four of five calm approaches by a familiar person.', tags: ['foundation', 'jumping', 'home'],
  }),
  authorLesson({
    id: 'jumping-calm-greetings', title: 'Calm Greetings', shortDescription: 'Practise a repeatable greeting routine with one familiar helper.', skill: 'jumping', difficultyLevel: 2, estimatedMinutes: 9,
    goal: 'Your dog greets a familiar person with four paws down for several seconds.', equipment: ['Food rewards', 'A secure lead or baby gate', 'One familiar helper'], prerequisites: [{ lessonId: 'jumping-four-paws-down', minimumSuccessfulCompletions: 1 }],
    steps: ['1. Position your dog behind a gate or on a loose lead with enough space to move away.', '2. Ask the helper to approach only while four paws remain down.', '3. If jumping starts, the helper quietly pauses or takes one step away.', '4. Mark grounded behaviour and have the helper deliver a reward low.', '5. End the greeting after three calm seconds and give the dog a break.'],
    tips: ['Brief greetings are easier than long ones.', 'Let the helper turn slightly sideways.', 'Practise with one calm person before adding variety.'],
    commonMistakes: ['Allowing the helper to keep advancing during jumping.', 'Tightening the lead so the dog bounces against it.', 'Expecting a long greeting immediately.'],
    troubleshooting: [{ problem: 'The dog cannot stay grounded as the helper enters.', solution: 'Start with the helper farther away or behind a second barrier.' }, { problem: 'Food increases excitement.', solution: 'Use slower delivery of lower-value food or a calm sniff scatter after the greeting.' }, { problem: 'The dog barks as well as jumps.', solution: 'Reduce the helper’s movement and reward quiet grounded moments from a greater distance.' }],
    safetyNotes: ['Use barriers and distance to protect guests; never ask a vulnerable person to act as the training helper.'], completionDescription: 'The dog completes four of five three-second greetings with a familiar helper while all four paws remain on the floor.', tags: ['jumping', 'home', 'impulse-control'],
  }),
  authorLesson({
    id: 'jumping-visitors-and-excitement', title: 'Visitors and Excitement', shortDescription: 'Apply calm greeting skills to realistic arrivals without expecting perfection.', skill: 'jumping', difficultyLevel: 3, estimatedMinutes: 12,
    goal: 'Your dog can settle into a managed greeting routine when a planned visitor arrives.', equipment: ['High-value rewards', 'A secure lead or gate', 'A mat or resting area', 'One prepared visitor'], prerequisites: [{ lessonId: 'jumping-calm-greetings', minimumSuccessfulCompletions: 1 }],
    steps: ['1. Exercise and toilet your dog normally before the planned visit, then prepare the gate and rewards.', '2. Have the visitor enter while your dog remains behind the barrier at a workable distance.', '3. Reward grounded check-ins and allow a sniff break away from the doorway.', '4. Offer a brief greeting only when the dog can keep four paws down; pause immediately if jumping returns.', '5. Guide the dog to a mat or quiet activity and end practice before excitement rises again.'],
    tips: ['Tell visitors the plan before they arrive.', 'A greeting is optional; calm separation is also success.', 'Use several short practices instead of one long visit.'],
    commonMistakes: ['Opening the barrier while the dog is highly aroused.', 'Letting every visitor use a different response to jumping.', 'Treating management as failure rather than good safety.'],
    troubleshooting: [{ problem: 'Door sounds trigger immediate jumping.', solution: 'Practise recorded or gentle door sounds separately at low intensity.' }, { problem: 'The dog settles behind the gate but jumps when released.', solution: 'Keep greetings behind the barrier for now and build calmer repetitions.' }, { problem: 'Excitement returns after a few minutes.', solution: 'Provide a quiet break with a safe chew in another room.' }],
    safetyNotes: ['Manage arrivals with barriers and never use kneeing, pushing, shouting, or intimidation; skip direct greetings when anyone could be knocked over.'], completionDescription: 'During three planned arrivals, the dog remains safely managed and completes at least one five-second four-paws-down greeting in two arrivals.', tags: ['jumping', 'home', 'safety'],
  }),
] as const;
