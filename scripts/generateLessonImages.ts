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

import * as crypto from 'node:crypto';
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
// before any paid run. Used for the cost projection and budget guard.
const APPROX_COST_USD: Record<ProviderName, number> = {
  fal: 0.039,
  openai: 0.04,
};

// Hard budget ceiling. Generation stops before this is exceeded.
const MAX_BUDGET_USD = 5;

// Maximum regeneration attempts per lesson after the first attempt fails.
const MAX_RETRIES = 2;

const FAL_ENDPOINT_BASE = 'https://fal.run';

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
    const currentSource =
      status === 'VERIFIED REALISTIC IMAGE EXISTS'
        ? `verified photograph \`assets/lesson-images/by-lesson/${spec.destinationFilename}\``
        : `shared skill illustration \`assets/lesson-images/${spec.skill}.jpg\` (temporary fallback)`;
    lines.push(`- **Current image source:** ${currentSource}`);
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

function buildPromptForProvider(spec: LessonImageSpec): string {
  return `${spec.prompt}\n\nStrictly avoid: ${spec.negativePrompt}.`;
}

/** Extract the first image URL from a fal response of unknown shape. */
function extractImageUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as Record<string, unknown>;

  const fromImages = (value: unknown): string | null => {
    if (!Array.isArray(value) || value.length === 0) return null;
    const first = value[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && typeof (first as Record<string, unknown>).url === 'string') {
      return (first as Record<string, unknown>).url as string;
    }
    return null;
  };

  return (
    fromImages(record.images) ??
    (record.image && typeof record.image === 'object'
      ? ((record.image as Record<string, unknown>).url as string | undefined) ?? null
      : null) ??
    (typeof record.url === 'string' ? record.url : null)
  );
}

async function generateViaFal(spec: LessonImageSpec): Promise<Buffer> {
  const falKey = process.env.FAL_KEY;
  const falModel = process.env.FAL_MODEL;
  if (!falKey || !falModel) {
    throw new Error('FAL_KEY / FAL_MODEL missing at generation time.');
  }

  const endpoint = `${FAL_ENDPOINT_BASE}/${falModel}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: buildPromptForProvider(spec),
      num_images: 1,
      aspect_ratio: '3:2',
      output_format: 'jpeg',
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`fal request failed (${response.status}): ${detail.slice(0, 400)}`);
  }

  const payload: unknown = await response.json();
  const imageUrl = extractImageUrl(payload);
  if (!imageUrl) {
    throw new Error(`fal response contained no image url. Keys: ${Object.keys(payload as object).join(', ')}`);
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`downloading generated image failed (${imageResponse.status}).`);
  }
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  if (!isValidImage(buffer)) {
    throw new Error('downloaded file is not a valid JPEG/PNG image.');
  }
  return buffer;
}

interface GenerationRecord {
  readonly lessonId: string;
  readonly provider: ProviderName;
  readonly model: string;
  readonly destinationFilename: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly attempts: number;
  readonly status: 'generated' | 'blocked';
}

function readMetadata(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8')) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeMetadata(records: readonly GenerationRecord[]): void {
  const existing = readMetadata();
  const byLesson: Record<string, unknown> =
    (existing.byLesson as Record<string, unknown> | undefined) ?? {};
  for (const record of records) {
    byLesson[record.lessonId] = record;
  }
  const output = { provider: records[0]?.provider ?? null, byLesson };
  fs.mkdirSync(BY_LESSON_DIR, { recursive: true });
  fs.writeFileSync(METADATA_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
}

async function executeGeneration(
  selected: readonly LessonState[],
  options: CliOptions,
): Promise<void> {
  const model =
    options.provider === 'fal'
      ? (process.env.FAL_MODEL as string)
      : (process.env.OPENAI_IMAGE_MODEL as string);
  const perImage = APPROX_COST_USD[options.provider];

  fs.mkdirSync(BY_LESSON_DIR, { recursive: true });

  const records: GenerationRecord[] = [];
  const blocked: string[] = [];
  let attemptsSpent = 0;

  for (const state of selected) {
    // Budget guard: never start a call that could exceed the ceiling.
    if ((attemptsSpent + 1) * perImage > MAX_BUDGET_USD) {
      console.error(`BUDGET STOP: next call would exceed $${MAX_BUDGET_USD}. Halting.`);
      break;
    }

    const { spec } = state;
    let saved = false;
    let attempts = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      if ((attemptsSpent + 1) * perImage > MAX_BUDGET_USD) {
        console.error(`BUDGET STOP before ${spec.lessonId}.`);
        break;
      }
      attempts = attempt + 1;
      attemptsSpent += 1;
      try {
        if (options.provider !== 'fal') {
          throw new Error('OpenAI provider path not enabled in this run.');
        }
        const resolved = await generateViaFal(spec);
        const target = path.join(BY_LESSON_DIR, spec.destinationFilename);
        fs.writeFileSync(target, resolved);
        const sha256 = crypto.createHash('sha256').update(resolved).digest('hex');
        records.push({
          lessonId: spec.lessonId,
          provider: options.provider,
          model,
          destinationFilename: spec.destinationFilename,
          bytes: resolved.length,
          sha256,
          attempts,
          status: 'generated',
        });
        console.log(`OK   ${spec.lessonId} (attempt ${attempts}, ${resolved.length} bytes)`);
        saved = true;
        break;
      } catch (error) {
        console.error(
          `FAIL ${spec.lessonId} attempt ${attempts}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    if (!saved) {
      blocked.push(spec.lessonId);
      records.push({
        lessonId: spec.lessonId,
        provider: options.provider,
        model,
        destinationFilename: spec.destinationFilename,
        bytes: 0,
        sha256: '',
        attempts,
        status: 'blocked',
      });
    }
  }

  writeMetadata(records);

  const generated = records.filter((r) => r.status === 'generated');
  console.log('');
  console.log('=== GENERATION SUMMARY ===');
  console.log(line('Provider:', options.provider));
  console.log(line('Model:', model));
  console.log(line('Selected:', selected.length));
  console.log(line('Generated:', generated.length));
  console.log(line('Blocked:', blocked.length));
  console.log(line('Total API attempts:', attemptsSpent));
  console.log(line('Approx cost (USD):', `~$${(attemptsSpent * perImage).toFixed(2)}`));
  if (blocked.length) console.log(line('Blocked lessons:', blocked.join(', ')));
  console.log(`SUMMARY_JSON ${JSON.stringify({ generated: generated.length, blocked, attempts: attemptsSpent, cost: Number((attemptsSpent * perImage).toFixed(2)) })}`);
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

  assertGenerationPreconditions(options);
  const selected = selectForGeneration(states, options);
  console.log(`Executing generation for ${selected.length} lesson image(s) via ${options.provider}...`);
  await executeGeneration(selected, options);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
