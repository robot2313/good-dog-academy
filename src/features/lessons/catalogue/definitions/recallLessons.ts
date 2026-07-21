import { authorLesson } from '../authorLesson';

export const recallLessons = [
  authorLesson({
    id: 'recall-name-response', title: 'Name Response', shortDescription: 'Build a quick, happy turn towards you when your dog hears their name.', skill: 'recall', difficultyLevel: 1, estimatedMinutes: 6,
    goal: 'Your dog turns towards you promptly after hearing their name once.', equipment: ['Small high-value food rewards', 'A quiet familiar room'], prerequisites: [],
    steps: ['1. Stand close to your dog in a quiet room with rewards ready.', '2. Wait until your dog is looking elsewhere without being deeply distracted.', '3. Say their name once in a warm, clear voice.', '4. Mark the instant they turn towards you, then deliver a reward beside your leg.', '5. Pause for a few seconds and repeat five times, ending while your dog is keen.'],
    tips: ['Use the same pronunciation each time.', 'Reward even a small head turn at first.', 'Practise in different quiet rooms before adding distractions.'],
    commonMistakes: ['Repeating the name several times.', 'Using the name when something more exciting is too close.', 'Calling the dog only when fun is about to end.'],
    troubleshooting: [{ problem: 'Your dog does not turn.', solution: 'Move closer, reduce background activity, and make one soft sound before the next repetition.' }, { problem: 'Your dog watches the food instead.', solution: 'Keep rewards behind your back until after the head turn.' }, { problem: 'Responses become slower.', solution: 'Stop for a break and use fewer repetitions next time.' }],
    safetyNotes: ['Practise indoors or in a securely enclosed area so there is no need to chase your dog.'], completionDescription: 'The dog turns towards the owner after one name cue in at least four of five attempts from one metre away in a quiet room.', tags: ['foundation', 'recall', 'home'],
  }),
  authorLesson({
    id: 'recall-short-distance', title: 'Short-Distance Recall', shortDescription: 'Teach an enthusiastic return over a short distance in a familiar place.', skill: 'recall', difficultyLevel: 2, estimatedMinutes: 9,
    goal: 'Your dog moves directly to you after one recall cue from three metres away.', equipment: ['High-value food rewards', 'A secure enclosed space', 'A lightweight long line if outdoors'], prerequisites: [{ lessonId: 'recall-name-response', minimumSuccessfulCompletions: 1 }],
    steps: ['1. Begin in a secure, familiar area with your dog two metres away.', '2. Say the dog’s name, then give your recall cue once as they look towards you.', '3. Move backwards two steps to invite movement without pulling the dog.', '4. Mark as the dog reaches you and reward generously close to your body.', '5. Release the dog back to exploring, then repeat from gradually varied positions.'],
    tips: ['Use especially good rewards for recall.', 'Sometimes recall and release straight back to fun.', 'Increase distance only after four reliable responses.'],
    commonMistakes: ['Showing the reward before giving the cue every time.', 'Reeling the dog in with the long line.', 'Punishing or scolding the dog after they return slowly.'],
    troubleshooting: [{ problem: 'The dog stops halfway.', solution: 'Shorten the distance and move away cheerfully as the dog starts towards you.' }, { problem: 'The dog ignores the cue outdoors.', solution: 'Return indoors or increase distance from outdoor distractions.' }, { problem: 'The dog avoids being touched on return.', solution: 'Reward first and practise gentle collar touches separately.' }],
    safetyNotes: ['Never punish a dog after they return; use a long line outdoors and keep it attached to a secure harness.'], completionDescription: 'The dog returns after one recall cue in at least four of five attempts from three metres away in a familiar, low-distraction area.', tags: ['recall', 'home', 'outdoors'],
  }),
  authorLesson({
    id: 'recall-around-distractions', title: 'Recall Around Distractions', shortDescription: 'Build safer recall responses around carefully controlled everyday distractions.', skill: 'recall', difficultyLevel: 3, estimatedMinutes: 12,
    goal: 'Your dog can leave a mild distraction and return on cue while safely managed.', equipment: ['High-value rewards', 'A 5–10 metre long line', 'A secure well-fitted harness', 'A mild planned distraction'], prerequisites: [{ lessonId: 'recall-short-distance', minimumSuccessfulCompletions: 1 }],
    steps: ['1. Choose a spacious area and begin far enough from one mild distraction that your dog can still respond.', '2. Allow your dog to notice the distraction without moving closer to it.', '3. Say their name and recall cue once when they can briefly disengage.', '4. Move away, mark the turn towards you, and reward several times when they arrive.', '5. Release them to sniff, changing only one factor—distance or distraction—after repeated success.'],
    tips: ['Treat returning as worthwhile every time.', 'Use natural rewards such as permission to sniff.', 'Record the distance where your dog succeeds.'],
    commonMistakes: ['Testing recall beside an overwhelming distraction.', 'Shortening the long line with a sharp pull.', 'Moving to off-lead practice before it is reliably safe.'],
    troubleshooting: [{ problem: 'The dog cannot look away.', solution: 'Increase distance immediately and wait for relaxed body language before trying again.' }, { problem: 'Success drops below four in five.', solution: 'Return to the last easier distance and use a better reward.' }, { problem: 'The dog tangles in the line.', solution: 'Use an open area, keep the line low, and gather slack smoothly without wrapping it around your hand.' }],
    safetyNotes: ['Do not practise off lead in unsecured areas until recall is reliably safe; a long line is a safety tool, not a correction tool.'], completionDescription: 'On a long line, the dog returns in four of five attempts from five metres while one mild distraction remains at a workable distance.', tags: ['recall', 'outdoors', 'safety'],
  }),
] as const;
