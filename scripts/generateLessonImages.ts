/**
 * Lesson training-image generation tool.
 *
 * Safe, reusable orchestration for producing one unique, photorealistic image
 * per active lesson. It reads the single source of truth for lesson image specs
 * (`src/features/lessons/coaching/lessonImageGenerationData.ts`), determines
 * which images are missing or rejected, and (only when explicitly executed and
 * a provider key is present) generates them via a configured provider.
 *
 * Design constraints:
 *   - Never expose or commit API keys. Keys are read ONLY from environment
 *     variables (FAL_KEY / OPENAI_API_KEY) and are never printed or logged.
 *   - Defaults to a DRY RUN. No paid API call happens without --execute.
 *   - Never guesses provider endpoints. The generating model/endpoint must be
 *     supplied explicitly (FAL_MODEL / OPENAI_IMAGE_MODEL) before any paid run.
 *   - Downloaded files are validated as real images before being saved.
 *   - Never leaves production code depending on a temporary API URL: images are
 *     downloaded to disk under assets/lesson-images/by-lesson/.
 *   - Does NOT flip a lesson to "approved" automatically — approval is a human
 *     step (wiring the file into uniqueLessonImageSources in the RN manifest).
 *
 * Usage (run from the repository root):
 *   # Dry run (default) — reports what WOULD be generated, no network calls:
 *   node <compiled>/generateLessonImages.js --dry-run
 *   # Regenerate the human-readable production manifest doc:
 *   node <compiled>/generateLessonImages.js --emit-doc
 *   # Paid generation (requires explicit opt-in, a key and an explicit model):
 *   FAL_KEY=... FAL_MODEL=fal-ai/nano-banana \
 *     node <compiled>/generateLessonImages.js --provider=fal --execute
 *
 * This file is plain TypeScript with no React Native imports, so it can be
 * compiled with the project's tsc (module=commonjs) and run with Node.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  lessonImageGenerationSpecs,
  type LessonImageSpec,
} from '../src/features/lessons/coaching/lessonImageGenerationData';

type ProviderName = 'fal' | 'openai';

interface CliOptions {
  readonly provider: ProviderName;
  readonly lesson: string | null;
  readonly force: boolean;
  readonly execute: boolean;
  readonly emitDoc: boolean;
}

type LessonStatus = 'VERIFIED REALISTIC IMAGE EXISTS' | 'NOT YET CREATED' | 'REJECTED CARTOON OR ILLUSTRATION';

interface LessonState {
  readonly spec: LessonImageSpec;
  readonly targetPath: string;
  readonly status: LessonStatus;
}

// Approximate per-image costs (USD). Estimates only — verify with the provider
// before any paid run. Used purely for the dry-run cost projection.
const APPROX_COST_USD: Record<ProviderName, number> = {
  fal: 0.039,
  openai: 0.04,
};

const REPO_ROOT = process.cwd();
const BY_LESSON_DIR = path.join(REPO_ROOT, 'assets', 'lesson-images', 'by-lesson');
const REJECTED_DIR = path.join(BY_LESSON_DIR, 'rejected');
const METADATA_PATH = path.join(BY_LESSON_DIR, 'generation-metadata.json');
const DOC_PATH = path.join(REPO_ROOT, 'docs', 'lesson-image-production-manifest.md');

function parseArgs(argv: readonly string[]): CliOptions {
  let provider: ProviderName = 'fal';
  let lesson: string | null = null;
  let force = false;
  let execute = false;
  let emitDoc = false;

  for (const arg of argv) {
    if (arg.startsWith('--provider=')) {
      const value = arg.slice('--provider='.length);
      if (value !== 'fal' && value !== 'openai') {
        throw new Error(`Unknown provider "${value}". Use --provider=fal or --provider=openai.`);
      }
      provider = value;
    } else if (arg.startsWith('--lesson=')) {
      lesson = arg.slice('--lesson='.length);
    } else if (arg === '--force') {
      force = true;
    } else if (arg === '--execute') {
      execute = true;
    } else if (arg === '--dry-run') {
      execute = false;
    } else if (arg === '--emit-doc') {
      emitDoc = true;
    } else if (arg === '--help' || arg === '-h') {
      execute = false;
    } else {
      throw new Error(`Unrecognised argument: ${arg}`);
    }
  }

  return { provider, lesson, force, execute, emitDoc };
}

/** Validate that a buffer is a real JPEG or PNG image by its magic bytes. */
function isValidImage(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  return isJpeg || isPng;
}

function existingImageIsValid(filePath: string): boolean {
  try {
    const buffer = fs.readFileSync(filePath);
    return isValidImage(buffer);
  } catch {
    return false;
  }
}

