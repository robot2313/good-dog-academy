# MILESTONE 12 — AI SAFETY

What the AI coach is allowed to do, what it is prohibited from doing, how unsafe situations are
handled, and what is not yet production-secure.

## Shipping state: the coach runs with NO AI provider

This project has no secure AI backend. Per the milestone's own constraint — no API keys in the app
bundle, no secrets committed, no silently created paid infrastructure — the coach ships with
`coachProvider = null` (`src/features/coach/coachServiceInstance.ts`).

**This is a supported first-class mode, not a broken one.** Every coach answer users see today is
deterministic and grounded in approved content. Nothing about the coaching experience is stubbed,
faked, or waiting on a model. No fake production-secure integration was implemented.

## Pipeline (every coaching turn, no exceptions)

`CoachService.answer()` runs a fixed sequence:

1. **Deterministic safety classification** of the situation. High risk → return a safety escalation.
   The provider is **never called** in this branch.
2. **Deterministic answer** built from approved content. This always governs.
3. **Optional provider call** — only if a provider exists and reports itself available. Wrapped in
   try/catch; any throw, null, or empty result falls back to step 2.
4. **Humane-policy gate** on generated text. Any violation discards the generated output entirely and
   returns the deterministic answer with `generatedOutputRejected: true`.

The model can only ever *rephrase* an answer the deterministic layer already produced. It cannot
select a lesson, change a difficulty decision, unlock content, or override a safety outcome.

## What the AI is ALLOWED to do

- Rephrase the deterministic answer more clearly or more simply.
- Personalise wording using the structured context it is given (dog name, life stage, current lesson
  and step, recent outcome counts, engine recommendation, approved lesson content).
- Help the owner navigate to approved material the app already contains.

## What the AI is PROHIBITED from doing

- Deciding what training action is allowed — the deterministic engine owns that.
- Inventing training methods not present in approved content.
- Recommending punishment, dominance theory, or any aversive technique (see policy below).
- Medical or behavioural diagnosis; presenting itself as a veterinarian or veterinary behaviourist.
- Guarantees, invented statistics, invented progress, invented history, or claimed lesson completion.
- Overriding a safety warning present in production lesson or protocol content.
- Free-form chat: the owner selects from a fixed list of approved questions; there is no open text box.

## Context boundary (what a provider actually receives)

`buildCoachContext()` assembles a narrow, structured `CoachContext`: dog name, age in months,
assessment priority skills, and — for the current lesson only — id, title, skill, difficulty, goal,
current step, steps, approved tips, approved ways-to-make-easier, and approved safety notes; plus
recent outcome counts, the current troubleshooter adjustment, and the engine's recommendation.

The whole curriculum is never placed in a prompt. Only the relevant approved content for the lesson
in hand is retrieved and passed.

## Safety layer — `src/features/coach/coachSafety.ts`

`classifyCoachRisk()` is a deterministic pattern classifier over the situation text, checked in
priority order so the most dangerous category wins:

| Category | Urgency | Examples detected |
| --- | --- | --- |
| `immediate-danger` | urgent | risk to a child/baby/toddler, loss of control, traffic |
| `bite-or-aggression` | urgent | bit, bite, nipped, snapping, lunging, growling, snarling, attack, drew blood |
| `dog-conflict` | urgent | grabbed the other dog, won't let go |
| `self-injury` | urgent | hurting himself/herself, self-harm, licking a wound raw |
| `sudden-change-or-pain` | prompt | pain, limping, yelping, sudden change, never done this before |
| `possible-illness` | prompt | sick, vomiting, diarrhoea, seizure, not eating, lethargic, bleeding |
| `severe-fear` | prompt | terrified, panicking, trembling, hiding for hours, shut down, frozen with fear |

Each escalation tells the owner to **stop the exercise**, make the situation safe without
confrontation, and contact a veterinarian and/or a qualified reward-based behaviour professional.
Escalations never diagnose and never claim veterinary authority; the UI carries an explicit
"not veterinary advice or a diagnosis" line.

This mirrors the safety overrides already present in the production Troubleshooter — it does not
replace or weaken them.

## Humane training policy — generated-text gate

`enforceHumaneTrainingPolicy()` rejects generated output recommending: physical punishment, alpha
rolls, dominance confrontation, pinning/scruffing, choking or choke equipment, shock/e-collars/prong
collars, leash pops and collar corrections, intimidation or deliberately frightening the dog,
flooding, punishment escalation, and withholding food or water.

Rejection is total — the generated text is discarded, not edited. The owner sees the deterministic,
welfare-first answer instead. A model cannot talk its way past this gate because the gate runs on its
output, not its intent.

## No-AI fallback guarantees

With AI unavailable, absent, or failing:

- lesson ranking, next-lesson recommendation, prerequisite decisions, difficulty adjustments,
  recommendation explanations and safety routing all continue to work;
- the lesson flow is never blocked and no data is lost;
- the coach still answers every approved question deterministically;
- the panel shows a non-alarming message if a call fails, and states that training and lesson
  guidance are unaffected.

Verified by test: `tests/coach/coachService.test.ts` covers no provider, unavailable provider,
throwing provider, empty result, and policy-violating result.

## Security limitations and remaining backend requirement

**Not yet production-ready — required before any provider is enabled:**

1. **A secure server-side proxy.** The API key must live server-side only. No key may be placed in
   the app bundle, in `app.json`, in EAS build config exposed to the client, or in any committed file.
2. **Server-side authentication and rate limiting**, so the endpoint cannot be used as an open relay.
3. **Server-side re-application of the safety and humane-policy gates.** The client gates are
   necessary but a compromised client must not be the only guard.
4. **A data-minimisation review.** The current context contains a dog name and training history. Any
   transmission off-device needs an explicit privacy decision, disclosure, and likely consent — the
   app is currently entirely on-device.
5. **Logging and abuse-monitoring policy**, including what is retained and for how long.

Until all five exist, `coachProvider` stays `null`. Implementing `CoachProvider` against a secure
endpoint is the only change required; the safety, policy and fallback guarantees are enforced by
`CoachService` regardless of provider, so they cannot be bypassed by swapping the provider in.

## Training memory

The coach's "memory" is the existing persisted training history, read through canonical repositories
and reduced to structured facts (recent completed lessons, recent outcomes, current category,
recurring difficulty where supported, current daily plan, assessment priorities).

There is no free-form AI memory store. No model-written claim about the dog is ever persisted as
fact. Derived state is recalculated from canonical data on every read.
