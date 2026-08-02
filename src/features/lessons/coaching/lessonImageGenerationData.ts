/**
 * Node-safe single source of truth for per-lesson training-image generation.
 *
 * This module deliberately contains NO React Native imports and NO `require()`
 * of image assets, so it can be imported both by the React Native runtime
 * manifest (`lessonImageManifest.ts`) and by the plain Node generation script
 * (`scripts/generateLessonImages.ts`) without pulling in the bundler.
 *
 * Every entry corresponds to exactly one active production lesson id. The list
 * is kept in the same order as `productionLessonDefinitions`.
 */

export type BehaviourSkillId =
  | 'recall'
  | 'loose-lead-walking'
  | 'focus'
  | 'jumping'
  | 'barking'
  | 'chewing'
  | 'reactivity'
  | 'house-training'
  | 'confidence'
  | 'impulse-control';

export interface LessonImageSpec {
  /** Unique, active production lesson id (matches the lesson catalogue). */
  readonly lessonId: string;
  readonly title: string;
  readonly skill: BehaviourSkillId;
  /** The exact behaviour the lesson teaches. */
  readonly behaviour: string;
  /** The exact visible dog-training action the image must depict. */
  readonly visibleAction: string;
  readonly breed: string;
  readonly size: string;
  readonly age: string;
  readonly environment: string;
  readonly handlerPosition: string;
  readonly rewardPlacement: string;
  /** Camera angle and framing. */
  readonly cameraFraming: string;
  readonly lighting: string;
  /** Destination filename under assets/lesson-images/by-lesson/. */
  readonly destinationFilename: string;
  /** Full positive photorealistic generation prompt. */
  readonly prompt: string;
  /** Negative prompt requirements. */
  readonly negativePrompt: string;
}

/**
 * Shared negative-prompt baseline. Enforces photorealism and humane,
 * positive-reinforcement handling. Individual lessons may append extra
 * lesson-specific exclusions.
 */
export const SHARED_NEGATIVE_PROMPT =
  'cartoon, illustration, drawing, painting, digital painting, storybook art, ' +
  'anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, ' +
  'text, caption, watermark, logo, signature, border, ' +
  'deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, ' +
  'prong collar, choke chain, choke collar, shock collar, e-collar, ' +
  'tight leash, tense leash, choking, yanking, fear, cowering, punishment, ' +
  'intimidation, harsh handling';

const withExtra = (extra?: string): string =>
  extra ? `${SHARED_NEGATIVE_PROMPT}, ${extra}` : SHARED_NEGATIVE_PROMPT;

const photoPrefix = 'Photorealistic candid documentary-style colour photograph of ';
const photoSuffix =
  '. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, ' +
  'true-to-life canine anatomy, gentle positive-reinforcement dog training, ' +
  '3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.';

const spec = (
  base: Omit<LessonImageSpec, 'prompt' | 'negativePrompt'>,
  scene: string,
  extraNegative?: string,
): LessonImageSpec => ({
  ...base,
  prompt: `${photoPrefix}${scene}${photoSuffix}`,
  negativePrompt: withExtra(extraNegative),
});

