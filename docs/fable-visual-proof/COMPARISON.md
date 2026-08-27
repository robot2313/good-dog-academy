# Fable 5 visual comparison — implemented vs reference

Captured from the running app (Expo web export, 390x844 phone viewport,
2x scale) after completing real onboarding and a real assessment, then
navigating every screen by tapping the actual UI. Nothing here is a mock.

## The six master screens

**01 Home — matches.** Hamburger + bell, time-aware greeting, "Buddy & Ryan",
circular dog avatar right, Today's Plan photo card with green Continue Lesson,
Recommended For You + See all, Jump Back In with progress bar, Browse by
Category circle row with More, five tabs in reference order.
Differences: the greeting is time-aware so captures can read "Good afternoon";
Today's Plan card copy sits right of the photo with the button inside the card
(reference shows the same structure); a warm "Need help right now?" strip
exists below Browse by Category that the reference does not show — it carries
the safety Help Me Now entry point and uses the reference caution style.

**02 Categories — matches.** Title, subtitle, ten compact white rows with
tinted icon left, name, "6 lessons" right, Categories tab active.

**03 Lessons in Category — matches closely.** Category tile + title + count,
wide realistic photograph, description, All/Beginner/Intermediate/Advanced
pills, six numbered rows with thumbnails and chevrons.
Differences: lesson names are the real production curriculum ("Build a
Toileting Routine"...), not the mockup's placeholder names ("Introduction to
House Training"...); level labels show the real 1–4 levels rather than only
Beginner/Intermediate/Advanced words.

**04 Lesson Detail — matches.** Full-bleed photo from the top (~38% height),
circular back and bookmark overlays, title, level + duration chips,
description, You will learn with green checks, full-width green Start Lesson,
no tab bar.

**05 Your Journey — matches.** Title, subtitle, left rail with stage markers,
four stage cards, expanded current stage with check/current/locked rows,
green View Full Journey button, Journey tab active.

**06 Training by Life Stage — matches.** Four stacked cards, photograph
filling the left ~44%, stage name + age + summary right, chevron, Dogs tab
active.

## Lesson flow (photo-led, one system)

- get-ready-before-you-begin: wide photo banner, overview card, coaching
  tips / pitfalls / make-it-easier cards with green and amber circle icons,
  warm safety strip, pinned Back + Start Lesson bar
- active-practice: compact photo strip, restrained navy timer card with green
  Pause, numbered step list, green SUCCESS / outlined TRY AGAIN counters,
  Undo last + "This isn't working?" links, pinned Complete Lesson
- help-this-isnt-working: help sheet with Make it easier, Common mistakes,
  Safety first, green Try again — existing troubleshooting logic untouched
- feedback: white rating rows with pale-green selected state, session
  snapshot card, green Save session
- completion: white celebration card over the updated Home with green check
  identity mark and squared green Continue button

## Secondary flows (same system)

onboarding-welcome (photo-led with green check bullets), owner setup, dog
setup, assessment intro / question radios / results, progress-passport —
all captured under secondary/ and all on the cream/white/navy/green system.

## Known remaining differences

1. **Per-step close-up photography does not exist yet.** The step-visual
   model (setupImage, closeUpImages, correctImage/avoidImage, overlay
   annotations, video/audio slots) is implemented and rendered when assets
   exist, but the registry ships EMPTY: no per-step close-up, correct/avoid,
   or demonstration assets have been produced. Every step currently falls
   back to the lesson's single approved photograph. The visual-first lesson
   requirement is therefore NOT complete on the asset side.
2. Reference mockup photos were not reused (contract forbids it); production
   photographs occupy the same slots, so exact crops differ.
3. Lesson titles/levels are the real 60-lesson curriculum, not the mockup's
   placeholder names.
4. Web captures render system fonts; on-device rendering may differ slightly
   in letter spacing and shadow smoothing. Final physical-device approval
   still required.
