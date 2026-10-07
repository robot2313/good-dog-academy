# Good Dog Academy — Canonical Source of Truth / Main Bible

**Status:** CANONICAL PRODUCT + TECHNICAL NORTH STAR  
**Owner:** Roger  
**Established:** 2026-10-08  
**Purpose:** Prevent Good Dog Academy work from drifting into disconnected experiments, random refactors, or model-chasing that does not advance the product.

---

## 0. Authority and how this document must be used

This document defines what Good Dog Academy is being built toward.

Every engineer, AI coding agent, researcher, reviewer, or Work session must read this document before proposing or implementing meaningful work.

Before work begins, the worker must be able to answer:

1. Which part of this architecture or roadmap does the task advance?
2. What existing reliable component is being preserved?
3. What measurable product or accuracy outcome should improve?
4. How will the change be tested?
5. Is the task a dependency for a later phase, or is it merely interesting?

If a proposed task does not clearly advance this source of truth, fix a verified defect, unblock testing/release, or satisfy a direct instruction from the owner, it should not be started.

### Authority order

When instructions conflict, use this order:

1. Direct current instruction from the owner.
2. This `GOOD_DOG_ACADEMY_SOURCE_OF_TRUTH.md`.
3. A specifically approved milestone/task specification that does not conflict with this document.
4. Current verified repository/project state.
5. Existing implementation conventions.
6. Tool/agent preference.

This document is the **direction of travel**. `PROJECT_STATE.md`, branch heads, test counts, and build records describe the **current implementation state** and may change frequently.

Do not edit this source of truth casually. Strategy changes must be deliberate and explicit.

---

# 1. Product mission

Good Dog Academy is a professional **dog trainer in your pocket**.

The core system must evolve toward:

**WATCH → UNDERSTAND → TRACK → INTERPRET → COACH → REMEMBER → ADAPT**

The app should eventually understand:

- what the dog is doing;
- what the human trainer is doing;
- the interaction among dog, handler, hands, lead, rewards, environment, and equipment;
- whether a requested behaviour was completed;
- whether it was completed correctly;
- whether cue, marker, correction, reward, and release timing were appropriate;
- what went wrong;
- what should happen next;
- whether dog and handler performance improve over repetitions and sessions.

The final system is not merely an object detector and not merely a posture classifier. It is a **multimodal dog-training understanding system**.

---

# 2. Non-negotiable engineering principles

1. **Accuracy over novelty.**
2. **Measured evidence over marketing.**
3. **Temporal evidence over single-frame guessing.**
4. **Multiple independent signals over brittle heuristics.**
5. **Dog-specific training over generic assumptions when justified by evidence.**
6. **UNKNOWN over confident error.**
7. **On-device processing wherever practical.**
8. **Cloud intelligence only where it clearly adds value.**
9. **Do not rebuild reliable components unnecessarily.**
10. **Keep components modular so models can be replaced later.**
11. **Collect evidence from real dogs and real training sessions.**
12. **Test across breeds, morphotypes, coat types, environments, handlers, lighting, camera positions, and occlusion.**
13. **Measure trainer behaviour as carefully as dog behaviour.**
14. **Treat detection, pose, tracking, temporal action understanding, rep detection, uncertainty, and coaching as separate engineering problems.**
15. **Never claim a capability that has not been measured.**

---

# 3. Executive architecture decision

The strongest practical Good Dog Academy system should be a **layered, specialised perception-and-event architecture**, not one giant end-to-end video model.

General design:

```text
PHONE CAMERA + MICROPHONE + IMU
                │
                ▼
       SHARED TIMESTAMP CLOCK
                │
        ┌───────┴────────┐
        ▼                ▼
  VISUAL PERCEPTION     AUDIO
        │                │
        ▼                ▼
DOG/HUMAN DETECTION   VAD + KWS/ASR
        │                │
        ▼                │
TARGET DOG TRACKING      │
        │                │
        ▼                │
DOG ROI                  │
        │                │
 ┌──────┼─────────────┐  │
 ▼      ▼             ▼  │
DOG    DOG RGB       LEAD│
POSE   FEATURES      INFO│
 │                      │
 ▼                      │
HUMAN POSE + HANDS + OBJECTS
        │
        └──────────┬───────────┘
                   ▼
          TEMPORAL WORLD BUFFER
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 TEMPORAL DOG MODEL    RELATIONSHIP ENGINE
        │                     │
        └──────────┬──────────┘
                   ▼
              EVENT ENGINE
                   │
                   ▼
               REP ENGINE
                   │
                   ▼
            CONFIDENCE ENGINE
                   │
          ┌────────┴────────┐
          ▼                 ▼
 DOG PERFORMANCE      HANDLER PERFORMANCE
          │                 │
          └────────┬────────┘
                   ▼
             TRAINING MEMORY
                   │
                   ▼
       DETERMINISTIC COACHING RULES
                   │
                   ▼
       OPTIONAL LLM/VLM EXPLANATION
                   │
                   ▼
             SPOKEN FEEDBACK
```

