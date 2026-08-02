# Lesson Image Production Manifest

> Generated from `src/features/lessons/coaching/lessonImageGenerationData.ts`
> by `scripts/generateLessonImages.ts --emit-doc`. Do not edit by hand;
> update the spec data (the single source of truth) and re-emit.

## Global requirements

- Each lesson requires a **unique** image showing that exact lesson action.
- **Photorealistic only.** No cartoon, illustration, animation, vector, emoji or 3D-rendered dog.
- **Humane handling only.** No shock collars, prong collars, choke chains, intimidation or unsafe handling. Positive reinforcement and realistic anatomy only.
- **Landscape 3:2 composition** suitable for mobile cropping.
- Destination: `assets/lesson-images/by-lesson/<lesson-id>.jpg`.

## Status legend

- `VERIFIED REALISTIC IMAGE EXISTS` — a real photograph is committed and validated.
- `NOT YET CREATED` — no unique per-lesson image yet; the app shows a temporary shared skill fallback.
- `REJECTED CARTOON OR ILLUSTRATION` — a produced image was rejected for style/safety and must be redone.

> **Audit note:** the current shared per-skill fallback images
> (`assets/lesson-images/<skill>.jpg`) are non-photorealistic illustrations.
> They are classified `REJECTED CARTOON OR ILLUSTRATION` and serve only as a
> temporary compatibility fallback until each lesson has a verified photograph.

## Lessons (30 active)

### Name Response

- **Lesson ID:** `recall-name-response`
- **Skill:** recall
- **Behaviour taught:** A quick, happy head-turn towards the handler when the dog hears its name.
- **Visible dog-training action:** The dog turns its head and makes eye contact with the handler on hearing its name.
- **Dog (breed / size / age):** Golden Retriever / Small (young puppy) / Puppy, about 4 months
- **Environment:** Bright, tidy modern living room with soft natural daylight
- **Handler position:** Crouched low nearby, one hand visible near the knees
- **Reward placement:** Treat held low near the handler’s knees, ready to deliver at chest height
- **Camera angle & framing:** Eye-level medium close-up on the puppy’s joyful expression, 3:2 landscape
- **Lighting:** Soft indoor window daylight
- **Destination filename:** `assets/lesson-images/by-lesson/recall-name-response.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a friendly Golden Retriever puppy turning its head and making happy eye contact with its crouching owner in a bright modern living room, the owner’s hand visible holding a small reward low near the knees. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling
- **Current image source:** shared skill illustration `assets/lesson-images/recall.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Short-Distance Recall

- **Lesson ID:** `recall-short-distance`
- **Skill:** recall
- **Behaviour taught:** An enthusiastic return to the handler over a short distance in a familiar place.
- **Visible dog-training action:** The dog runs across a lawn straight towards a crouching handler with open arms.
- **Dog (breed / size / age):** Australian Shepherd / Medium / Young adult, about 1 year
- **Environment:** Sunny enclosed green backyard lawn
- **Handler position:** Crouched low about five metres away with open, welcoming posture
- **Reward placement:** Treat visible in an open hand ready at the handler’s chest
- **Camera angle & framing:** Low action shot at dog eye level, 3:2 landscape
- **Lighting:** Bright outdoor sunlight
- **Destination filename:** `assets/lesson-images/by-lesson/recall-short-distance.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of an Australian Shepherd running enthusiastically across a sunny green backyard lawn towards its owner who is crouching with open arms and a visible treat. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling
- **Current image source:** shared skill illustration `assets/lesson-images/recall.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Recall Around Distractions

