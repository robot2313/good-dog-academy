# Good Dog Academy — Floot → Expo Production Migration Matrix

## Goal

Move the validated adaptive-training intelligence built in the Floot prototype into the authoritative Expo / React Native production app without turning the migration into a web-to-mobile rewrite.

The Expo repository remains the production source of truth. Floot remains the prototyping and product-lab environment.

## Production principles

1. Port deterministic domain logic first.
2. Hide platform APIs behind adapters.
3. Preserve the richer existing Expo curriculum/troubleshooter content.
4. Rebuild web UI as React Native UI; do not copy browser page code wholesale.
5. Keep uncertain automatic evidence owner-correctable.
6. Safety and welfare logic outranks progression logic.
7. No public/commercial release until the dog-pose model/data licensing question is resolved.

---

# 1. Migration categories

## A — Portable TypeScript: port with minimal adaptation

These modules should move into `src/domain/` or `src/services/` with tests largely preserved.

| Floot feature/module | Expo destination | Migration notes | Priority |
|---|---|---|---|
| Training skill model / dimensions | `src/domain/models/` | Pure domain types and scoring | P0 |
| TrainingState | `src/state/` + `src/domain/models/` | Remove direct browser storage; inject repositories | P0 |
| TrainingPlan | `src/domain/training/` | Preserve source precedence: safety > incident > retention > evidence > profile > baseline | P0 |
| Lesson difficulty profiles | `src/domain/training/` | Pure logic | P0 |
| Rep failure diagnosis | `src/domain/training/` | Pure deterministic logic | P0 |
| Session fatigue intelligence | `src/domain/training/` | Pure deterministic logic | P0 |
| Session ending | `src/domain/training/` | Pure logic; keep stress/fatigue end reasons | P0 |
| Autonomous Session Director | `src/domain/training/` | Pure orchestration logic | P0 |
| Tomorrow plan | `src/domain/training/` | Pure logic | P0 |
| Session memory summary | `src/domain/training/` | Pure logic | P0 |
| Owner coaching model | `src/domain/training/` | Pure logic | P0 |
| AI Trainer Debrief | `src/domain/training/` | Keep evidence-backed deterministic output | P0 |
| Session Trend Intelligence | `src/domain/analytics/` | Pure analytics | P1 |
| Behaviour Intelligence | `src/domain/behaviour/` | Fits existing Expo domain structure well | P1 |
| Learning Passport | `src/domain/analytics/` | Port scoring/reliability logic | P1 |
| Weekly Trainer Review | `src/domain/analytics/` | Reuse Expo progress repositories | P1 |
| Adaptive lesson switching | `src/domain/training/` | Replace localStorage override with repository | P1 |
| Adaptive 7-day training program | `src/domain/training/` | Pure program generation; feed from repositories | P1 |
| Incident lifecycle | `src/domain/behaviour/` | Merge with existing Expo behaviour branch logic where overlapping | P1 |
| Retention scheduler | `src/domain/training/` | Pure logic | P1 |
| Training environment plan | `src/domain/training/` | Pure logic | P1 |
| Production lesson catalogue mapping | `src/data/` / existing curriculum | Do not replace richer Expo lesson content | P1 |
| Camera evidence labels | `src/domain/camera/` | Pure evidence semantics | P1 |
| Multimodal evidence fusion | `src/domain/camera/` | Remove browser API dependencies | P1 |
| Camera spoken-coach decision logic | `src/domain/camera/` | Keep line-selection logic; replace speech output layer | P1 |
| Pose cue evaluator | `src/domain/camera/` | Pure evaluator only; model runtime separate | P1 |
| Visual stress safeguard logic | `src/domain/camera/` | Conservative threshold/evidence semantics only | P1 |

---

## B — Storage adapters: port logic, replace browser persistence

Current Floot code uses `localStorage`. Expo already includes AsyncStorage and has repository/storage structure.

Create repository contracts first, then implement AsyncStorage-backed adapters.

Recommended contracts:

```ts
export interface TrainingStateRepository {
  load(dogId: string): Promise<TrainingState>;
  save(state: TrainingState): Promise<void>;
}

export interface SessionHistoryRepository {
  list(dogId: string): Promise<TrainingSessionRecord[]>;
  append(record: TrainingSessionRecord): Promise<void>;
  replace(record: TrainingSessionRecord): Promise<void>;
}

export interface AdaptiveLessonOverrideRepository {
  get(dogId: string): Promise<AdaptiveLessonOverride | null>;
  set(dogId: string, value: AdaptiveLessonOverride): Promise<void>;
  consume(dogId: string): Promise<AdaptiveLessonOverride | null>;
}
```

