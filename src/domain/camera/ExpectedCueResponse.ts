import type { DogPostureEvidence } from '../models/TrainingEvidence';

export type ExpectedCueResponse = {
  cueId: string;
  cueLabel: string;
  expectedPosture: Exclude<DogPostureEvidence, 'unknown'>;
  responseWindowMs: number;
};

/**
 * Automatic posture scoring is opt-in per lesson/cue, never inferred from titles,
 * tags or free text. A lesson belongs here only when one posture is itself the
 * authoritative success criterion for the observed rep.
 *
 * The current production curriculum mostly measures choices, timing, location,
 * attention, loose-lead movement or relaxed behaviour and often explicitly
 * permits more than one body position. Those lessons must remain owner-confirmed.
 */
const EXPECTED_CUE_RESPONSES: Readonly<Record<string, ExpectedCueResponse>> = Object.freeze({});

export function expectedCueResponseForLesson(lessonId: string): ExpectedCueResponse | null {
  return EXPECTED_CUE_RESPONSES[lessonId] ?? null;
}

export function supportsAutomaticPostureScoring(lessonId: string): boolean {
  return expectedCueResponseForLesson(lessonId) !== null;
}