- **Lesson ID:** `recall-around-distractions`
- **Skill:** recall
- **Behaviour taught:** A reliable recall response around carefully controlled everyday distractions.
- **Visible dog-training action:** The dog sprints past a park bench on a trailing long line straight to the cheering handler.
- **Dog (breed / size / age):** Labrador mixed-breed / Medium / Adult
- **Environment:** Open grassy park field near a wooden park bench
- **Handler position:** Standing with open arms, cheering the dog in
- **Reward placement:** Treat ready in an open hand at waist height for arrival
- **Camera angle & framing:** Dynamic wide outdoor action shot, 3:2 landscape
- **Lighting:** Natural outdoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/recall-around-distractions.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a happy mixed-breed dog sprinting past a park bench on a loose trailing long line straight towards its owner who stands with open arms encouraging it, a quiet park in the background. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no stepped-on line
- **Current image source:** shared skill illustration `assets/lesson-images/recall.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Find the Reward Zone

- **Lesson ID:** `loose-lead-reward-zone`
- **Skill:** loose-lead-walking
- **Behaviour taught:** The dog learns that staying beside the handler on a loose lead is rewarding.
- **Visible dog-training action:** The handler delivers a treat beside their hip to a dog walking level with their leg on a J-shaped slack lead.
- **Dog (breed / size / age):** Yellow Labrador / Large / Young adult
- **Environment:** Green park walking path
- **Handler position:** Walking forward, delivering a treat down beside the hip
- **Reward placement:** Treat delivered at the handler’s hip, beside the leg the dog should follow
- **Camera angle & framing:** Side profile walking shot, 3:2 landscape
- **Lighting:** Outdoor sunlight
- **Destination filename:** `assets/lesson-images/by-lesson/loose-lead-reward-zone.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a handler walking forward along a green park path handing a treat down beside their hip to a happy Yellow Labrador walking level with their leg, the lead hanging in a loose J-shaped curve. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling
- **Current image source:** shared skill illustration `assets/lesson-images/loose-lead-walking.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Calm Direction Changes

- **Lesson ID:** `loose-lead-direction-changes`
- **Skill:** loose-lead-walking
- **Behaviour taught:** The dog notices and follows smooth changes of direction.
- **Visible dog-training action:** The handler turns smoothly on a paved path and the dog curves naturally with them on a loose leash.
- **Dog (breed / size / age):** Brown Labrador/Shepherd mixed-breed / Medium / Adult
- **Environment:** Paved park pathway
- **Handler position:** Mid-turn, walking smoothly
- **Reward placement:** Treat hand relaxed at the hip, ready to mark the turn
- **Camera angle & framing:** Wide action shot showing the curved path, 3:2 landscape
- **Lighting:** Natural outdoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/loose-lead-direction-changes.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of an owner smoothly turning on a paved park path while a medium brown dog curves naturally alongside them on a loose relaxed leash. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no harsh jerking
- **Current image source:** shared skill illustration `assets/lesson-images/loose-lead-walking.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Loose Lead in the Real World

