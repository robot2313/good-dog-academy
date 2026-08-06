# Good Dog Academy Store Submission Draft

This document is a release-owner review draft for version `1.0.0`. Store-console answers must be checked against the final signed build before submission.

## Product identity

- App name: **Good Dog Academy**
- Primary category: **Education**
- Secondary category: **Lifestyle**
- iOS bundle identifier: `com.robot2313.gooddogacademy`
- Android package: `com.robot2313.gooddogacademy`
- Support contact: `GoodDogAcademy1@gmail.com`
- Privacy-policy URL: **pending public hosting**

## Short description

Private, practical dog training plans and guided lessons for everyday life.

## Promotional text

Build calmer everyday habits with personalised plans, step-by-step lessons, progress tracking, and an adaptive Training Troubleshooter.

## Full description

Good Dog Academy helps you turn reward-based dog training into a clear, practical routine.

Create a profile for your dog, complete a behaviour assessment, and follow a personalised plan built around real everyday skills. Each guided lesson breaks training into manageable steps with preparation, coaching, safety notes, and measurable goals.

When something is not working, the Training Troubleshooter asks focused questions and adapts its guidance to what you observe. Safety-sensitive answers are prioritised before exercises, and fallback plans help you adjust when progress stalls.

Key features:

- personalised dog profile and behaviour assessment;
- 30 structured reward-based training lessons;
- daily training plans and guided sessions;
- lesson library, search, filters, and journey progress;
- training history, achievements, and progress tracking;
- adaptive troubleshooting for common training challenges;
- optional dog profile photo; and
- local-only app data with a clear in-app deletion control.

The current version works without a Good Dog Academy account and does not include cloud sync, advertising, or analytics.

Training information is educational and is not a substitute for veterinary diagnosis or individual advice from a qualified reward-based training professional. Seek prompt professional help when a dog may be in pain or when safety is at risk.

## Suggested search terms

`dog training, puppy training, reward based, behaviour, obedience, lessons, training plan, dog progress`

Final keywords must be adjusted to each store's character limits and metadata rules. Do not use unsupported rankings, testimonials, competitor names, or promotional claims.

## Screenshot story

Capture these screens from a clean signed preview build with fictional tester data:

1. **A plan made for your dog** — Today screen with selected-dog identity and daily plan.
2. **Build skills step by step** — Academy library with lesson photography and progress states.
3. **Clear coaching in every session** — active guided lesson.
4. **See progress that matters** — Progress overview and recent history.
5. **Help when training gets stuck** — Training Troubleshooter plan.
6. **Your dog, your journey** — Dog profile or Journey screen.

Do not show personal email, real owner names, private photos, debug UI, Expo Go chrome, or development warnings. Apple accepts one to ten screenshots and requires current device-specific dimensions. Google Play requires at least two phone screenshots and recommends high-quality screenshots representing the actual experience; confirm the console requirements when capturing the final set.

## Apple privacy draft

Based on the current source and bundled dependencies, Good Dog Academy does not transmit user-entered profile, photo, assessment, lesson, progress, session, settings, or Troubleshooter data to the developer or a third party. The intended App Privacy response is therefore **Data Not Collected**.

This response must be rechecked against:

- the final signed binary and all included SDKs;
- any diagnostics or analytics enabled in the Apple developer or build service accounts; and
- any new network, account, cloud, advertising, or support feature added before submission.

The public privacy-policy URL is required. A User Privacy Choices URL is optional; the same policy page may explain the local deletion path if desired.

## Google Play Data Safety draft

Based on the current source and bundled dependencies:

- data collected by the developer: **No**;
- data shared with third parties by the app: **No**;
- account creation: **No**;
- deletion: local app data can be deleted from **Dog > Privacy and Your Data > Delete All App Data**;
- privacy-policy URL: **required and pending public hosting**.

Google Play still requires the Data Safety form and privacy-policy link when an app declares no collection. The final form must account for every SDK in the signed Android App Bundle and any processing enabled by the developer account.

## Content and compliance review prompts

- Complete the Apple age-rating questionnaire from the actual content; do not guess a final rating in advance.
- Complete the Google Play content-rating questionnaire from the actual content.
- Declare that the app provides educational dog-training guidance, not veterinary diagnosis.
- Confirm there are no ads, purchases, subscriptions, user-generated content, location features, or account sign-in in version `1.0.0`.
- Confirm export-compliance answers against the final binary and Apple's current encryption questions.
- Confirm the photo permission wording and the absence of microphone permission on signed builds.
