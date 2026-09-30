import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const upstreamCommit = '52f0329b5c9af513b5a8f2820aaea6bbd945d0c0';
const upstreamPath = 'lens/AnimalPoseTracking/Models/quadpose.onnx';
const expectedGitBlobSha = '5ae7849fe3ccca8aa17a04493cc193a6a413a482';
const expectedSize = 13_083_695;
const target = resolve('assets/models/quadpose.onnx');
const source = `https://raw.githubusercontent.com/EstevanSL/snapml-quadruped-pose/${upstreamCommit}/${upstreamPath}`;

function gitBlobSha(buffer) {
  const header = Buffer.from(`blob ${buffer.length}\0`);
  return createHash('sha1').update(header).update(buffer).digest('hex');
}

async function isValidExistingFile() {
  try {
    const buffer = await readFile(target);
    return buffer.length === expectedSize && gitBlobSha(buffer) === expectedGitBlobSha;
  } catch {
    return false;
  }
}

if (await isValidExistingFile()) {
  console.log(`Quadruped pose model already verified: ${target}`);
  process.exit(0);
}

console.log(`Fetching pinned quadruped pose model from ${upstreamCommit}…`);
const response = await fetch(source);
if (!response.ok) throw new Error(`Model download failed: HTTP ${response.status}`);
const buffer = Buffer.from(await response.arrayBuffer());

if (buffer.length !== expectedSize) {
  throw new Error(`Unexpected model size: expected ${expectedSize}, received ${buffer.length}`);
}

const actualGitBlobSha = gitBlobSha(buffer);
if (actualGitBlobSha !== expectedGitBlobSha) {
  throw new Error(`Model integrity mismatch: expected ${expectedGitBlobSha}, received ${actualGitBlobSha}`);
}

await mkdir(dirname(target), { recursive: true });
await writeFile(target, buffer);
console.log(`Verified quadruped pose model written to ${target}`);
console.log('Source code/weights: Apache-2.0. AP-10K training-data licensing must still be cleared before commercial release.');