export const lessonImageGenerationSpecs: readonly LessonImageSpec[] = Object.freeze([
  // ---- Recall ----
  spec(
    {
      lessonId: 'recall-name-response',
      title: 'Name Response',
      skill: 'recall',
      behaviour: 'A quick, happy head-turn towards the handler when the dog hears its name.',
      visibleAction: 'The dog turns its head and makes eye contact with the handler on hearing its name.',
      breed: 'Golden Retriever',
      size: 'Small (young puppy)',
      age: 'Puppy, about 4 months',
      environment: 'Bright, tidy modern living room with soft natural daylight',
      handlerPosition: 'Crouched low nearby, one hand visible near the knees',
      rewardPlacement: 'Treat held low near the handler’s knees, ready to deliver at chest height',
      cameraFraming: 'Eye-level medium close-up on the puppy’s joyful expression, 3:2 landscape',
      lighting: 'Soft indoor window daylight',
      destinationFilename: 'recall-name-response.jpg',
    },
    'a friendly Golden Retriever puppy turning its head and making happy eye contact with its crouching owner in a bright modern living room, the owner’s hand visible holding a small reward low near the knees',
  ),
  spec(
    {
      lessonId: 'recall-short-distance',
      title: 'Short-Distance Recall',
      skill: 'recall',
      behaviour: 'An enthusiastic return to the handler over a short distance in a familiar place.',
      visibleAction: 'The dog runs across a lawn straight towards a crouching handler with open arms.',
      breed: 'Australian Shepherd',
      size: 'Medium',
      age: 'Young adult, about 1 year',
      environment: 'Sunny enclosed green backyard lawn',
      handlerPosition: 'Crouched low about five metres away with open, welcoming posture',
      rewardPlacement: 'Treat visible in an open hand ready at the handler’s chest',
      cameraFraming: 'Low action shot at dog eye level, 3:2 landscape',
      lighting: 'Bright outdoor sunlight',
      destinationFilename: 'recall-short-distance.jpg',
    },
    'an Australian Shepherd running enthusiastically across a sunny green backyard lawn towards its owner who is crouching with open arms and a visible treat',
  ),
  spec(
    {
      lessonId: 'recall-around-distractions',
      title: 'Recall Around Distractions',
      skill: 'recall',
      behaviour: 'A reliable recall response around carefully controlled everyday distractions.',
      visibleAction: 'The dog sprints past a park bench on a trailing long line straight to the cheering handler.',
      breed: 'Labrador mixed-breed',
      size: 'Medium',
      age: 'Adult',
      environment: 'Open grassy park field near a wooden park bench',
      handlerPosition: 'Standing with open arms, cheering the dog in',
      rewardPlacement: 'Treat ready in an open hand at waist height for arrival',
      cameraFraming: 'Dynamic wide outdoor action shot, 3:2 landscape',
      lighting: 'Natural outdoor daylight',
      destinationFilename: 'recall-around-distractions.jpg',
    },
    'a happy mixed-breed dog sprinting past a park bench on a loose trailing long line straight towards its owner who stands with open arms encouraging it, a quiet park in the background',
    'no stepped-on line',
  ),

  // ---- Loose-lead walking ----
  spec(
    {
      lessonId: 'loose-lead-reward-zone',
      title: 'Find the Reward Zone',
      skill: 'loose-lead-walking',
      behaviour: 'The dog learns that staying beside the handler on a loose lead is rewarding.',
      visibleAction: 'The handler delivers a treat beside their hip to a dog walking level with their leg on a J-shaped slack lead.',
      breed: 'Yellow Labrador',
      size: 'Large',
      age: 'Young adult',
      environment: 'Green park walking path',
      handlerPosition: 'Walking forward, delivering a treat down beside the hip',
      rewardPlacement: 'Treat delivered at the handler’s hip, beside the leg the dog should follow',
      cameraFraming: 'Side profile walking shot, 3:2 landscape',
      lighting: 'Outdoor sunlight',
      destinationFilename: 'loose-lead-reward-zone.jpg',
    },
    'a handler walking forward along a green park path handing a treat down beside their hip to a happy Yellow Labrador walking level with their leg, the lead hanging in a loose J-shaped curve',
  ),
  spec(
    {
      lessonId: 'loose-lead-direction-changes',
      title: 'Calm Direction Changes',
      skill: 'loose-lead-walking',
      behaviour: 'The dog notices and follows smooth changes of direction.',
      visibleAction: 'The handler turns smoothly on a paved path and the dog curves naturally with them on a loose leash.',
      breed: 'Brown Labrador/Shepherd mixed-breed',
      size: 'Medium',
      age: 'Adult',
      environment: 'Paved park pathway',
      handlerPosition: 'Mid-turn, walking smoothly',
      rewardPlacement: 'Treat hand relaxed at the hip, ready to mark the turn',
      cameraFraming: 'Wide action shot showing the curved path, 3:2 landscape',
      lighting: 'Natural outdoor daylight',
      destinationFilename: 'loose-lead-direction-changes.jpg',
    },
    'an owner smoothly turning on a paved park path while a medium brown dog curves naturally alongside them on a loose relaxed leash',
    'no harsh jerking',
  ),
  spec(
    {
      lessonId: 'loose-lead-real-world-distractions',
      title: 'Loose Lead in the Real World',
      skill: 'loose-lead-walking',
      behaviour: 'Relaxed loose-lead walking near manageable everyday distractions.',
      visibleAction: 'The dog walks loosely beside the owner along a suburban pavement past parked cars and lawns.',
      breed: 'Staffordshire/Labrador mixed-breed',
      size: 'Medium',
      age: 'Adult',
      environment: 'Suburban pavement with parked cars and green lawns',
      handlerPosition: 'Walking alongside the dog, lead relaxed',
      rewardPlacement: 'Treat hand relaxed at hip level',
      cameraFraming: 'Medium side shot, outdoor daylight, 3:2 landscape',
      lighting: 'Outdoor daylight',
      destinationFilename: 'loose-lead-real-world-distractions.jpg',
    },
    'an adult dog walking calmly and loosely beside its owner along a suburban pavement past parked cars and green front lawns, the lead completely slack',
    'no leash strain',
  ),

  // ---- Focus ----
  spec(
    {
      lessonId: 'focus-check-in',
      title: 'Voluntary Check-Ins',
      skill: 'focus',
      behaviour: 'The dog chooses to look towards the handler without being prompted.',
      visibleAction: 'A dog walking outdoors turns its head up to make happy eye contact with the handler on a loose lead.',
      breed: 'Black Labrador Retriever',
      size: 'Large',
      age: 'Young adult',
      environment: 'Grassy park edge',
      handlerPosition: 'Walking beside the dog',
      rewardPlacement: 'Treat hand relaxed at the hip, ready to reward the look',
      cameraFraming: 'Three-quarter angle showing the dog’s eyes on the handler, 3:2 landscape',
      lighting: 'Soft outdoor light',
      destinationFilename: 'focus-check-in.jpg',
    },
    'a Black Labrador walking outdoors on a loose lead turning its head up to make happy eye contact with its handler at a grassy park edge',
    'no tight collar',
  ),
  spec(
    {
      lessonId: 'focus-hold-attention',
      title: 'Hold Attention Briefly',
      skill: 'focus',
      behaviour: 'Comfortable attention held for a few seconds without frustration.',
      visibleAction: 'A sitting dog holds steady eye contact with the handler who holds a reward near chest level.',
      breed: 'Standard Poodle',
      size: 'Medium to large',
      age: 'Adult',
      environment: 'Warm indoor living room',
      handlerPosition: 'Standing in front of the dog holding a treat near the chest',
      rewardPlacement: 'Treat held at the handler’s chest, drawing the eyes upward',
      cameraFraming: 'Eye-level medium shot, 3:2 landscape',
      lighting: 'Warm indoor daylight',
      destinationFilename: 'focus-hold-attention.jpg',
    },
    'a Standard Poodle sitting indoors and holding steady, relaxed eye contact with its handler who holds a reward near chest level in a warm living room',
    'no forced chin hold',
  ),
  spec(
    {
      lessonId: 'focus-around-distractions',
      title: 'Focus Around Distractions',
      skill: 'focus',
      behaviour: 'The dog reconnects with the handler around manageable everyday activity.',
      visibleAction: 'A sitting dog checks in with its owner while a distant cyclist passes far away on a trail.',
      breed: 'German Shepherd',
      size: 'Large',
      age: 'Adult',
      environment: 'Open park field with a distant trail',
      handlerPosition: 'Standing facing the dog',
      rewardPlacement: 'Treat ready in the hand at waist height',
      cameraFraming: 'Wide medium shot showing the distant distraction, 3:2 landscape',
      lighting: 'Outdoor daylight',
      destinationFilename: 'focus-around-distractions.jpg',
    },
    'a calm German Shepherd sitting and checking in with its owner in an open park while a cyclist rides by far away on a distant trail',
    'no reactive lunging',
  ),

  // ---- Jumping ----
  spec(
    {
      lessonId: 'jumping-four-paws-down',
      title: 'Four Paws Down',
      skill: 'jumping',
      behaviour: 'Calm standing is reinforced before jumping becomes a way to get attention.',
      visibleAction: 'A dog stands with all four paws on the floor while being greeted with low hands and a gentle chest scratch.',
      breed: 'Boxer',
      size: 'Medium to large',
      age: 'Young adult',
      environment: 'Living room entryway',
      handlerPosition: 'Crouched low, greeting the dog at its own height',
      rewardPlacement: 'Calm chest scratch delivered low, at the dog’s chest',
      cameraFraming: 'Low-angle medium shot, 3:2 landscape',
      lighting: 'Indoor daylight',
      destinationFilename: 'jumping-four-paws-down.jpg',
    },
    'a Boxer standing calmly with all four paws firmly on the floor of a living room entryway being greeted with low, gentle hands and a calm chest scratch',
    'no jumping, no paws on chest',
  ),
  spec(
    {
      lessonId: 'jumping-calm-greetings',
      title: 'Calm Greetings',
      skill: 'jumping',
      behaviour: 'A repeatable calm greeting routine with one familiar helper.',
      visibleAction: 'A dog stands calmly beside its owner while a visiting friend extends a gentle hand to pet it.',
      breed: 'Labradoodle',
      size: 'Medium',
      age: 'Adult',
      environment: 'Home hallway entryway',
      handlerPosition: 'Standing beside the dog holding the lead loosely, next to the visitor',
      rewardPlacement: 'Calm gentle petting from the visitor at the dog’s shoulder',
      cameraFraming: 'Medium shot showing dog and visitor, 3:2 landscape',
      lighting: 'Natural indoor light',
      destinationFilename: 'jumping-calm-greetings.jpg',
    },
    'a friendly Labradoodle standing calmly beside its owner in a home hallway while a visiting friend gently extends a calm hand to pet it, the lead loose',
    'no jumping on the visitor',
  ),
  spec(
    {
      lessonId: 'jumping-visitors-and-excitement',
      title: 'Visitors and Excitement',
      skill: 'jumping',
      behaviour: 'Calm greeting skills applied to realistic arrivals.',
      visibleAction: 'A dog sits politely on an entry mat as a guest enters through the front door.',
      breed: 'Mixed-breed',
      size: 'Medium',
      age: 'Adult',
      environment: 'Spacious entryway with a mat by the front door',
      handlerPosition: 'Standing near the door welcoming the visitor',
      rewardPlacement: 'Treat ready to reward the sit on the mat',
      cameraFraming: 'Wide medium shot, 3:2 landscape',
      lighting: 'Bright indoor light',
      destinationFilename: 'jumping-visitors-and-excitement.jpg',
    },
    'a medium mixed-breed dog sitting politely on an entry mat inside a hallway as a guest steps in through the open front door, the owner nearby',
    'no lunging, no jumping',
  ),

  // ---- Barking ----
  spec(
    {
      lessonId: 'barking-identify-triggers',
      title: 'Identify Barking Triggers',
      skill: 'barking',
      behaviour: 'Observing when barking happens so the handler can respond to its cause.',
      visibleAction: 'A dog sits calmly on a rug looking out of a large window while the owner observes quietly.',
      breed: 'Friendly mixed-breed',
      size: 'Medium',
      age: 'Adult',
      environment: 'Modern living room with a floor-to-ceiling window and daylight',
      handlerPosition: 'Seated in an armchair in the background, watching quietly',
      rewardPlacement: 'No active reward; calm observation only',
      cameraFraming: '35mm medium shot, shallow depth of field, 3:2 landscape',
      lighting: 'Window daylight',
      destinationFilename: 'barking-identify-triggers.jpg',
    },
    'a friendly mixed-breed dog sitting calmly on a rug and looking out of a modern floor-to-ceiling window in a cosy living room while the owner observes quietly from an armchair in the background',
  ),
  spec(
    {
      lessonId: 'barking-quiet-reinforcement',
      title: 'Reinforce Quiet Moments',
      skill: 'barking',
      behaviour: 'Rewarding brief quiet pauses around a manageable trigger.',
      visibleAction: 'A dog lies quietly on its bed looking up as the owner offers a treat at nose level.',
      breed: 'Border Collie',
      size: 'Medium',
      age: 'Adult',
      environment: 'Bright indoor living room',
      handlerPosition: 'Kneeling beside the dog, extending a treat',
      rewardPlacement: 'Treat delivered calmly at the dog’s nose level on its bed',
      cameraFraming: 'Eye-level close medium shot, 3:2 landscape',
      lighting: 'Bright indoor natural light',
      destinationFilename: 'barking-quiet-reinforcement.jpg',
    },
    'a Border Collie lying quietly on a dog bed and looking up towards its owner who kneels beside it calmly offering a treat at nose level in a bright living room',
  ),
  spec(
    {
      lessonId: 'barking-real-world-management',
      title: 'Real-World Barking Management',
      skill: 'barking',
      behaviour: 'Combining prevention, calm alternatives and reinforcement in a daily routine.',
      visibleAction: 'A dog on a slack lead turns calmly towards the owner while walking past a garden fence.',
      breed: 'Medium mixed-breed',
      size: 'Medium',
      age: 'Adult',
      environment: 'Suburban pavement beside a green garden fence',
      handlerPosition: 'Walking beside the dog holding a loose lead',
      rewardPlacement: 'Treat ready at the hip to reward the calm turn',
      cameraFraming: 'Outdoor side-angle medium shot, 3:2 landscape',
      lighting: 'Outdoor daylight',
      destinationFilename: 'barking-real-world-management.jpg',
    },
    'an owner walking a medium mixed-breed dog on a slack lead past a suburban garden fence, the dog turning calmly towards the owner with relaxed ears',
  ),

  // ---- Chewing ----
  spec(
    {
      lessonId: 'chewing-appropriate-items',
      title: 'Choose Appropriate Chews',
      skill: 'chewing',
      behaviour: 'Making safe, suitable chewing options easy and rewarding to choose.',
      visibleAction: 'A puppy rests on the floor happily chewing a durable rubber dog toy.',
      breed: 'Golden Retriever',
      size: 'Small (puppy)',
      age: 'Puppy, about 3–4 months',
      environment: 'Clean modern hardwood living-room floor',
      handlerPosition: 'Out of frame, supervising nearby',
      rewardPlacement: 'The appropriate chew toy itself is the reward',
      cameraFraming: 'Low-angle close-up on the puppy and chew toy, 3:2 landscape',
      lighting: 'Bright indoor daylight',
      destinationFilename: 'chewing-appropriate-items.jpg',
    },
    'a young Golden Retriever puppy resting on a clean wooden floor happily chewing a durable rubber dog chew toy in a bright living room',
    'no shoes or forbidden household items near the dog',
  ),
  spec(
    {
      lessonId: 'chewing-redirection-routine',
      title: 'A Calm Redirection Routine',
      skill: 'chewing',
      behaviour: 'Guiding the dog from an unsuitable object to a safe alternative without conflict.',
      visibleAction: 'A young dog leaves a shoe on the rug to accept a safe chew toy offered by the owner.',
      breed: 'Yellow Labrador',
      size: 'Medium',
      age: 'Young, about 6–9 months',
      environment: 'Cosy living-room rug',
      handlerPosition: 'Kneeling low, calmly offering the chew toy',
      rewardPlacement: 'Safe chew toy offered at the dog’s mouth level',
      cameraFraming: 'Medium close-up showing the hand, chew toy and dog, 3:2 landscape',
      lighting: 'Warm indoor daylight',
      destinationFilename: 'chewing-redirection-routine.jpg',
    },
    'an owner kneeling and calmly offering a safe chew toy to a young Yellow Labrador that is leaving a shoe on the carpet to take the chew toy, a cosy living room',
    'no conflict, no scolding',
  ),
  spec(
    {
      lessonId: 'chewing-independence-and-prevention',
      title: 'Independence and Prevention',
      skill: 'chewing',
      behaviour: 'A practical routine that meets chewing needs while preventing unsafe choices.',
      visibleAction: 'A dog rests contentedly on a mat surrounded by an assortment of safe chews.',
      breed: 'Beagle (tricolour)',
      size: 'Small to medium',
      age: 'Adult',
      environment: 'Clean modern home living room',
      handlerPosition: 'Out of frame',
      rewardPlacement: 'Safe chews arranged within easy reach on the mat',
      cameraFraming: 'Wide medium shot, 3:2 landscape',
      lighting: 'Bright natural lighting',
      destinationFilename: 'chewing-independence-and-prevention.jpg',
    },
    'an adult tricolour Beagle relaxing comfortably on a plush dog mat with an assortment of safe chew toys and bones arranged around it in a clean modern living room',
  ),

  // ---- Reactivity ----
  spec(
    {
      lessonId: 'reactivity-safe-distance',
      title: 'Find a Safe Working Distance',
      skill: 'reactivity',
      behaviour: 'Observing triggers from far enough away that the dog can stay safe, eat and recover.',
      visibleAction: 'A dog sits calmly beside the handler on a hill while another dog walks far away below.',
      breed: 'German Shepherd',
      size: 'Large',
      age: 'Adult',
      environment: 'Open grassy hill overlooking a distant park trail',
      handlerPosition: 'Standing beside the dog, giving a treat',
      rewardPlacement: 'Treat delivered calmly beside the handler at the dog’s head',
      cameraFraming: 'Wide landscape shot showing the distance, 3:2 landscape',
      lighting: 'Soft outdoor light',
      destinationFilename: 'reactivity-safe-distance.jpg',
    },
    'a handler and a calm German Shepherd standing on a grassy hill giving the dog a treat, while another dog walks far away on a distant park trail below',
    'no barking, no reaction',
  ),
  spec(
    {
      lessonId: 'reactivity-look-and-disengage',
      title: 'Look and Disengage',
      skill: 'reactivity',
      behaviour: 'Reinforcing the choice to look away from a trigger while below reaction threshold.',
      visibleAction: 'A dog turns its head back from a distant trigger towards the handler for a treat on a slack long line.',
      breed: 'Collie',
      size: 'Medium',
      age: 'Adult',
      environment: 'Park edge near trees',
      handlerPosition: 'Standing about a metre from the dog, rewarding the look-away',
      rewardPlacement: 'Treat delivered at the dog’s head as it turns back',
      cameraFraming: 'Medium shot showing the head turn, 3:2 landscape',
      lighting: 'Outdoor daylight',
      destinationFilename: 'reactivity-look-and-disengage.jpg',
    },
    'a calm Collie on a slack long line turning its head back from a distant trigger towards its handler to take a treat, at a quiet park edge near trees',
    'no lunging',
  ),
  spec(
    {
      lessonId: 'reactivity-controlled-exposure',
      title: 'Carefully Controlled Exposure',
      skill: 'reactivity',
      behaviour: 'Practising predictable, below-threshold trigger sightings with a safety-first plan.',
      visibleAction: 'A dog walks calmly with the handler behind a natural park hedge, focused on the handler.',
      breed: 'Shepherd mixed-breed',
      size: 'Medium',
      age: 'Adult',
      environment: 'Park walkway alongside a green hedge line',
      handlerPosition: 'Walking beside the dog',
      rewardPlacement: 'Treat hand relaxed at hip, ready to reward focus',
      cameraFraming: 'Medium wide landscape shot, 3:2 landscape',
      lighting: 'Natural light',
      destinationFilename: 'reactivity-controlled-exposure.jpg',
    },
    'a handler walking a calm dog behind a natural green park hedge that acts as a visual barrier, the dog relaxed and focused on the handler',
    'no barrier frustration',
  ),

  // ---- House-training ----
  spec(
    {
      lessonId: 'house-training-routine',
      title: 'Build a Toileting Routine',
      skill: 'house-training',
      behaviour: 'Using timing, supervision and immediate rewards to make the right location easy to choose.',
      visibleAction: 'A puppy sniffs the grass in a backyard near an open patio door in the morning.',
      breed: 'Mixed-breed puppy',
      size: 'Small',
      age: 'Puppy, about 3 months',
      environment: 'Suburban backyard grass near an open patio door',
      handlerPosition: 'Standing nearby encouragingly',
      rewardPlacement: 'Treat ready to reward immediately after the puppy finishes',
      cameraFraming: 'Landscape outdoor shot, 3:2 landscape',
      lighting: 'Bright morning sun',
      destinationFilename: 'house-training-routine.jpg',
    },
    'a young puppy sniffing the lush green grass in a suburban backyard near an open patio door under bright morning sunlight, the owner standing nearby',
  ),
  spec(
    {
      lessonId: 'house-training-signal-and-reward',
      title: 'Signal and Reward',
      skill: 'house-training',
      behaviour: 'Pairing the routine with a clear way for the dog to request access.',
      visibleAction: 'The owner bends down to give a treat and praise to a small dog in the garden.',
      breed: 'Terrier mixed-breed',
      size: 'Small',
      age: 'Young adult',
      environment: 'Sunny residential garden',
      handlerPosition: 'Bending low, delivering a treat',
      rewardPlacement: 'Treat delivered low at the dog’s mouth with praise',
      cameraFraming: 'Close medium shot, 3:2 landscape',
      lighting: 'Natural sunlight',
      destinationFilename: 'house-training-signal-and-reward.jpg',
    },
    'an owner bending down to give a treat and warm praise to a small happy terrier mix in a sunny residential garden',
  ),
  spec(
    {
      lessonId: 'house-training-reliability',
      title: 'Build House-Training Reliability',
      skill: 'house-training',
      behaviour: 'Gradually extending freedom while protecting successful habits.',
      visibleAction: 'An adult dog sits patiently by a glass back door, looking out into the garden.',
      breed: 'Golden Retriever',
      size: 'Large',
      age: 'Adult',
      environment: 'Modern sunroom by a glass back door',
      handlerPosition: 'Approaching to open the door',
      rewardPlacement: 'Praise and access to the garden as the reward',
      cameraFraming: 'Medium shot showing dog and door, 3:2 landscape',
      lighting: 'Bright natural light',
      destinationFilename: 'house-training-reliability.jpg',
    },
    'an adult Golden Retriever sitting patiently by a glass back door and looking out into the garden with a gently wagging tail in a bright modern sunroom',
  ),

  // ---- Confidence ----
  spec(
    {
      lessonId: 'confidence-choice-and-exploration',
      title: 'Choice and Exploration',
      skill: 'confidence',
      behaviour: 'Building confidence by rewarding voluntary investigation and respecting retreat.',
      visibleAction: 'A curious dog sniffs an open cardboard box while the owner stands back giving space.',
      breed: 'Scruffy terrier mixed-breed (rescue)',
      size: 'Small to medium',
      age: 'Adult',
      environment: 'Bright sunlit living room',
      handlerPosition: 'Standing about two metres back, observing encouragingly',
      rewardPlacement: 'Treat ready to reward the voluntary investigation',
      cameraFraming: 'Wide shot showing full-body dog and open box, 3:2 landscape',
      lighting: 'Natural morning light',
      destinationFilename: 'confidence-choice-and-exploration.jpg',
    },
    'a curious scruffy rescue terrier-mix voluntarily sniffing an open cardboard box in a sunlit living room while the owner stands back calmly giving the dog space and time',
    'no forcing, no pulling',
  ),
  spec(
    {
      lessonId: 'confidence-new-surfaces-and-sounds',
      title: 'New Surfaces and Sounds',
      skill: 'confidence',
      behaviour: 'Introducing gentle sensory changes through choice and gradual exposure.',
      visibleAction: 'A dog steps one paw onto a textured rubber balance pad while the owner smiles beside it.',
      breed: 'Australian Shepherd (blue merle)',
      size: 'Medium',
      age: 'Young adult',
      environment: 'Indoor dog-training facility with soft matting',
      handlerPosition: 'Crouching beside the dog holding a treat',
      rewardPlacement: 'Treat delivered as the dog investigates the pad',
      cameraFraming: 'Medium shot focusing on the paws and balance pad, 3:2 landscape',
      lighting: 'Bright indoor daylight',
      destinationFilename: 'confidence-new-surfaces-and-sounds.jpg',
    },
    'a blue-merle Australian Shepherd stepping one paw onto a textured rubber balance pad in an indoor training room while its owner crouches beside it smiling with a treat',
    'no force, no pushing',
  ),
  spec(
    {
      lessonId: 'confidence-new-environments',
      title: 'Explore New Environments',
      skill: 'confidence',
      behaviour: 'Transferring choice-based confidence skills to a quiet unfamiliar location.',
      visibleAction: 'A dog explores a quiet park path on a long line, sniffing the grass happily.',
      breed: 'Cocker Spaniel',
      size: 'Small to medium',
      age: 'Adult',
      environment: 'Quiet green suburban park pathway',
      handlerPosition: 'Following about four metres behind, holding a long line loosely',
      rewardPlacement: 'Praise and freedom to explore as the reward',
      cameraFraming: 'Outdoor landscape shot, 3:2 landscape',
      lighting: 'Natural daylight',
      destinationFilename: 'confidence-new-environments.jpg',
    },
    'a Cocker Spaniel exploring a quiet green park pathway on a loose long line, sniffing the grass happily while its owner follows a few metres behind',
    'no tight leash, no crowd',
  ),

  // ---- Impulse control ----
  spec(
    {
      lessonId: 'impulse-control-wait-for-reward',
      title: 'Wait for a Reward',
      skill: 'impulse-control',
      behaviour: 'A very brief pause before access to something the dog wants.',
      visibleAction: 'A dog sits calmly facing an open palm holding a treat, pausing before taking it.',
      breed: 'Hungarian Vizsla',
      size: 'Medium',
      age: 'Young adult',
      environment: 'Bright indoor kitchen or dining room',
      handlerPosition: 'Open hand held about 30cm in front of the sitting dog',
      rewardPlacement: 'Treat resting on a flat open palm, delivered after the pause',
      cameraFraming: 'Close-up on the dog’s face and the open hand, 3:2 landscape',
      lighting: 'Indoor daylight',
      destinationFilename: 'impulse-control-wait-for-reward.jpg',
    },
    'a smooth-coated Hungarian Vizsla sitting calmly and patiently facing an open human palm holding a treat, pausing before taking it, in a bright kitchen',
    'no snatching',
  ),
  spec(
    {
      lessonId: 'impulse-control-doorways',
      title: 'Pause at Doorways',
      skill: 'impulse-control',
      behaviour: 'A calm, released pause at a low-risk doorway.',
      visibleAction: 'A dog sits quietly in front of an open front door, looking at the handler for the release cue.',
      breed: 'Border Collie',
      size: 'Medium',
      age: 'Adult',
      environment: 'Home entryway with an open front door',
      handlerPosition: 'Standing at the doorway looking at the dog',
      rewardPlacement: 'Release and access through the door as the reward',
      cameraFraming: 'Eye-level wide medium shot, 3:2 landscape',
      lighting: 'Natural daylight',
      destinationFilename: 'impulse-control-doorways.jpg',
    },
    'a Border Collie sitting quietly in front of an open front door in a home entryway, looking up at its handler and waiting calmly for the release cue',
    'no physical blocking',
  ),
  spec(
    {
      lessonId: 'impulse-control-real-world-distractions',
      title: 'Impulse Control in Daily Life',
      skill: 'impulse-control',
      behaviour: 'Short pauses before safe access to selected everyday rewards.',
      visibleAction: 'A dog holds a relaxed down-stay on a patio while the owner sets down a food bowl nearby.',
      breed: 'Golden Retriever',
      size: 'Large',
      age: 'Adult',
      environment: 'Outdoor home patio',
      handlerPosition: 'Placing a food bowl on the ground about 1.5 metres away',
      rewardPlacement: 'Release to the food bowl as the reward after the calm wait',
      cameraFraming: 'Medium wide shot, 3:2 landscape',
      lighting: 'Natural outdoor daylight',
      destinationFilename: 'impulse-control-real-world-distractions.jpg',
    },
    'a Golden Retriever holding a calm, relaxed down-stay on a home patio while its owner sets a food bowl on the ground a short distance away',
    'no pushing, no holding down',
  ),
]);

export const lessonImageGenerationSpecById: Readonly<Record<string, LessonImageSpec>> =
  Object.freeze(
    Object.fromEntries(lessonImageGenerationSpecs.map((entry) => [entry.lessonId, entry])),
  );