- **Lesson ID:** `loose-lead-real-world-distractions`
- **Skill:** loose-lead-walking
- **Behaviour taught:** Relaxed loose-lead walking near manageable everyday distractions.
- **Visible dog-training action:** The dog walks loosely beside the owner along a suburban pavement past parked cars and lawns.
- **Dog (breed / size / age):** Staffordshire/Labrador mixed-breed / Medium / Adult
- **Environment:** Suburban pavement with parked cars and green lawns
- **Handler position:** Walking alongside the dog, lead relaxed
- **Reward placement:** Treat hand relaxed at hip level
- **Camera angle & framing:** Medium side shot, outdoor daylight, 3:2 landscape
- **Lighting:** Outdoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/loose-lead-real-world-distractions.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of an adult dog walking calmly and loosely beside its owner along a suburban pavement past parked cars and green front lawns, the lead completely slack. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no leash strain
- **Current image source:** shared skill illustration `assets/lesson-images/loose-lead-walking.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Voluntary Check-Ins

- **Lesson ID:** `focus-check-in`
- **Skill:** focus
- **Behaviour taught:** The dog chooses to look towards the handler without being prompted.
- **Visible dog-training action:** A dog walking outdoors turns its head up to make happy eye contact with the handler on a loose lead.
- **Dog (breed / size / age):** Black Labrador Retriever / Large / Young adult
- **Environment:** Grassy park edge
- **Handler position:** Walking beside the dog
- **Reward placement:** Treat hand relaxed at the hip, ready to reward the look
- **Camera angle & framing:** Three-quarter angle showing the dog’s eyes on the handler, 3:2 landscape
- **Lighting:** Soft outdoor light
- **Destination filename:** `assets/lesson-images/by-lesson/focus-check-in.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a Black Labrador walking outdoors on a loose lead turning its head up to make happy eye contact with its handler at a grassy park edge. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no tight collar
- **Current image source:** shared skill illustration `assets/lesson-images/focus.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Hold Attention Briefly

- **Lesson ID:** `focus-hold-attention`
- **Skill:** focus
- **Behaviour taught:** Comfortable attention held for a few seconds without frustration.
- **Visible dog-training action:** A sitting dog holds steady eye contact with the handler who holds a reward near chest level.
- **Dog (breed / size / age):** Standard Poodle / Medium to large / Adult
- **Environment:** Warm indoor living room
- **Handler position:** Standing in front of the dog holding a treat near the chest
- **Reward placement:** Treat held at the handler’s chest, drawing the eyes upward
- **Camera angle & framing:** Eye-level medium shot, 3:2 landscape
- **Lighting:** Warm indoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/focus-hold-attention.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a Standard Poodle sitting indoors and holding steady, relaxed eye contact with its handler who holds a reward near chest level in a warm living room. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no forced chin hold
- **Current image source:** shared skill illustration `assets/lesson-images/focus.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Focus Around Distractions

- **Lesson ID:** `focus-around-distractions`
- **Skill:** focus
- **Behaviour taught:** The dog reconnects with the handler around manageable everyday activity.
- **Visible dog-training action:** A sitting dog checks in with its owner while a distant cyclist passes far away on a trail.
- **Dog (breed / size / age):** German Shepherd / Large / Adult
- **Environment:** Open park field with a distant trail
- **Handler position:** Standing facing the dog
- **Reward placement:** Treat ready in the hand at waist height
- **Camera angle & framing:** Wide medium shot showing the distant distraction, 3:2 landscape
- **Lighting:** Outdoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/focus-around-distractions.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a calm German Shepherd sitting and checking in with its owner in an open park while a cyclist rides by far away on a distant trail. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no reactive lunging
- **Current image source:** shared skill illustration `assets/lesson-images/focus.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Four Paws Down

- **Lesson ID:** `jumping-four-paws-down`
- **Skill:** jumping
- **Behaviour taught:** Calm standing is reinforced before jumping becomes a way to get attention.
- **Visible dog-training action:** A dog stands with all four paws on the floor while being greeted with low hands and a gentle chest scratch.
- **Dog (breed / size / age):** Boxer / Medium to large / Young adult
- **Environment:** Living room entryway
- **Handler position:** Crouched low, greeting the dog at its own height
- **Reward placement:** Calm chest scratch delivered low, at the dog’s chest
- **Camera angle & framing:** Low-angle medium shot, 3:2 landscape
- **Lighting:** Indoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/jumping-four-paws-down.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a Boxer standing calmly with all four paws firmly on the floor of a living room entryway being greeted with low, gentle hands and a calm chest scratch. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no jumping, no paws on chest
- **Current image source:** shared skill illustration `assets/lesson-images/jumping.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Calm Greetings

- **Lesson ID:** `jumping-calm-greetings`
- **Skill:** jumping
- **Behaviour taught:** A repeatable calm greeting routine with one familiar helper.
- **Visible dog-training action:** A dog stands calmly beside its owner while a visiting friend extends a gentle hand to pet it.
- **Dog (breed / size / age):** Labradoodle / Medium / Adult
- **Environment:** Home hallway entryway
- **Handler position:** Standing beside the dog holding the lead loosely, next to the visitor
- **Reward placement:** Calm gentle petting from the visitor at the dog’s shoulder
- **Camera angle & framing:** Medium shot showing dog and visitor, 3:2 landscape
- **Lighting:** Natural indoor light
- **Destination filename:** `assets/lesson-images/by-lesson/jumping-calm-greetings.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a friendly Labradoodle standing calmly beside its owner in a home hallway while a visiting friend gently extends a calm hand to pet it, the lead loose. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no jumping on the visitor
- **Current image source:** shared skill illustration `assets/lesson-images/jumping.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Visitors and Excitement