The key rule is:

> **Precise CV and deterministic event logic own measurement. An LLM/VLM may explain those measurements, but must not invent the measurements.**

---

# 4. Primary recommended technology stack

## 4.1 Camera and timing

Use native camera stacks through Flutter/native bridges:

- Android: CameraX/native Android camera path.
- iOS: AVFoundation.
- 1080p 30 FPS capture where device thermals permit.
- one monotonic clock shared by camera, audio, IMU, detections, pose, hands, and behavioural events.

Every event should carry at least:

```text
timestamp
targetDogId
source
value
confidence
quality
uncertaintyReason
supportingEvidence
```

Precise synchronization is what makes trainer-timing coaching possible.

---

## 4.2 Dog detection

### Production goal

Train a **dog-specific detector** rather than relying permanently on a generic COCO dog class.

### Primary candidate

**YOLO26-S, custom trained for GDA dogs**, assuming appropriate commercial licensing.

Reasons:

- mature deployment/export ecosystem;
- quantisation support;
- Core ML/mobile support;
- strong custom-training workflow;
- practical real-time behaviour.

### Mandatory challengers

Benchmark against the same GDA dataset and same phones:

1. **D-FINE-N/S** — permissive Apache-2.0, excellent compute/accuracy trade-off.
2. **RF-DETR-N/S** — strong modern detector accuracy, but mobile/NPU behaviour must be proven on target devices.
3. **RTMDet** — existing GDA baseline; do not discard it until the dog-specific benchmark proves a replacement is materially better.

### Do not select from COCO AP alone

The winner must be selected using GDA conditions:

- tiny/giant dogs;
- dachshund/sighthound morphotypes;
- dark dogs on dark backgrounds;
- white dogs in harsh sun;
- long-haired dogs;
- frontal/rear views;
- partial dog visibility;
- handler occlusion;
- multiple dogs;
- motion blur;
- close and far range;
- indoor/outdoor environments.

References:

- YOLO26 docs: https://docs.ultralytics.com/models/yolo26
- D-FINE: https://github.com/Peterande/D-FINE
- RF-DETR: https://github.com/roboflow/rf-detr
- RTMDet / MMDetection: https://github.com/open-mmlab/mmdetection

---

# 5. Dog identity and tracking

The app must maintain lock on the same dog.

## Recommended design

Use a custom lightweight tracker combining:

- OC-SORT-style motion handling;
- ByteTrack-style low-confidence detection recovery;
- dog-specific appearance embeddings for ambiguous/reacquisition cases;
- pose/body-proportion consistency;
- optical-flow prediction;
- camera-motion compensation;
- explicit tracking states such as searching, acquired, tracking, temporarily lost, reacquiring, and lost.

Do **not** run heavy ReID continuously when one dog is clearly tracked.

Trigger ReID when:

- a second dog appears;
- the dog disappears and re-enters;
- two detections overlap;
- identity becomes uncertain;
- reacquisition occurs after occlusion.

A future learned/calibrated association cost may combine:

```text
predicted-motion consistency
+ IoU
+ dog appearance similarity
+ pose/body-proportion consistency
+ colour/texture consistency
```

### Dog-specific ReID

Dog-specific ReID is likely worthwhile for multi-dog scenes and reacquisition. GDA should ultimately own a commercially safe embedding model rather than depend on research-only animal identity weights.

References:

- OC-SORT: https://github.com/noahcao/OC_SORT
- ByteTrack: https://github.com/ifzhang/ByteTrack
- WildlifeTools / animal ReID: https://github.com/WildlifeDatasets/wildlife-tools

---

# 6. High-precision dog pose

## Primary production direction

Train a **custom canine RTMPose-M** model.

Use larger canine ViTPose/SuperAnimal models as teachers, pseudo-labellers, and research baselines where licensing permits.

The key strategic finding is that **dog-specific data is more important than endlessly swapping generic animal pose architectures**.

A 2025/2026 canine smartphone gait study trained ViTPose-L on 20,000 canine images from 374 dogs representing more than 30 breeds and reported 96.6% COCO-style keypoint mAP in a controlled lateral gait setting. This is strong evidence for investing in GDA-specific canine annotation and training.

Reference:

- PubMed canine ViTPose study: https://pubmed.ncbi.nlm.nih.gov/41490686/
- MMPose: https://github.com/open-mmlab/mmpose
- SuperAnimal: https://github.com/DeepLabCut/DeepLabCut

---

# 7. GDA dog skeleton

Do not remain permanently constrained to AP-10K's generic 17 animal joints.

Target approximately **30–32 dog-specific landmarks**, based on training usefulness.

## Head

- nose;
- left/right eye;
- left/right ear base;
- optional ear tips;
- chin;
- head centre/occiput.