Storage migration targets:

| Floot storage | Expo replacement |
|---|---|
| `localStorage` dog training memory | AsyncStorage repository |
| `localStorage` session history | AsyncStorage repository, schema-versioned |
| `localStorage` adaptive lesson override | AsyncStorage repository |
| `localStorage` dog identity | existing Expo identity/profile repository |
| browser timestamps | injected clock service |

Requirements:

- schema version for every stored aggregate
- deterministic migration functions
- validation on load
- transaction-like write order for session commits
- stable dog IDs, not dog names, for all new records
- append-only session history where possible

---

# 2. Evidence provenance — mandatory before camera automation is trusted

Add structured evidence directly to each training rep.

Recommended model:

```ts
export type EvidenceSource =
  | 'owner_confirmed'
  | 'camera_auto'
  | 'voice_auto'
  | 'multimodal_auto';

export interface RepEvidence {
  source: EvidenceSource;
  confidence?: number;
  cueAt?: number;
  responseAt?: number;
  markerAt?: number;
  rewardAt?: number;
  cueCount?: number;
  signal?: string;
  posture?: 'stand_like' | 'sit_like' | 'down_like' | 'unknown';
  poseConfidence?: number;
}

export interface EvidenceCorrection {
  correctedAt: number;
  originalOutcome: string;
  correctedOutcome: string;
  reason?: string;
}
```

Rules:

- Keep original machine evidence.
- Owner correction supersedes the interpretation used for skill-state mutation.
- Never create a fake second rep for a correction.
- Skill state must not silently mutate from low-confidence automatic evidence.
- UI must expose "What I saw/heard" and "That’s wrong" after auto-scoring.

This is P0 and should be completed before the full native camera pipeline.

---

# 3. Native platform adapters

## Camera

Floot prototype:
- `navigator.mediaDevices.getUserMedia`
- HTML video element

Expo production:
- native Expo-compatible camera layer
- frame processing abstraction
- permission handling
- orientation handling
- front/back camera selection
- physical-device diagnostics

Create:

```ts
export interface CameraFrameSource {
  start(): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: (frame: CameraFrame) => void): () => void;
}
```

## Speech recognition

Floot prototype:
- `window.SpeechRecognition`
- `webkitSpeechRecognition`

Expo production:
- native-compatible recognition provider behind interface

```ts
export interface TrainingSpeechRecognizer {
  start(options: RecognitionOptions): Promise<void>;
  stop(): Promise<void>;
  onFinalTranscript(listener: (event: TranscriptEvent) => void): () => void;
}
```

Requirements:
- AU English default but configurable
- final/interim distinction
- timestamp every final transcript
- clear unavailable/error states
- no silent fallback that pretends listening is active

## Text-to-speech

Floot prototype:
- `window.speechSynthesis`

Expo production:
- `expo-speech` or equivalent native adapter

Keep existing spoken-coach priority/dedupe rules in pure domain code.

## Vision inference

Floot prototype:
- TensorFlow.js + COCO-SSD
- ONNX quadruped-pose model in browser

Expo production:
- native/on-device inference adapter
- model lifecycle and warm-up control
- frame throttling
- confidence thresholds
- telemetry for inference latency

Do not lock domain code to one ML runtime.

```ts
export interface DogVisionEngine {
  detect(frame: CameraFrame): Promise<DogVisionResult>;
}
```

---

# 4. Release blocker — quadruped pose model licensing

Current prototype model:
- `EstevanSL/snapml-quadruped-pose`
- repository license appears permissive
- training-data / AP-10K commercial-use status is not sufficiently clear for production release

Before paid/public launch:

1. verify model weights licensing;
2. verify training-data commercial-use rights;
3. document the result in-repo;
4. if rights are unclear, replace or retrain using clearly licensed data/model assets;
5. do not ship commercial Camera Coach pose scoring until this is resolved.

Prototype experimentation may continue meanwhile.

---

# 5. React Native UI rebuild map

Do not port Floot JSX/CSS directly.

Rebuild the following as native screens/components using existing Expo theme/navigation.