- **Lesson ID:** `jumping-visitors-and-excitement`
- **Skill:** jumping
- **Behaviour taught:** Calm greeting skills applied to realistic arrivals.
- **Visible dog-training action:** A dog sits politely on an entry mat as a guest enters through the front door.
- **Dog (breed / size / age):** Mixed-breed / Medium / Adult
- **Environment:** Spacious entryway with a mat by the front door
- **Handler position:** Standing near the door welcoming the visitor
- **Reward placement:** Treat ready to reward the sit on the mat
- **Camera angle & framing:** Wide medium shot, 3:2 landscape
- **Lighting:** Bright indoor light
- **Destination filename:** `assets/lesson-images/by-lesson/jumping-visitors-and-excitement.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a medium mixed-breed dog sitting politely on an entry mat inside a hallway as a guest steps in through the open front door, the owner nearby. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no lunging, no jumping
- **Current image source:** shared skill illustration `assets/lesson-images/jumping.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Identify Barking Triggers

- **Lesson ID:** `barking-identify-triggers`
- **Skill:** barking
- **Behaviour taught:** Observing when barking happens so the handler can respond to its cause.
- **Visible dog-training action:** A dog sits calmly on a rug looking out of a large window while the owner observes quietly.
- **Dog (breed / size / age):** Friendly mixed-breed / Medium / Adult
- **Environment:** Modern living room with a floor-to-ceiling window and daylight
- **Handler position:** Seated in an armchair in the background, watching quietly
- **Reward placement:** No active reward; calm observation only
- **Camera angle & framing:** 35mm medium shot, shallow depth of field, 3:2 landscape
- **Lighting:** Window daylight
- **Destination filename:** `assets/lesson-images/by-lesson/barking-identify-triggers.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a friendly mixed-breed dog sitting calmly on a rug and looking out of a modern floor-to-ceiling window in a cosy living room while the owner observes quietly from an armchair in the background. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling
- **Current image source:** shared skill illustration `assets/lesson-images/barking.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Reinforce Quiet Moments

- **Lesson ID:** `barking-quiet-reinforcement`
- **Skill:** barking
- **Behaviour taught:** Rewarding brief quiet pauses around a manageable trigger.
- **Visible dog-training action:** A dog lies quietly on its bed looking up as the owner offers a treat at nose level.
- **Dog (breed / size / age):** Border Collie / Medium / Adult
- **Environment:** Bright indoor living room
- **Handler position:** Kneeling beside the dog, extending a treat
- **Reward placement:** Treat delivered calmly at the dog’s nose level on its bed
- **Camera angle & framing:** Eye-level close medium shot, 3:2 landscape
- **Lighting:** Bright indoor natural light
- **Destination filename:** `assets/lesson-images/by-lesson/barking-quiet-reinforcement.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a Border Collie lying quietly on a dog bed and looking up towards its owner who kneels beside it calmly offering a treat at nose level in a bright living room. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling
- **Current image source:** shared skill illustration `assets/lesson-images/barking.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Real-World Barking Management

