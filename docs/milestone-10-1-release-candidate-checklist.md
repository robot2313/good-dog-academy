# Milestone 10.1 — Release Candidate Checklist

## Goal

Turn commit `0748023` on `feature/milestone-10-release-readiness` into a signed, device-tested release candidate with complete public privacy and store-listing materials. This milestone does not add product features.

## Release identity — do not change

- App name: Good Dog Academy
- Version: `1.0.0`
- iOS bundle identifier: `com.robot2313.gooddogacademy`
- Android package: `com.robot2313.gooddogacademy`
- URL scheme: `gooddogacademy`
- Privacy contact: `GoodDogAcademy1@gmail.com`
- Expo project: `@gooddogacademys/gooddogacademy`
- Expo project ID: `085b689a-4b6b-469b-adbc-7db326b1a3fe`

## Gate 1 — source and tooling health

- [x] Release branch pushed to GitHub at `0748023`
- [x] TypeScript passed
- [x] Full Jest suite passed: 70 suites, 483 tests
- [x] Git whitespace check passed
- [x] Android Metro development bundle returned HTTP 200
- [x] `npx expo install --check` passes: dependencies are up to date
- [x] `npx expo-doctor` passes: 18/18 checks
- [x] Expo resolves the public production configuration with the expected identity and SDK 54
- [x] Android production export completes: 1,191 modules and a 3.09 MB Hermes bundle
- [x] Android native introspection applies `tools:node="remove"` to `android.permission.RECORD_AUDIO`

## Gate 2 — physical-device smoke test

Record the device model, operating-system version, build type, date, and tester before starting. Run Android and iOS separately when both are available.

### Fresh installation and onboarding

- [ ] App icon, splash screen, status bar, and first screen render correctly
- [ ] Owner setup accepts valid details and rejects incomplete details clearly
- [ ] Dog setup works without a photo
- [ ] Photo permission copy is correct
- [ ] Selecting, changing, and removing a dog photo works
- [ ] Exact and estimated birthday paths work
- [ ] Closing and reopening during setup does not create corrupt partial data

### Assessment and personalisation

- [ ] All assessment sections render and remain usable with large text
- [ ] Assessment results match the selected answers
- [ ] Severe reactivity guidance is calm, visible, and non-diagnostic
- [ ] Completing the assessment opens the main application
- [ ] Dog name and photo are consistent across Today, Academy, Progress, and Dog

### Daily training loop

- [ ] Today shows a real plan for the selected dog
- [ ] Lesson preparation, active session, and completion screens work
- [ ] Completing a lesson returns to Today and celebrates once
- [ ] Lesson state and progress update correctly
- [ ] Relaunch preserves the completed lesson and daily plan
- [ ] Academy search, filters, locked lessons, and related navigation work
- [ ] Journey state and lesson photographs render correctly

### History and progress

- [ ] Completed session appears in history
- [ ] Session detail shows the correct lesson, date, duration, and result
- [ ] Progress totals and visual states match saved history
- [ ] Empty, loading, and error layouts do not clip or overlap

### Training Troubleshooter

- [ ] A normal concern produces questions and the complete practical plan
- [ ] Related lesson navigation works but remains optional
- [ ] Reporting **No change** advances to fallback level 2
- [ ] Repeated **No change** reaches level 3 without looping to level 1
- [ ] **Worse**, improvement, and success outcomes change the next guidance correctly
- [ ] Panic, aggression, possible pain, child, injury, and loss-of-control answers show safety guidance before exercises
- [ ] Saved outcomes remain after relaunch
- [ ] Equipment, reward, stress-signal, and professional-help reference sections render correctly

### Privacy and destructive deletion

- [ ] Privacy screen accurately says data is stored locally
- [ ] Privacy contact is `GoodDogAcademy1@gmail.com`
- [x] First deletion tap shows a clear destructive confirmation
- [x] Cancelling preserves all data and the dog photo
- [x] Confirming **Delete All App Data** returns to Welcome
- [x] Relaunch after deletion remains at Welcome
- [ ] Previous owner, dog, photo, assessment, plans, sessions, progress, and Troubleshooter outcomes do not return

Device note, 5 August 2026: the owner completed the confirmation, cancellation, deletion, and relaunch flow. The app reopened at **Raise an amazing dog / Get Started**, and saved progress was gone. The broader deletion item remains open until every listed data type is explicitly confirmed.

### Device-quality checks

- [ ] No clipped text at default font size
- [ ] No clipped text at the largest practical accessibility font size
- [ ] Keyboard never hides the active field or required action
- [ ] Buttons have usable touch targets and meaningful screen-reader labels
- [ ] Small-screen scrolling and pinned actions remain usable
- [ ] Airplane-mode launch and local-only features work after initial installation
- [ ] No unexpected microphone permission appears
- [ ] No crash, red screen, unhandled error, or repeated console warning occurs

## Gate 3 — public privacy policy

- [x] Production privacy-policy draft exists at `docs/privacy-policy.md`
- [x] Policy explains collected local data, dog photos, purposes, retention, deletion, children, security, changes, and contact
- [x] Policy clearly states there is currently no Good Dog Academy account, cloud sync, advertising, or analytics
- [ ] Production privacy-policy text receives owner review and approval
- [ ] Public HTTPS URL is stable and accessible without login
- [ ] URL is recorded for both store listings
- [ ] In-app wording and hosted policy do not contradict each other

## Gate 4 — signed preview builds

- [x] Product owner signed in through the official EAS browser flow as `gooddogacademy1@gmail.com`
- [x] EAS project ownership and configuration confirmed as `@gooddogacademys/gooddogacademy`
- [x] Android preview build succeeds (build `1c2735c6-9a0a-4fca-a49d-6160f9889010`, completed 5 August 2026)
- [ ] Android preview build installs on an Android test device (current physical test device is an iPhone)
- [ ] iOS preview build succeeds and installs through an approved distribution route (paused: no paid Apple Developer Program membership)
- [ ] Build identifiers and version numbers match the release identity above
- [ ] The full smoke test is repeated on signed builds

## Gate 5 — store materials

- [ ] App icon and feature graphics meet current store dimensions
- [ ] Screenshots cover Today, Academy, lesson coaching, Progress, Dog profile, and Troubleshooter
- [ ] Screenshots contain no private tester information
- [x] Short and full description drafts are prepared in `docs/store-submission-metadata.md`
- [x] Search terms and category choices are drafted for owner review
- [ ] Support and privacy URLs are public
- [ ] Apple age-rating questionnaire is completed accurately
- [ ] Google Play content-rating questionnaire is completed accurately
- [x] Apple privacy details are drafted from the current local-only implementation and dependencies
- [x] Google Play Data Safety answers are drafted from the current local-only implementation and dependencies
- [ ] Export-compliance and advertising questions are answered accurately

## Gate 6 — final release decision

- [ ] All release-blocking findings are fixed and rechecked
- [ ] TypeScript, full tests, Expo checks, production export, and Git whitespace check pass on the final commit
- [ ] Android and iOS signed-build smoke-test records are attached to the release notes
- [ ] Privacy-policy URL and store materials receive owner approval
- [ ] Release branch receives final review before merging into `main`
- [ ] Store submission is performed only after explicit owner instruction

## Stop conditions

Do not submit a build if any of the following remain:

- Data deletion fails or deleted data returns after relaunch
- A safety-sensitive Troubleshooter path presents training before required escalation
- The app crashes or loses lesson/profile data during ordinary use
- Store privacy answers conflict with app behaviour or the hosted policy
- Bundle identifiers, signing owner, version, or build number are uncertain
- A signed build has not completed the physical-device gate