| Floot page | Expo screen | Notes |
|---|---|---|
| Camera Coach | `CameraCoachScreen` | Native camera preview + overlays + director card + correction UI |
| Learning Passport | `LearningPassportScreen` | Use existing app typography/cards |
| Training History | `TrainingHistoryScreen` | Virtualised list; skill filters |
| Behaviour Timeline | `BehaviourTimelineScreen` | Sessions + incidents + warnings |
| Adaptive 7-Day Program | `AdaptiveProgramScreen` | 7-day schedule + readiness state |
| Weekly Review | existing/expanded weekly review screen | Merge rather than duplicate |
| Live Coach | existing Live Coach flow | Add new deterministic session director and provenance |

Shared native components to create:

- `EvidenceConfidenceBadge`
- `EvidenceCorrectionSheet`
- `CoachInstructionCard`
- `SessionDirectorCard`
- `DifficultyVectorBadge`
- `TrainingTrendCard`
- `EarlyWarningCard`
- `SessionDebriefCard`
- `CameraDiagnosticsOverlay`

---

# 6. Preserve from the existing Expo app

Do not regress these production assets while porting:

- current Expo SDK 54 architecture
- AsyncStorage repository pattern
- current navigation and safe-area handling
- 60 immutable reward-based curriculum lessons
- existing guided lesson sessions
- richer 13-topic / 39-branch Help Me Now troubleshooter
- current progress/history semantics
- existing onboarding and behaviour assessment
- physical-device release gates
- existing tests and schema validation

Where Floot has a simpler equivalent, Expo wins.

---

# 7. Prototype-only browser code to leave behind

Do not port these directly:

- `window.localStorage`
- `window.speechSynthesis`
- browser `SpeechRecognition`
- `navigator.mediaDevices.getUserMedia`
- HTML `<video>` / DOM overlays
- CDN-loaded TensorFlow.js
- CDN-loaded COCO-SSD
- browser script injection
- browser-specific CSS modules
- browser history navigation

Port the behaviour, not the browser implementation.

---

# 8. Recommended Expo folder layout for the new intelligence

```text
src/
  domain/
    camera/
      cameraEvidence.ts
      multimodalEvidence.ts
      poseCueEvaluator.ts
      spokenCoachPolicy.ts
      stressSafeguard.ts
      evidenceProvenance.ts
    training/
      trainingState.ts
      trainingPlan.ts
      lessonDifficultyProfile.ts
      repFailureDiagnosis.ts
      sessionFatigue.ts
      sessionEnding.ts
      autonomousSessionDirector.ts
      tomorrowPlan.ts
      ownerCoachModel.ts
      adaptiveLessonSwitch.ts
      adaptiveTrainingProgram.ts
    analytics/
      sessionDebrief.ts
      sessionTrendIntelligence.ts
      learningPassport.ts
      weeklyTrainerReview.ts
    behaviour/
      behaviourIntelligence.ts
      incidentLifecycle.ts
      retentionScheduler.ts
  services/
    camera/
      CameraFrameSource.ts
      NativeCameraFrameSource.ts
    vision/
      DogVisionEngine.ts
      NativeDogVisionEngine.ts
    speech/
      TrainingSpeechRecognizer.ts
      NativeSpeechRecognizer.ts
      CoachSpeech.ts
    time/
      Clock.ts
  storage/
    repositories/
      trainingStateRepository.ts
      sessionHistoryRepository.ts
      adaptiveLessonOverrideRepository.ts
  screens/
    CameraCoachScreen.tsx
    LearningPassportScreen.tsx
    TrainingHistoryScreen.tsx
    BehaviourTimelineScreen.tsx
    AdaptiveProgramScreen.tsx
```

---

# 9. Migration execution order

## Phase 0 — Safety net

1. Work only on `feature/adaptive-training-port`.
2. Keep `main` untouched until tested.
3. Add migration-focused Jest suites before changing production screens.
4. Capture baseline `npm test` and `npm run typecheck` results.

## Phase 1 — Domain foundation (P0)

Port:

1. training state types
2. difficulty profiles
3. rep diagnosis
4. fatigue
5. session ending
6. autonomous session director
7. tomorrow plan
8. owner coach model
9. session debrief
10. evidence provenance model

Exit criteria:
- no React imports in domain modules
- no platform/browser APIs in domain modules
- deterministic unit tests passing

## Phase 2 — Persistence