- **Lesson ID:** `barking-real-world-management`
- **Skill:** barking
- **Behaviour taught:** Combining prevention, calm alternatives and reinforcement in a daily routine.
- **Visible dog-training action:** A dog on a slack lead turns calmly towards the owner while walking past a garden fence.
- **Dog (breed / size / age):** Medium mixed-breed / Medium / Adult
- **Environment:** Suburban pavement beside a green garden fence
- **Handler position:** Walking beside the dog holding a loose lead
- **Reward placement:** Treat ready at the hip to reward the calm turn
- **Camera angle & framing:** Outdoor side-angle medium shot, 3:2 landscape
- **Lighting:** Outdoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/barking-real-world-management.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of an owner walking a medium mixed-breed dog on a slack lead past a suburban garden fence, the dog turning calmly towards the owner with relaxed ears. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling
- **Current image source:** shared skill illustration `assets/lesson-images/barking.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Choose Appropriate Chews

- **Lesson ID:** `chewing-appropriate-items`
- **Skill:** chewing
- **Behaviour taught:** Making safe, suitable chewing options easy and rewarding to choose.
- **Visible dog-training action:** A puppy rests on the floor happily chewing a durable rubber dog toy.
- **Dog (breed / size / age):** Golden Retriever / Small (puppy) / Puppy, about 3–4 months
- **Environment:** Clean modern hardwood living-room floor
- **Handler position:** Out of frame, supervising nearby
- **Reward placement:** The appropriate chew toy itself is the reward
- **Camera angle & framing:** Low-angle close-up on the puppy and chew toy, 3:2 landscape
- **Lighting:** Bright indoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/chewing-appropriate-items.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a young Golden Retriever puppy resting on a clean wooden floor happily chewing a durable rubber dog chew toy in a bright living room. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no shoes or forbidden household items near the dog
- **Current image source:** shared skill illustration `assets/lesson-images/chewing.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### A Calm Redirection Routine

- **Lesson ID:** `chewing-redirection-routine`
- **Skill:** chewing
- **Behaviour taught:** Guiding the dog from an unsuitable object to a safe alternative without conflict.
- **Visible dog-training action:** A young dog leaves a shoe on the rug to accept a safe chew toy offered by the owner.
- **Dog (breed / size / age):** Yellow Labrador / Medium / Young, about 6–9 months
- **Environment:** Cosy living-room rug
- **Handler position:** Kneeling low, calmly offering the chew toy
- **Reward placement:** Safe chew toy offered at the dog’s mouth level
- **Camera angle & framing:** Medium close-up showing the hand, chew toy and dog, 3:2 landscape
- **Lighting:** Warm indoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/chewing-redirection-routine.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of an owner kneeling and calmly offering a safe chew toy to a young Yellow Labrador that is leaving a shoe on the carpet to take the chew toy, a cosy living room. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no conflict, no scolding
- **Current image source:** shared skill illustration `assets/lesson-images/chewing.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Independence and Prevention

- **Lesson ID:** `chewing-independence-and-prevention`
- **Skill:** chewing
- **Behaviour taught:** A practical routine that meets chewing needs while preventing unsafe choices.
- **Visible dog-training action:** A dog rests contentedly on a mat surrounded by an assortment of safe chews.
- **Dog (breed / size / age):** Beagle (tricolour) / Small to medium / Adult
- **Environment:** Clean modern home living room
- **Handler position:** Out of frame
- **Reward placement:** Safe chews arranged within easy reach on the mat
- **Camera angle & framing:** Wide medium shot, 3:2 landscape
- **Lighting:** Bright natural lighting
- **Destination filename:** `assets/lesson-images/by-lesson/chewing-independence-and-prevention.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of an adult tricolour Beagle relaxing comfortably on a plush dog mat with an assortment of safe chew toys and bones arranged around it in a clean modern living room. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling
- **Current image source:** shared skill illustration `assets/lesson-images/chewing.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Find a Safe Working Distance

- **Lesson ID:** `reactivity-safe-distance`
- **Skill:** reactivity
- **Behaviour taught:** Observing triggers from far enough away that the dog can stay safe, eat and recover.
- **Visible dog-training action:** A dog sits calmly beside the handler on a hill while another dog walks far away below.
- **Dog (breed / size / age):** German Shepherd / Large / Adult
- **Environment:** Open grassy hill overlooking a distant park trail
- **Handler position:** Standing beside the dog, giving a treat
- **Reward placement:** Treat delivered calmly beside the handler at the dog’s head
- **Camera angle & framing:** Wide landscape shot showing the distance, 3:2 landscape
- **Lighting:** Soft outdoor light
- **Destination filename:** `assets/lesson-images/by-lesson/reactivity-safe-distance.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a handler and a calm German Shepherd standing on a grassy hill giving the dog a treat, while another dog walks far away on a distant park trail below. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no barking, no reaction
- **Current image source:** shared skill illustration `assets/lesson-images/reactivity.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Look and Disengage

- **Lesson ID:** `reactivity-look-and-disengage`
- **Skill:** reactivity
- **Behaviour taught:** Reinforcing the choice to look away from a trigger while below reaction threshold.
- **Visible dog-training action:** A dog turns its head back from a distant trigger towards the handler for a treat on a slack long line.
- **Dog (breed / size / age):** Collie / Medium / Adult
- **Environment:** Park edge near trees
- **Handler position:** Standing about a metre from the dog, rewarding the look-away
- **Reward placement:** Treat delivered at the dog’s head as it turns back
- **Camera angle & framing:** Medium shot showing the head turn, 3:2 landscape
- **Lighting:** Outdoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/reactivity-look-and-disengage.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a calm Collie on a slack long line turning its head back from a distant trigger towards its handler to take a treat, at a quiet park edge near trees. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no lunging
- **Current image source:** shared skill illustration `assets/lesson-images/reactivity.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Carefully Controlled Exposure