## Torso

- neck;
- withers;
- chest/sternum;
- mid-spine;
- pelvis centre;
- tail base;
- tail midpoint;
- tail tip.

## Front limbs, both sides

- shoulder;
- elbow;
- carpus/wrist;
- paw centre.

## Rear limbs, both sides

- hip;
- stifle/knee;
- hock;
- paw centre.

These points permit useful measures including:

- shoulder-to-pelvis/back angle;
- withers/chest/pelvis height;
- limb compression and extension;
- elbow/stifle/hock geometry;
- bilateral paw position;
- head orientation;
- pelvis geometry;
- crooked vs square positions.

The public Dog-Pose 24-point layout is directionally useful, but source data must be licence-audited before commercial training use.

---

# 8. Posture classification

Do **not** make SIT/STAND/DOWN depend on a single rear leg or a single backbone-angle rule.

Backbone angle is useful, but only as one feature.

## Required input features

At minimum consider:

```text
normalized x/y joints
joint confidence
visibility mask
joint velocity
joint acceleration
shoulder-pelvis vector
backbone angle
pelvis height
withers height
chest height
front-leg extension
rear-leg extension
stifle angle
hock angle
elbow angle
paw-ground estimate
body aspect ratio
bounding-box velocity
head orientation
previous posture probabilities
```

## Recommended model

```text
30–32 point canine pose
        ↓
normalisation + visibility mask
        ↓
geometry feature layer
        ↓
1–2 second temporal window
        ↓
causal dilated TCN
        ↓
SIT / STAND / DOWN / OTHER / UNKNOWN
```

Why causal TCN first:

- causal;
- fast;
- quantizable;
- interpretable;
- suited to short temporal windows;
- handles missing-joint masks;
- far cheaper than large video transformers.

ST-GCN variants should be tested next once enough GDA sequence data exists.

RGB video features can be late-fused for ambiguous cases, but should not replace pose as the primary measurement channel.

---

# 9. Temporal action understanding

The system must reason across time, not frames.

Examples include:

- STAND → SIT;
- SIT → DOWN;
- DOWN → STAND;
- STAY → BREAK/RELEASE;
- approach handler;
- move away;
- recall completion;
- heel entry/exit;
- move ahead/lag;
- probable pull;
- reward delivery.

Recommended progression:

1. Causal TCN over pose + geometry + visibility.
2. ST-GCN / graph-temporal models after enough data is available.
3. Late-fused lightweight RGB temporal embedding where pose is insufficient.
4. Large VideoMAE/transformer models primarily as training teachers or cloud/research tools, not the always-on mobile loop.

---

# 10. Rep engine

Rep counting must be deterministic and behaviour-specific, not a frame-level neural output.

Example SIT state machine:

```text
IDLE
  ↓
READY
  ↓ cue / session mode
ARMED
  ↓ verify dog was not already sitting
WAITING_FOR_RESPONSE
  ↓ valid posture transition begins
TRANSITIONING
  ↓ target probability crosses enter threshold
VERIFYING
  ↓ target posture remains stable for dwell period
REP_COMPLETE
  ↓ count once
REFRACTORY
  ↓ dog genuinely exits target state
RESET_READY
```

A valid rep should use:

- cue timestamp where relevant;
- starting posture;
- transition evidence;
- target posture;
- dwell time;
- confidence/quality gates;
- track continuity;
- visibility checks;
- hysteresis;
- refractory period;
- reset criteria.

This engine must explicitly suppress:

- duplicate frames;
- pose jitter;
- temporary tracking glitches;
- dog already in target position;
- incomplete transitions;
- repeated counts before a true reset.

---

# 11. Human pose and hands

## Human pose

Primary mobile choice: **MediaPipe Pose Landmarker**.

Use it for:

- body orientation;
- stepping;
- shoulders/hips;
- arm motion;
- wrist location;
- handler-dog relative position.

RTMPose human models remain a strong challenger if accuracy/consistency exceeds MediaPipe on GDA phone footage.

## Hand tracking

Use a dedicated hand model, initially **MediaPipe Hand Landmarker**.

Whole-body wrist landmarks are insufficient for:

- pointing;
- palm orientation;
- lure trajectory;
- clicker use;
- reward delivery;
- stay/recall hand signals.

Run hand inference lesson-specifically or event-triggered rather than continuously when unnecessary.

Reference:

- MediaPipe: https://github.com/google-ai-edge/mediapipe

---

# 12. Dog-human relationship layer

Do not immediately reach for a huge end-to-end relational transformer.

Start with an explicit geometric relational layer over measured signals.

Represent relationships such as:

- dog left/right/ahead/behind handler;
- dog-handler distance;
- dog facing toward/away from handler;
- dog entering/leaving heel zone;
- hand approaching dog;
- dog approaching reward hand;
- dog jumping toward handler;
- dog/lead/hand attachment geometry.

