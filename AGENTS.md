# AGENTS.md — Good Dog Academy

All coding/research agents working in this repository must read these files before meaningful work:

1. `GOOD_DOG_ACADEMY_SOURCE_OF_TRUTH.md` — canonical product and technical north star / main bible.
2. `GEMINI.md` — repo-wide operating, verification, safety, and reporting rules.
3. The current relevant project-state/branch files for live implementation evidence.

## Mandatory alignment rule

Before implementing work, state which category justifies it:

- **Roadmap work** — advances a phase/ranked task in `GOOD_DOG_ACADEMY_SOURCE_OF_TRUTH.md`.
- **Verified defect** — fixes a demonstrated regression/bug.
- **Required infrastructure** — testing/build/release work needed to prove or ship roadmap work.
- **Owner-directed exception** — Roger explicitly requested the work.

If none applies, do not start the task merely because it is technically interesting.

## Core product direction

Good Dog Academy is being built toward a professional multimodal **dog trainer in your pocket**:

**WATCH → UNDERSTAND → TRACK → INTERPRET → COACH → REMEMBER → ADAPT**

The canonical perception direction is modular:

**camera/mic/IMU → dog/human detection → target-dog tracking → dog pose + human pose + hands → lesson-specific object/lead understanding → synchronized temporal buffer → posture/action understanding → cue/event synchronization → deterministic rep engine → confidence/UNKNOWN engine → dog + handler performance → training memory → deterministic coaching → optional LLM/VLM explanation.**

Do not replace this with a giant end-to-end VLM or random model experiments without benchmark evidence and explicit strategic approval.

## Non-negotiables

- Accuracy over novelty.
- Temporal evidence over single-frame guessing.
- UNKNOWN over confident error.
- Dog-specific data/training where evidence justifies it.
- Preserve working architecture unless a measured replacement is better.
- Do not modify `main` unless the owner explicitly instructs it.
- Do not silently change target-dog identity across tracks.
- Do not treat visual leash geometry as exact force.
- Do not allow an LLM/VLM to invent low-level measurements or rep truth.
- Benchmark real target phones and sustained thermals, not desktop marketing latency.

The full roadmap, benchmark targets, scientific validity ladder, data strategy, mobile architecture, and authoritative next-ten task order are in `GOOD_DOG_ACADEMY_SOURCE_OF_TRUTH.md`.