- **Lesson ID:** `reactivity-controlled-exposure`
- **Skill:** reactivity
- **Behaviour taught:** Practising predictable, below-threshold trigger sightings with a safety-first plan.
- **Visible dog-training action:** A dog walks calmly with the handler behind a natural park hedge, focused on the handler.
- **Dog (breed / size / age):** Shepherd mixed-breed / Medium / Adult
- **Environment:** Park walkway alongside a green hedge line
- **Handler position:** Walking beside the dog
- **Reward placement:** Treat hand relaxed at hip, ready to reward focus
- **Camera angle & framing:** Medium wide landscape shot, 3:2 landscape
- **Lighting:** Natural light
- **Destination filename:** `assets/lesson-images/by-lesson/reactivity-controlled-exposure.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a handler walking a calm dog behind a natural green park hedge that acts as a visual barrier, the dog relaxed and focused on the handler. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no barrier frustration
- **Current image source:** shared skill illustration `assets/lesson-images/reactivity.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Build a Toileting Routine

- **Lesson ID:** `house-training-routine`
- **Skill:** house-training
- **Behaviour taught:** Using timing, supervision and immediate rewards to make the right location easy to choose.
- **Visible dog-training action:** A puppy sniffs the grass in a backyard near an open patio door in the morning.
- **Dog (breed / size / age):** Mixed-breed puppy / Small / Puppy, about 3 months
- **Environment:** Suburban backyard grass near an open patio door
- **Handler position:** Standing nearby encouragingly
- **Reward placement:** Treat ready to reward immediately after the puppy finishes
- **Camera angle & framing:** Landscape outdoor shot, 3:2 landscape
- **Lighting:** Bright morning sun
- **Destination filename:** `assets/lesson-images/by-lesson/house-training-routine.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a young puppy sniffing the lush green grass in a suburban backyard near an open patio door under bright morning sunlight, the owner standing nearby. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling
- **Current image source:** shared skill illustration `assets/lesson-images/house-training.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Signal and Reward

- **Lesson ID:** `house-training-signal-and-reward`
- **Skill:** house-training
- **Behaviour taught:** Pairing the routine with a clear way for the dog to request access.
- **Visible dog-training action:** The owner bends down to give a treat and praise to a small dog in the garden.
- **Dog (breed / size / age):** Terrier mixed-breed / Small / Young adult
- **Environment:** Sunny residential garden
- **Handler position:** Bending low, delivering a treat
- **Reward placement:** Treat delivered low at the dog’s mouth with praise
- **Camera angle & framing:** Close medium shot, 3:2 landscape
- **Lighting:** Natural sunlight
- **Destination filename:** `assets/lesson-images/by-lesson/house-training-signal-and-reward.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of an owner bending down to give a treat and warm praise to a small happy terrier mix in a sunny residential garden. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling
- **Current image source:** shared skill illustration `assets/lesson-images/house-training.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Build House-Training Reliability