This layer should consume dog pose, human pose, hands, tracks, and lesson-specific object detections.

Graph neural networks or learned relational models can be added later if the geometric layer's limitations are proven.

---

# 13. Audio architecture

The continuous audio path should be lightweight.

Recommended structure:

```text
16 kHz microphone
      ↓
Silero VAD
      ↓
custom keyword spotting / streaming command recognition
      ↓
optional full ASR when required
```

Primary engineering candidate: **sherpa-onnx** for offline mobile keyword spotting/ASR.

Commands include:

- sit;
- down;
- stay;
- come;
- heel;
- leave it;
- drop;
- yes;
- good;
- no;
- free;
- break.

Whisper-family models can remain available for free-form transcription, notes, or post-session analysis; they should not be the default continuous engine for a small fixed command vocabulary.

Measurable trainer voice features:

- command onset;
- command duration;
- repeated cues;
- inter-cue interval;
- approximate volume/RMS;
- speech/noise ratio;
- marker timing;
- lexical consistency.

Do **not** claim to measure the trainer's emotion, confidence, dominance, or the dog's psychological interpretation of tone unless future research validates such claims.

References:

- sherpa-onnx: https://github.com/k2-fsa/sherpa-onnx
- Silero VAD: https://github.com/snakers4/silero-vad

---

# 14. Audio-visual synchronization

One of GDA's highest-value capabilities is objective timing analysis.

Example:

```text
Cue: SIT             80000 ms
Sit transition       80790 ms
Sit complete         81210 ms
Marker: YES          81395 ms
Reward contact       81840 ms
```

GDA can derive:

- cue-to-response latency;
- transition duration;
- completion-to-marker delay;
- marker-to-reward delay;
- repeated-cue frequency;
- response consistency across sessions.

The system must synchronize speech, dog pose, dog motion, human pose, hand motion, reward events, lead behaviour, and IMU on the same timeline.

---

# 15. Trainer performance analysis

Prioritise feedback that follows directly from measurable events.

Good early trainer feedback includes:

- repeated cue before adequate response time;
- slow/late marker;
- excessive marker-to-reward delay;
- lure hand too high/low relative to dog geometry;
- handler stepping toward dog during cue;
- percentage of reps completed without lure;
- response latency trend;
- cue independence trend;
- heel-zone consistency;
- loose-lead timing trend.

Avoid unsupported claims about emotion, intention, stress, or dominance.

---

# 16. Lead, leash and pulling

This area must remain scientifically honest.

## Vision can estimate

- lead visible/not visible;
- lead slack/taut state;
- approximate lead geometry;
- dog-handler distance;
- dog-handler relative velocity;
- dog position relative to handler;
- duration of tautness;
- dog/handler acceleration proxies.

## Vision cannot reliably measure exact leash force

A visually straight lead does not provide Newtons of force.

A **probable pull** can be inferred from multiple signals:

```text
lead tautness
+ dog-handler separation velocity
+ dog acceleration
+ handler acceleration
+ dog position
+ duration
+ phone IMU / camera-motion estimate
```

For professional force measurement, support an optional future BLE smart-lead module using a load cell + IMU.

Research on canine leash tension uses real force sensors/load cells rather than visual curvature alone.

References:

- https://pubmed.ncbi.nlm.nih.gov/32785117/
- https://pubmed.ncbi.nlm.nih.gov/41499011/

---

# 17. Attention and head direction

Head orientation is realistic when the head landmarks are visible.

Reasonable outputs:

- facing handler;
- facing approximate reward region;
- facing a detected distraction;
- facing away;
- orientation uncertain.

Do not claim exact eye gaze from arbitrary monocular phone footage.

---

# 18. Movement-quality measurements

Realistically achievable with calibrated dog pose + temporal context:

- straight vs crooked sit;
- slow vs fast sit;
- partial sit;
- incomplete/sloppy down indicators;
- creeping during stay;
- breaking position;
- walking ahead/forging;
- lagging;
- heel-zone position;
- turn quality;
- recall speed/latency.

These must be defined as measurable geometric/temporal criteria rather than vague trainer-language labels.

---

# 19. Camera Coach / intelligent framing

Input quality is part of the validity contract.

Before scoring a behaviour, determine whether required evidence exists:

```text
dog coverage        OK / BAD
paws visible        YES / NO
head visible        YES / NO
handler visible     YES / NO
lead visible        YES / NO
blur                OK / BAD
lighting            OK / BAD
occlusion            OK / BAD
pose uncertainty     OK / BAD
```

Then provide deterministic guidance such as:

- "Move back slightly."
- "I need to see Max's paws."
- "Point the phone a little lower."
- "Move into better light."
- "Place the phone so I can see both you and Max."

Do not process obviously invalid input and then pretend confidence alone will rescue the result.

---

# 20. Confidence, calibration and UNKNOWN