1. AsyncStorage session-history repository
2. adaptive lesson override repository
3. schema migrations
4. stable dog ID migration
5. atomic session commit flow

Exit criteria:
- restart app and history survives
- corrupted data safely rejected/migrated
- corrections persist and supersede machine outcomes

## Phase 3 — Longitudinal intelligence

Port:

1. session trends
2. Learning Passport
3. behaviour intelligence
4. weekly trainer review
5. automatic lesson switching
6. adaptive 7-day program

Exit criteria:
- all outputs derived from repositories
- no localStorage/browser assumptions
- safety precedence tests pass

## Phase 4 — React Native screens

Build native UI for:

1. Passport
2. Training History
3. Behaviour Timeline
4. Adaptive Program
5. session debrief surfaces

Exit criteria:
- Expo Go/dev build renders all screens
- accessibility labels and large touch targets
- no browser-only styles/components

## Phase 5 — Native speech + TTS

1. Coach speech adapter
2. speech-recognition adapter
3. cue detection timestamps
4. marker/reward timing integration
5. spoken coach priority/dedupe logic

Exit criteria:
- physical Android test
- physical iPhone test
- unavailable speech recognition fails visibly and safely

## Phase 6 — Native Camera Coach

1. camera preview
2. dog/person detection
3. frame history/tracking
4. pose runtime
5. cue/vision fusion
6. stress safeguard
7. autonomous director integration
8. evidence provenance + owner correction

Exit criteria:
- one complete hands-free session on-device
- no browser code involved
- every auto score has source/confidence
- owner can correct auto score
- session persists, debrief generates, next plan changes

## Phase 7 — Diagnostics and hardening

Add hidden diagnostics mode:

- camera FPS
- inference FPS
- dog confidence
- person confidence
- pose confidence
- speech state
- current cue
- cue/response/marker timestamps
- inference latency
- dropped-frame count
- thermal/battery warning where available
- latest automatic decision
- evidence source/confidence

Exit criteria:
- logs can explain a bad automatic score
- low-confidence evidence never silently changes skill state

## Phase 8 — Real-dog QA

Test matrix:

- small / medium / large dogs
- light / dark coats
- long / short coats
- standing / sitting / lying
- bright / dim lighting
- indoor / outdoor
- dog near / far
- partial occlusion
- multiple people
- two dogs
- quiet / noisy environment
- different owner accents/speeds

Measure:

- false-positive rate
- missed-event rate
- inference latency
- speech cue-detection accuracy
- correction rate
- crash rate
- battery/thermal behaviour

## Phase 9 — Trainer review

Qualified reward-based trainer reviews:

- progression rules
- recovery rules
- stress wording
- reactivity wording
- puppy handling
- owner-coaching advice
- escalation rules

## Phase 10 — Private beta

10–20 dog owners.

Track:

- onboarding completion
- first Camera Coach completion
- auto-score correction rate
- sessions/user/week
- D1 / D7 / D14 return
- Camera Coach failures/crashes
- recommendation follow-through

Success criterion is repeat use, not survey enthusiasm alone.

---

# 10. Definition of the first production milestone

The first production milestone is complete only when a real physical phone can run this full loop inside the Expo app:

1. Camera starts.
2. App hears one training cue.
3. App sees the dog’s response.
4. App creates structured evidence with source + confidence.
5. App scores the rep or asks for owner confirmation if confidence is insufficient.
6. App gives spoken next-step coaching.
7. Session Director changes/holds/eases progression correctly.
8. Session ends appropriately.
9. Evidence is persisted with AsyncStorage repositories.
10. AI Trainer Debrief is generated from deterministic evidence.
11. Learning Passport / history / trends update.
12. Tomorrow’s Training Plan changes when evidence warrants it.
13. Owner can correct a machine-scored rep without creating a fake second rep.

Until this loop is reliable on physical devices, new major feature work should remain frozen.

---

# 11. Immediate implementation slice

The first code slice after this document should be intentionally small:

1. Add `RepEvidence` and `EvidenceCorrection` domain types.
2. Extend the Expo session/rep model to carry them.
3. Add repository-safe serialization and migration.
4. Add correction semantics and tests.
5. Port `repFailureDiagnosis`, `sessionFatigueIntelligence`, `sessionEnding`, and `autonomousSessionDirector`.
6. Run full Expo tests/typecheck before any native camera dependency is added.

This gives the production app the correct data contract before the difficult native-camera work starts.