- **Lesson ID:** `house-training-reliability`
- **Skill:** house-training
- **Behaviour taught:** Gradually extending freedom while protecting successful habits.
- **Visible dog-training action:** An adult dog sits patiently by a glass back door, looking out into the garden.
- **Dog (breed / size / age):** Golden Retriever / Large / Adult
- **Environment:** Modern sunroom by a glass back door
- **Handler position:** Approaching to open the door
- **Reward placement:** Praise and access to the garden as the reward
- **Camera angle & framing:** Medium shot showing dog and door, 3:2 landscape
- **Lighting:** Bright natural light
- **Destination filename:** `assets/lesson-images/by-lesson/house-training-reliability.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of an adult Golden Retriever sitting patiently by a glass back door and looking out into the garden with a gently wagging tail in a bright modern sunroom. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling
- **Current image source:** shared skill illustration `assets/lesson-images/house-training.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Choice and Exploration

- **Lesson ID:** `confidence-choice-and-exploration`
- **Skill:** confidence
- **Behaviour taught:** Building confidence by rewarding voluntary investigation and respecting retreat.
- **Visible dog-training action:** A curious dog sniffs an open cardboard box while the owner stands back giving space.
- **Dog (breed / size / age):** Scruffy terrier mixed-breed (rescue) / Small to medium / Adult
- **Environment:** Bright sunlit living room
- **Handler position:** Standing about two metres back, observing encouragingly
- **Reward placement:** Treat ready to reward the voluntary investigation
- **Camera angle & framing:** Wide shot showing full-body dog and open box, 3:2 landscape
- **Lighting:** Natural morning light
- **Destination filename:** `assets/lesson-images/by-lesson/confidence-choice-and-exploration.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a curious scruffy rescue terrier-mix voluntarily sniffing an open cardboard box in a sunlit living room while the owner stands back calmly giving the dog space and time. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no forcing, no pulling
- **Current image source:** shared skill illustration `assets/lesson-images/confidence.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### New Surfaces and Sounds

- **Lesson ID:** `confidence-new-surfaces-and-sounds`
- **Skill:** confidence
- **Behaviour taught:** Introducing gentle sensory changes through choice and gradual exposure.
- **Visible dog-training action:** A dog steps one paw onto a textured rubber balance pad while the owner smiles beside it.
- **Dog (breed / size / age):** Australian Shepherd (blue merle) / Medium / Young adult
- **Environment:** Indoor dog-training facility with soft matting
- **Handler position:** Crouching beside the dog holding a treat
- **Reward placement:** Treat delivered as the dog investigates the pad
- **Camera angle & framing:** Medium shot focusing on the paws and balance pad, 3:2 landscape
- **Lighting:** Bright indoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/confidence-new-surfaces-and-sounds.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a blue-merle Australian Shepherd stepping one paw onto a textured rubber balance pad in an indoor training room while its owner crouches beside it smiling with a treat. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no force, no pushing
- **Current image source:** shared skill illustration `assets/lesson-images/confidence.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Explore New Environments

- **Lesson ID:** `confidence-new-environments`
- **Skill:** confidence
- **Behaviour taught:** Transferring choice-based confidence skills to a quiet unfamiliar location.
- **Visible dog-training action:** A dog explores a quiet park path on a long line, sniffing the grass happily.
- **Dog (breed / size / age):** Cocker Spaniel / Small to medium / Adult
- **Environment:** Quiet green suburban park pathway
- **Handler position:** Following about four metres behind, holding a long line loosely
- **Reward placement:** Praise and freedom to explore as the reward
- **Camera angle & framing:** Outdoor landscape shot, 3:2 landscape
- **Lighting:** Natural daylight
- **Destination filename:** `assets/lesson-images/by-lesson/confidence-new-environments.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a Cocker Spaniel exploring a quiet green park pathway on a loose long line, sniffing the grass happily while its owner follows a few metres behind. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no tight leash, no crowd
- **Current image source:** shared skill illustration `assets/lesson-images/confidence.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Wait for a Reward

- **Lesson ID:** `impulse-control-wait-for-reward`
- **Skill:** impulse-control
- **Behaviour taught:** A very brief pause before access to something the dog wants.
- **Visible dog-training action:** A dog sits calmly facing an open palm holding a treat, pausing before taking it.
- **Dog (breed / size / age):** Hungarian Vizsla / Medium / Young adult
- **Environment:** Bright indoor kitchen or dining room
- **Handler position:** Open hand held about 30cm in front of the sitting dog
- **Reward placement:** Treat resting on a flat open palm, delivered after the pause
- **Camera angle & framing:** Close-up on the dog’s face and the open hand, 3:2 landscape
- **Lighting:** Indoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/impulse-control-wait-for-reward.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a smooth-coated Hungarian Vizsla sitting calmly and patiently facing an open human palm holding a treat, pausing before taking it, in a bright kitchen. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no snatching
- **Current image source:** shared skill illustration `assets/lesson-images/impulse-control.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Pause at Doorways