GDA must never pretend it knows something when it does not.

Combine:

- calibrated class probabilities;
- weakest-joint / pose quality;
- visibility;
- tracking confidence;
- temporal agreement;
- detector evidence;
- out-of-distribution signals;
- conformal/abstention thresholds where useful;
- contradictory-signal checks.

Output hierarchy:

```text
HIGH CONFIDENCE
MEDIUM CONFIDENCE
LOW CONFIDENCE
UNKNOWN
```

Report both accuracy and **coverage**.

For example, 98.5% posture precision at 92% coverage with 8% UNKNOWN may be substantially better for Camera Coach than 93% precision at 100% coverage.

---

# 21. Mobile inference architecture

## Android

Preferred long-term production direction: **LiteRT**, with per-model benchmarking against ExecuTorch, ONNX Runtime/QNN, ncnn, or MNN where they offer materially better hardware use.

The current ONNX Runtime path remains valuable for QA, interoperability, and migration. Do not remove it merely because another runtime is preferred long-term.

## iOS

Prefer **Core ML directly** for supported production models so the system can exploit CPU/GPU/Neural Engine placement efficiently.

## Application layer

Flutter remains appropriate for product/UI/business logic.

Performance-critical camera/inference components should be behind stable native/C++ interfaces so models/runtimes can be replaced without rewriting the product.

References:

- LiteRT: https://github.com/google-ai-edge/LiteRT
- ExecuTorch: https://github.com/pytorch/executorch
- ONNX Runtime: https://github.com/microsoft/onnxruntime
- ncnn: https://github.com/Tencent/ncnn
- MNN: https://github.com/alibaba/MNN
- Core ML: https://developer.apple.com/documentation/coreml

---

# 22. Multi-rate scheduler

Do not run every model on every frame.

Starting scheduler target:

| Function | Initial rate |
|---|---:|
| Camera | 30 FPS |
| Cheap track prediction | 30 Hz |
| Dog detector | 6–10 Hz |
| Dog pose | 12–20 Hz |
| Temporal posture update | 10–20 Hz |
| Human pose | 8–15 Hz |
| Hands | 10–20 Hz only when relevant |
| Lead segmentation | 3–5 Hz during lead lessons |
| ReID | uncertainty-triggered or ~1–2 Hz when needed |
| Depth | on demand |
| VLM | never in normal low-level real-time loop |
| Audio KWS | continuous |

Interpolate/predict between expensive detector updates.

Every performance benchmark must measure sustained operation, not just cold latency.

Required mobile metrics:

- P50 latency;
- P95 latency;
- 10-minute and 30-minute latency;
- RAM;
- storage;
- thermal throttling;
- device temperature;
- battery drain;
- dropped frames;
- model fallback behaviour.

---

# 23. Edge vs cloud

Recommended commercial architecture: **mostly on-device + optional cloud intelligence**.

On-device should own:

- detection;
- tracking;
- dog pose;
- human pose;
- hands;
- keyword commands;
- temporal posture/action;
- rep counting;
- immediate feedback;
- safety/UNKNOWN handling.

Cloud may add:

- model training;
- difficult-clip review with consent;
- optional high-level VLM reasoning;
- session summaries;
- long-term model improvement;
- heavier research inference.

Core training should continue to work offline and should not depend on cloud latency.

---

# 24. VLM / LLM role

## Useful roles

A VLM/LLM may:

- explain measured events;
- generate concise coaching language;
- review selected difficult clips;
- describe environmental context;
- identify candidate distractions;
- summarise a session;
- help build future lesson plans from structured memory.

## It must not own low-level ground truth

Do not let a VLM decide directly:

- exact rep number;
- exact sit completion timestamp;
- exact keypoint geometry;
- target dog identity;
- exact leash force;
- whether a paw was a few centimetres ahead;
- whether a state-machine transition occurred.

The safe pattern is:

```text
measured structured facts
        ↓
deterministic interpretation
        ↓
optional LLM explanation
```

---

# 25. Training memory

Store structured per-dog and per-handler performance facts rather than a single vague mastery score.

For each behaviour retain distributions for:

- attempts;
- successful attempts;
- independent successes;
- response latency;
- cue count;
- lure usage;
- prompt level;
- position quality;
- duration;
- distraction context;
- marker latency;
- reward latency;
- confidence;
- failure reason.

Example future record:

```text
Behaviour: SIT
Success:               91%
Independent success:   76%
Median response:       0.84 s
P90 response:          1.65 s
Repeated cues:         12%
Lure required:          8%
Median marker delay:   0.24 s
Novel environment:     63%
Home environment:      96%
```

Future lesson adaptation should be based on this evidence, not a single opaque score.

---

# 26. Personalisation

Begin with safe, lightweight per-dog calibration rather than a fully separate neural network per dog.

Personalise:

- skeletal proportions;
- typical sit/stand/down geometry;
- target-dog ReID embedding;
- posture thresholds;
- transition duration priors;
- uncertainty calibration;
- typical response speed.

Only explore per-dog adapters or fine-tuned neural models after evidence shows that calibration alone is insufficient.

---

# 27. Data strategy

Public datasets are bootstrap material. They will not cover GDA's real edge cases adequately.

The production system ultimately needs a GDA-owned dataset covering:

- toy, small, medium, large, giant dogs;
- dachshunds/long-backed dogs;
- sighthounds;
- brachycephalic dogs;
- long-haired and curly-coated dogs;
- dark/light/multicolour coats;
- puppies, adults, seniors;
- indoor and outdoor environments;
- floor/grass/gravel surfaces;
- bright sun, shade, low light;
- camera high/low/side/front/rear views;
- close/far framing;
- adult/child/varied handlers;
- partial occlusion;
- multiple dogs;
- correct and incorrect behaviours;
- incomplete transitions;
- tracking loss/reacquisition;
- lead visible/hidden/slack/taut;
- rewards and lures;
- motion blur and camera shake.

## Approximate planning scale

Dog detector:
- initial 10k–20k frames;
- professional 50k+ difficult/diverse frames.

Dog pose:
- initial 8k–15k high-quality annotated frames;
- professional 25k–60k+.

Posture:
- 50k–150k labelled temporal windows.

Rep events:
- roughly 10k–30k genuine repetitions including failures and edge cases.

Heel/lead:
- tens to hundreds of hours over time.

These are planning ranges, not guarantees of accuracy.

---

# 28. Dataset split rules

Never randomly split frames from the same video across training and test.

Final evaluation should be:

- dog-disjoint;
- session-disjoint;
- preferably household-disjoint;
- preferably handler-disjoint;
- environment-disjoint where practical.

Always report morphotype slices, including:

- dachshund/long-backed;
- sighthound;
- toy;
- giant;
- brachycephalic;
- long coat;
- curly coat;
- black/dark coat;
- white/light coat.

This prevents GDA from appearing accurate merely because it memorised dogs, rooms, or handlers.

---

# 29. Annotation strategy

Primary annotation platform: **CVAT Community**.

Add a GDA-specific synchronized timeline annotation layer when temporal training becomes central.

Annotate as needed:

- bounding boxes;
- dog identity tracks;
- canine keypoints;
- human keypoints;
- hand events;
- thin lead masks/polylines;
- objects;
- posture intervals;
- action intervals;
- cue timestamps;
- marker timestamps;
- reward-contact timestamps;
- release events;
- rep boundaries;
- handler-dog relational states;
- measured load-cell tension when available.

Reference:

- CVAT: https://github.com/cvat-ai/cvat

---

# 30. Active learning

Production uncertainty should eventually improve the model rather than merely frustrate the user.

With explicit user permission:

```text
uncertain event
    ↓
retain short diagnostic clip
    ↓
privacy/consent filter
    ↓
annotation queue
    ↓
hard-negative / uncertainty sampling
    ↓
retrain
    ↓
benchmark against frozen test sets
    ↓
controlled model release
```

Never train blindly on self-labelled production predictions.

---

# 31. Useful datasets / research sources

## AP-10K

- 10,015 images;
- 17 animal keypoints;
- 54 species;
- CC-BY-4.0.

https://github.com/AlexTheBad/AP-10K

## Dog-Pose

- 8,476 images;
- 24 dog keypoints;
- useful skeleton inspiration;
- source imagery is marked research-only and must not be assumed commercially safe.

https://docs.ultralytics.com/datasets/pose/dog-pose/

## SuperAnimal / DeepLabCut

Broad quadruped priors and useful teacher/pseudo-labelling workflows.

https://github.com/DeepLabCut/DeepLabCut

## InterPet4D

- synchronized human-dog interaction research;
- millions of frames;
- human motion, dog skeleton, hands, audio;
- published dataset is CC-BY-NC-4.0 and therefore not a commercial GDA production training source.

https://huggingface.co/datasets/ohicarip/interpet4d

## DogMo / 3DDogs / AniMer

Useful for future canine 3D/motion research.

- DogMo: https://arxiv.org/abs/2510.24117
- 3DDogs: https://arxiv.org/abs/2406.14412
- AniMer CVPR 2025: https://openaccess.thecvf.com/content/CVPR2025/html/Lyu_AniMer_Animal_Pose_and_Shape_Estimation_Using_Family_Aware_Transformer_CVPR_2025_paper.html

---

# 32. Scientific validity ladder

## PROVEN

- dog/person detection;
- 2D canine pose;
- human pose;
- hand landmarks;
- speech command recognition;
- object tracking;
- synchronized event timestamps;
- lead-force sensors;
- pose-derived movement measurement.

## SUPPORTED BY RESEARCH