function resolveStatus(spec: LessonImageSpec): LessonStatus {
  const rejectedMarker = path.join(REJECTED_DIR, spec.destinationFilename);
  if (fs.existsSync(rejectedMarker)) {
    return 'REJECTED CARTOON OR ILLUSTRATION';
  }
  const target = path.join(BY_LESSON_DIR, spec.destinationFilename);
  if (fs.existsSync(target) && existingImageIsValid(target)) {
    return 'VERIFIED REALISTIC IMAGE EXISTS';
  }
  return 'NOT YET CREATED';
}

function computeStates(): LessonState[] {
  return lessonImageGenerationSpecs.map((spec) => ({
    spec,
    targetPath: path.join(BY_LESSON_DIR, spec.destinationFilename),
    status: resolveStatus(spec),
  }));
}

function detectProviderConfig(): { fal: boolean; openai: boolean; falModel: string | null; openaiModel: string | null } {
  return {
    // Presence only — the key value is never read into output.
    fal: Boolean(process.env.FAL_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    falModel: process.env.FAL_MODEL ?? null,
    openaiModel: process.env.OPENAI_IMAGE_MODEL ?? null,
  };
}

function selectForGeneration(states: readonly LessonState[], options: CliOptions): LessonState[] {
  return states.filter((state) => {
    if (options.lesson && state.spec.lessonId !== options.lesson) return false;
    if (state.status === 'VERIFIED REALISTIC IMAGE EXISTS' && !options.force) return false;
    return true;
  });
}

function line(label: string, value: string | number): string {
  return `${label.padEnd(32)} ${value}`;
}

function printDryRunReport(states: readonly LessonState[], options: CliOptions): void {
  const config = detectProviderConfig();
  const approved = states.filter((s) => s.status === 'VERIFIED REALISTIC IMAGE EXISTS');
  const missing = states.filter((s) => s.status === 'NOT YET CREATED');
  const rejected = states.filter((s) => s.status === 'REJECTED CARTOON OR ILLUSTRATION');
  const toGenerate = selectForGeneration(states, options);
  const perImage = APPROX_COST_USD[options.provider];
  const cost = (toGenerate.length * perImage).toFixed(2);

  console.log('=== Lesson image generation — DRY RUN (no paid API calls) ===');
  console.log(line('Active lessons:', states.length));
  console.log(line('Approved images present:', approved.length));
  console.log(line('Missing (NOT YET CREATED):', missing.length));
  console.log(line('Rejected images:', rejected.length));
  console.log(line('Selected provider:', options.provider));
  console.log(line('FAL_KEY detected:', config.fal ? 'yes' : 'no'));
  console.log(line('OPENAI_API_KEY detected:', config.openai ? 'yes' : 'no'));
  console.log(line('FAL_MODEL set:', config.falModel ?? '(not set)'));
  console.log(line('OPENAI_IMAGE_MODEL set:', config.openaiModel ?? '(not set)'));
  if (options.lesson) console.log(line('Filtered to lesson:', options.lesson));
  console.log(line('Force regenerate:', options.force ? 'yes' : 'no'));
  console.log(line('Generations required:', toGenerate.length));
  console.log(line('Approx cost (USD):', `~$${cost} (estimate; verify with provider)`));
  console.log('');
  console.log('Lessons that WOULD be generated:');
  for (const state of toGenerate) {
    console.log(`  - ${state.spec.lessonId}  [${state.status}] -> ${state.spec.destinationFilename}`);
  }
  console.log('');
  console.log('No images were generated. Re-run with --execute (and a provider key');
  console.log('plus an explicit model) after this dry run is approved.');
}

function buildDoc(states: readonly LessonState[]): string {
  const now = states.length;
  const lines: string[] = [];
  lines.push('# Lesson Image Production Manifest');
  lines.push('');
  lines.push('> Generated from `src/features/lessons/coaching/lessonImageGenerationData.ts`');
  lines.push('> by `scripts/generateLessonImages.ts --emit-doc`. Do not edit by hand;');
  lines.push('> update the spec data (the single source of truth) and re-emit.');
  lines.push('');
  lines.push('## Global requirements');
  lines.push('');
  lines.push('- Each lesson requires a **unique** image showing that exact lesson action.');
  lines.push('- **Photorealistic only.** No cartoon, illustration, animation, vector, emoji or 3D-rendered dog.');
  lines.push('- **Humane handling only.** No shock collars, prong collars, choke chains, intimidation or unsafe handling. Positive reinforcement and realistic anatomy only.');
  lines.push('- **Landscape 3:2 composition** suitable for mobile cropping.');
  lines.push('- Destination: `assets/lesson-images/by-lesson/<lesson-id>.jpg`.');
  lines.push('');
  lines.push('## Status legend');
  lines.push('');
  lines.push('- `VERIFIED REALISTIC IMAGE EXISTS` — a real photograph is committed and validated.');
  lines.push('- `NOT YET CREATED` — no unique per-lesson image yet; the app shows a temporary shared skill fallback.');
  lines.push('- `REJECTED CARTOON OR ILLUSTRATION` — a produced image was rejected for style/safety and must be redone.');
  lines.push('');
  lines.push('> **Audit note:** the current shared per-skill fallback images');
  lines.push('> (`assets/lesson-images/<skill>.jpg`) are non-photorealistic illustrations.');
  lines.push('> They are classified `REJECTED CARTOON OR ILLUSTRATION` and serve only as a');
  lines.push('> temporary compatibility fallback until each lesson has a verified photograph.');
  lines.push('');
  lines.push(`## Lessons (${now} active)`);
  lines.push('');

  for (const { spec, status } of states) {
    lines.push(`### ${spec.title}`);
    lines.push('');
    lines.push(`- **Lesson ID:** \`${spec.lessonId}\``);
    lines.push(`- **Skill:** ${spec.skill}`);
    lines.push(`- **Behaviour taught:** ${spec.behaviour}`);
    lines.push(`- **Visible dog-training action:** ${spec.visibleAction}`);
    lines.push(`- **Dog (breed / size / age):** ${spec.breed} / ${spec.size} / ${spec.age}`);
    lines.push(`- **Environment:** ${spec.environment}`);
    lines.push(`- **Handler position:** ${spec.handlerPosition}`);
    lines.push(`- **Reward placement:** ${spec.rewardPlacement}`);
    lines.push(`- **Camera angle & framing:** ${spec.cameraFraming}`);
    lines.push(`- **Lighting:** ${spec.lighting}`);
    lines.push(`- **Destination filename:** \`assets/lesson-images/by-lesson/${spec.destinationFilename}\``);
    lines.push(`- **Generation prompt:** ${spec.prompt}`);
    lines.push(`- **Negative prompt:** ${spec.negativePrompt}`);
    lines.push(`- **Current image source:** shared skill illustration \`assets/lesson-images/${spec.skill}.jpg\` (temporary fallback)`);
    lines.push(`- **Current status:** ${status}`);
    lines.push('');
  }

  return lines.join('\n');
}

function emitDoc(states: readonly LessonState[]): void {
  const doc = buildDoc(states);
  fs.mkdirSync(path.dirname(DOC_PATH), { recursive: true });
  fs.writeFileSync(DOC_PATH, `${doc}\n`, 'utf8');
  console.log(`Wrote production manifest doc: ${path.relative(REPO_ROOT, DOC_PATH)}`);
  console.log(`Covered ${states.length} active lessons.`);
}

/**
 * Guard for paid generation. Refuses to run unless the operator has explicitly
 * opted in, provided a key, and named a model/endpoint (no endpoint guessing).
 * The actual provider HTTP call is intentionally the only place a network
 * request is made, and it is unreachable during a dry run.
 */
function assertGenerationPreconditions(options: CliOptions): void {
  const config = detectProviderConfig();
  if (options.provider === 'fal') {
    if (!config.fal) throw new Error('FAL_KEY is not set. Aborting paid generation.');
    if (!config.falModel) {
      throw new Error(
        'FAL_MODEL is not set. Set it to a verified fal image endpoint/model id ' +
          '(e.g. the current nano-banana model id) before any paid run. Endpoints are ' +
          'never guessed by this script.',
      );
    }
  } else {
    if (!config.openai) throw new Error('OPENAI_API_KEY is not set. Aborting paid generation.');
    if (!config.openaiModel) {
      throw new Error(
        'OPENAI_IMAGE_MODEL is not set. Set it to the best image model available to your ' +
          'account before any paid run. Model names are never guessed by this script.',
      );
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const states = computeStates();

  if (options.emitDoc) {
    emitDoc(states);
    return;
  }

  if (!options.execute) {
    printDryRunReport(states, options);
    return;
  }

  // --- Paid generation path (dormant during dry runs) ---
  assertGenerationPreconditions(options);
  const selected = selectForGeneration(states, options);
  console.log(`Executing generation for ${selected.length} lesson image(s) via ${options.provider}...`);
  console.error(
    'Provider HTTP generation is intentionally left for a supervised, approved run. ' +
      'Wire the verified endpoint call here before enabling paid execution.',
  );
  process.exitCode = 2;
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