- **Lesson ID:** `impulse-control-doorways`
- **Skill:** impulse-control
- **Behaviour taught:** A calm, released pause at a low-risk doorway.
- **Visible dog-training action:** A dog sits quietly in front of an open front door, looking at the handler for the release cue.
- **Dog (breed / size / age):** Border Collie / Medium / Adult
- **Environment:** Home entryway with an open front door
- **Handler position:** Standing at the doorway looking at the dog
- **Reward placement:** Release and access through the door as the reward
- **Camera angle & framing:** Eye-level wide medium shot, 3:2 landscape
- **Lighting:** Natural daylight
- **Destination filename:** `assets/lesson-images/by-lesson/impulse-control-doorways.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a Border Collie sitting quietly in front of an open front door in a home entryway, looking up at its handler and waiting calmly for the release cue. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no physical blocking
- **Current image source:** shared skill illustration `assets/lesson-images/impulse-control.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

### Impulse Control in Daily Life

- **Lesson ID:** `impulse-control-real-world-distractions`
- **Skill:** impulse-control
- **Behaviour taught:** Short pauses before safe access to selected everyday rewards.
- **Visible dog-training action:** A dog holds a relaxed down-stay on a patio while the owner sets down a food bowl nearby.
- **Dog (breed / size / age):** Golden Retriever / Large / Adult
- **Environment:** Outdoor home patio
- **Handler position:** Placing a food bowl on the ground about 1.5 metres away
- **Reward placement:** Release to the food bowl as the reward after the calm wait
- **Camera angle & framing:** Medium wide shot, 3:2 landscape
- **Lighting:** Natural outdoor daylight
- **Destination filename:** `assets/lesson-images/by-lesson/impulse-control-real-world-distractions.jpg`
- **Generation prompt:** Photorealistic candid documentary-style colour photograph of a Golden Retriever holding a calm, relaxed down-stay on a home patio while its owner sets a food bowl on the ground a short distance away. Shot on a full-frame DSLR with a 35mm lens, natural light, shallow depth of field, true-to-life canine anatomy, gentle positive-reinforcement dog training, 3:2 landscape composition suitable for mobile cropping, high resolution, sharp focus.
- **Negative prompt:** cartoon, illustration, drawing, painting, digital painting, storybook art, anime, 3d render, cgi, render, vector art, sketch, watercolour, flat shading, text, caption, watermark, logo, signature, border, deformed anatomy, extra limbs, missing limbs, fused paws, distorted face, prong collar, choke chain, choke collar, shock collar, e-collar, tight leash, tense leash, choking, yanking, fear, cowering, punishment, intimidation, harsh handling, no pushing, no holding down
- **Current image source:** shared skill illustration `assets/lesson-images/impulse-control.jpg` (temporary fallback)
- **Current status:** NOT YET CREATED