- high-accuracy dog-specific pose;
- canine gait measurement;
- marker/reward timing measurement;
- individual-animal visual ReID;
- temporal skeleton action recognition.

## ENGINEERINGALLY PLAUSIBLE

- >97% SIT/STAND/DOWN precision under defined supported conditions with abstention;
- accurate dog rep counting;
- heel-position measurement;
- repeated-cue detection;
- marker timing coaching;
- reward timing inference;
- visual slack/taut lead classification;
- individual-dog calibration.

## EXPERIMENTAL

- robust real-time monocular canine 3D in arbitrary environments;
- completely learned human-dog scene graphs;
- large action transformers running continuously on ordinary phones;
- on-device multimodal LLM analysing every frame.

## SPECULATIVE / UNRELIABLE

- exact dog eye gaze from arbitrary phone video;
- emotion/stress inferred reliably from appearance alone;
- exact leash force from video alone;
- psychological interpretation of trainer tone;
- VLM-only rep scoring.

Do not market speculative capabilities as measurements.

---

# 33. Professional benchmark targets

These are mature-system engineering targets for **defined supported conditions**, not claims about the current app.

| Capability | Mature target |
|---|---:|
| Dog detection recall | ≥99% |
| Dog detection precision | ≥98% |
| SIT precision | 97–99% |
| SIT recall | 95–98% |
| STAND precision | 97–99% |
| STAND recall | 94–98% |
| DOWN precision | 97–99% |
| DOWN recall | 95–98% |
| Rep precision | ≥99% |
| Rep recall | 97–99% |
| False rep rate | <0.5–1% |
| Stay-break detection | 95–99% when observable |
| Recall completion | 95–99% when start/end observable |
| Heel-position classification | ~90–97% |
| Loose-lead visual classification | ~85–95% |
| Visual-only probable-pull inference | ~80–93% |
| Pull event with real force sensor | potentially >97% |
| Hand-signal recognition | ~90–97% controlled |
| Reward-delivery inference | ~85–95% |
| Cue timestamp median error | ~50–100 ms target |
| Visual completion median timestamp error | ~80–150 ms target |
| P95 synchronized event error | <200–250 ms target |
| Rep reporting latency | ~200–400 ms after stable completion |

Every result must also report UNKNOWN/abstention coverage and difficult-condition slices.

---

# 34. Mobile performance targets and expectations

Approximate planning targets after optimization on modern flagship phones:

- camera preview: 30 FPS;
- dog detector: ~10–30 ms per inference;
- dog pose: ~5–15 ms;
- temporal model: generally <2 ms;
- human pose: ~5–20 ms;
- hands: ~5–15 ms;
- occasional lead segmentation: ~10–35 ms;
- quantized total model bundle: aim ~80–200 MB;
- incremental inference working set: aim roughly ~300–600 MB, device/runtime dependent.

Battery planning range:

- flagship roughly ~12–25% per hour;
- midrange roughly ~18–35% per hour;

These are planning estimates only. Real GDA device benchmarks override them.

Do not advertise latency based on desktop GPU or one-minute cold runs.

---

# 35. What is pretrained vs custom

## Available pretrained as baselines

- generic dog detection;
- RTMPose AP-10K;
- MediaPipe human pose;
- MediaPipe hands;
- Silero VAD;
- generic streaming ASR/KWS;
- optical flow;
- generic segmentation;
- generic monocular depth.

## Fine-tuning required

- dog detector;
- canine pose;
- dog-training keyword recognition where generic ASR is insufficient;
- dog ReID.

## Custom GDA dataset definitely required

- SIT/STAND/DOWN temporal classification;
- rep calibration;
- stay/release;
- recall;
- heel;
- loose lead;
- probable pulling;
- trainer-hand interactions;
- reward delivery;
- training-specific gestures;
- camera-quality thresholds;
- uncertainty calibration.

## New research / long-term R&D

- robust arbitrary-view canine 3D;
- exact gaze;
- visual-only leash force;
- general professional-training interpretation from raw video without structured measurements.

---

# 36. Development roadmap

## PHASE 1 — Strong dog detector + dog-specific pose

Work:

- freeze a GDA dog benchmark;
- benchmark current RTMDet baseline;
- train/benchmark dog-specific detector candidates;
- define 30–32 point GDA skeleton;
- annotate dog pose data;
- train canine RTMPose;
- add pose-quality scoring.

Success criteria:

- detector recall ≥99% in supported conditions;
- detector precision ≥98%;
- no severe morphotype collapse;
- per-joint pose metrics;
- dog-disjoint test evaluation;
- real-phone latency/thermal evidence.

## PHASE 2 — Temporal posture

Work:

- synchronized pose history;
- geometry features;
- causal TCN;
- calibrated SIT/STAND/DOWN/OTHER/UNKNOWN;
- whole-body evidence rather than single-joint heuristics.

Success:

- posture precision ≥97%;
- recall ≥95%;
- low calibration error;
- meaningful UNKNOWN rejection;
- unseen-dog testing.

## PHASE 3 — Reliable rep detection

Work:

- behaviour-aware finite-state machines;
- cue preconditions;
- transition detection;
- dwell;
- hysteresis;
- refractory/reset logic;
- duplicate suppression.

Success:

- <1% false reps;
- <2–3% missed reps under supported conditions;
- zero duplicate counts from simple posture jitter.

## PHASE 4 — Human pose + audio

Work:

- MediaPipe human pose;
- hands;
- VAD;
- command/marker keyword spotting;
- shared timeline.

Success:

- synchronized cue/event timing P95 approximately ≤200–250 ms with documented error sources.

## PHASE 5 — Trainer performance

Add:

- repeated-cue detection;
- cue-response latency;
- behaviour-marker latency;
- marker-reward latency;
- lure trajectory;
- handler stepping;
- hand-signal consistency.

## PHASE 6 — Lead / heel analysis

Add:

- thin lead segmentation;
- dog-handler coordinate frame;
- heel zone;
- slack/taut state;
- probable-pull fusion;
- optional future BLE load-cell lead.

## PHASE 7 — Personalised dog model

Add:

- body-proportion profile;
- dog-specific posture calibration;
- ReID embedding;
- timing priors;
- personalized thresholds and uncertainty.

## PHASE 8 — Advanced training intelligence

Extend shared perception to:

- stay;
- recall;
- heel;
- place/mat;
- leave it;
- drop;
- wait/door manners;
- crate training;
- jumping prevention;
- barking/reactivity research;
- distraction response;
- tricks/agility;
- gait/rehabilitation.

Most later behaviours should reuse the same core perception system and mainly add lesson-specific temporal/event logic.

---

# 37. The next 10 engineering tasks — authoritative order

Unless a direct owner instruction or verified blocker overrides it, engineering should advance these in order of dependency.

| Rank | Task | Accuracy impact | Product impact | Risk |
|---|---|---:|---:|---:|
| **1** | Freeze a real GDA dog-perception benchmark and baseline current Model A | Extreme | Extreme | Low |
| **2** | Fine-tune and benchmark a dog-specific detector | Extreme | Extreme | Medium |
| **3** | Define GDA 30–32 point skeleton and train dog-specific RTMPose | Extreme | Extreme | Medium-high |
| **4** | Build synchronized temporal evidence recorder + annotation format | Very high | High | Low |
| **5** | Replace rule-dominant posture with causal whole-body temporal classifier | Extreme | Extreme | Medium |
| **6** | Implement behaviour-aware rep state machines | Very high | Extreme | Medium |
| **7** | Build calibration/OOD/UNKNOWN engine | Very high | Very high | Medium |
| **8** | Add human pose + dedicated hands | High | Very high | Low-medium |
| **9** | Add synchronized on-device cue/marker keyword spotting | High | Extreme | Medium |
| **10** | Add relational handler coaching, then lead/tension research | High | Very high | High |

### Immediate engineering direction

**Do not spend the next major engineering cycle adding more one-off SIT heuristics.**

Backbone angle, rear-leg fold, torso height, and similar geometry remain useful features, but they belong inside a validated whole-body temporal system.

The immediate path is:

```text
GDA benchmark
    ↓
dog-specific detector
    ↓
dog-specific 30–32 point pose
    ↓
whole-body temporal posture
    ↓
rep state machine
    ↓
handler/audio timing
```

That is the shortest path from the current Camera Coach toward a professional dog-training perception system.

---

# 38. Work-gating rule to stop random jobs

Before starting any substantial task, classify it as one of:

**A. Roadmap work** — directly advances one of the eight phases or ten ranked tasks.  
**B. Verified defect** — fixes a real regression/bug preventing reliable use or measurement.  
**C. Test/build/release infrastructure** — required to prove or deliver roadmap work.  
**D. Owner-directed exception** — Roger explicitly wants it done now.

If it is none of A–D, do not implement it merely because it is interesting, fashionable, or convenient.

For every completed task, report:

- roadmap phase/task advanced;
- evidence gathered;
- metric affected;
- tests run;
- remaining uncertainty;
- recommended next dependency.

---

# 39. What success ultimately looks like

The final target is not:

> "Dog sat."

It is a system that can reach evidence-backed conclusions such as:

> "Max completed the sit correctly. The handler repeated the verbal cue before Max had enough time to respond, then marked the behaviour 1.3 seconds late. Next repetition: give the cue once, wait, and mark immediately when the sit is completed."

The structured system—not an unconstrained language model—must establish the facts behind that statement.

Good Dog Academy succeeds when it can watch dog and handler together, understand both over time, recognize valid and invalid repetitions, measure technique and timing, maintain identity and confidence, remember progress, adapt training, and provide useful coaching without pretending certainty it does not have.

That is the product every future engineering decision should serve.
