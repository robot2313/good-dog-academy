import {
  diagnoseTrainingRep,
  type LiveCoachSession,
} from '../behaviour/LiveCoachEngine';
import { effectiveRepOutcome } from '../models/TrainingEvidence';

export type SessionDebrief = {
  headline: string;
  summary: string;
  strongestSignal: string;
  mainBreakdown: string | null;
  ownerCoachingTip: string;
  nextSessionRecommendation: string;
  safetyNote: string | null;
  cleanRepRate: number;
  ownerCorrectionRate: number;
};

function rate(count: number, total: number): number {
  return total > 0 ? count / total : 0;
}

export function buildSessionDebrief(session: LiveCoachSession): SessionDebrief {
  const total = session.reps.length;
  const cleanCount = session.reps.filter((rep) => effectiveRepOutcome(rep) === 'success').length;
  const correctedCount = session.reps.filter((rep) => rep.correction !== null && rep.correction !== undefined).length;
  const diagnoses = session.reps.map(diagnoseTrainingRep);
  const stressCount = diagnoses.filter((item) => item.code === 'stress_or_discomfort').length;
  const repeatedCueCount = diagnoses.filter((item) => item.code === 'cue_repetition').length;
  const slowCount = diagnoses.filter((item) => item.code === 'slow_response').length;
  const unclearCount = diagnoses.filter((item) => item.code === 'unclear_evidence').length;
  const difficultyCount = diagnoses.filter((item) => item.code === 'difficulty_too_high').length;
  const cleanRepRate = rate(cleanCount, total);
  const ownerCorrectionRate = rate(correctedCount, total);

  if (stressCount > 0 || session.endReason === 'stress') {
    return {
      headline: 'Comfort comes first',
      summary: `This session included ${stressCount || 1} rep${stressCount === 1 ? '' : 's'} with possible stress or discomfort evidence, so progression should pause.` ,
      strongestSignal: 'Possible stress or discomfort evidence was the most important signal in this session.',
      mainBreakdown: 'The training setup may have created more pressure than was comfortable in at least one rep.',
      ownerCoachingTip: 'Reduce pressure, add distance or simplify the environment, and watch for relaxed voluntary re-engagement before asking again.',
      nextSessionRecommendation: 'Return to an easier setup and keep the next session short. Do not increase difficulty until comfortable, clean reps return.',
      safetyNote: 'This is a training signal, not a medical diagnosis. If discomfort, pain or a sudden behaviour change is suspected, stop training and seek veterinary advice.',
      cleanRepRate,
      ownerCorrectionRate,
    };
  }

  if (repeatedCueCount > 0) {
    return {
      headline: 'Make the cue clearer',
      summary: `${repeatedCueCount} rep${repeatedCueCount === 1 ? '' : 's'} showed repeated-cue evidence. The main opportunity is clearer timing rather than more difficulty.`,
      strongestSignal: 'Cue repetition was the strongest recurring breakdown signal.',
      mainBreakdown: 'Repeating the cue can make it less clear which cue predicts the behaviour and reward.',
      ownerCoachingTip: 'Give the cue once, pause, then help or reset instead of repeating it.',
      nextSessionRecommendation: 'Keep difficulty stable and aim for two clean one-cue sessions before adding another challenge.',
      safetyNote: null,
      cleanRepRate,
      ownerCorrectionRate,
    };
  }

  if (slowCount > 0) {
    return {
      headline: 'Build faster fluency',
      summary: `${slowCount} rep${slowCount === 1 ? '' : 's'} had a slow response after the cue, suggesting the current setup still needs fluency work.`,
      strongestSignal: 'Response latency was the clearest pattern in this session.',
      mainBreakdown: 'The behaviour may not yet be fluent enough at the current challenge level.',
      ownerCoachingTip: 'Shorten the task, improve reward timing, and make the next few reps easier to answer quickly.',
      nextSessionRecommendation: 'Repeat at the same or slightly easier difficulty until responses become consistently prompt.',
      safetyNote: null,
      cleanRepRate,
      ownerCorrectionRate,
    };
  }

  if (unclearCount > 0 || ownerCorrectionRate >= 0.25) {
    return {
      headline: 'Collect cleaner evidence',
      summary: 'Several reps needed owner confirmation or correction, so the app should stay conservative about automatic conclusions from this session.',
      strongestSignal: ownerCorrectionRate >= 0.25
        ? 'A meaningful share of recorded reps needed owner correction.'
        : 'Some rep evidence was too uncertain for a strong automatic conclusion.',
      mainBreakdown: 'Evidence quality was not consistent enough to justify aggressive adaptation.',
      ownerCoachingTip: 'Keep the dog and full body clearly visible, use one cue, and confirm uncertain reps rather than guessing.',
      nextSessionRecommendation: 'Repeat a simple setup and collect another session of clear owner-confirmed evidence before progressing.',
      safetyNote: null,
      cleanRepRate,
      ownerCorrectionRate,
    };
  }

  if (difficultyCount > 0 || cleanRepRate < 0.7) {
    return {
      headline: 'Make the next setup easier',
      summary: `Clean success was ${Math.round(cleanRepRate * 100)}% in this session, so reliability should improve before difficulty increases.`,
      strongestSignal: 'The current challenge level appears to be limiting clean successful reps.',
      mainBreakdown: 'No more specific breakdown signal explained the unsuccessful reps.',
      ownerCoachingTip: 'Lower exactly one challenge variable while keeping the others stable so you can see what changes performance.',
      nextSessionRecommendation: 'Return to the last reliable setup and look for a short run of clean reps before progressing again.',
      safetyNote: null,
      cleanRepRate,
      ownerCorrectionRate,
    };
  }

  return {
    headline: 'Strong, clean session',
    summary: `Clean success was ${Math.round(cleanRepRate * 100)}% with no stronger breakdown or safety signal detected.`,
    strongestSignal: 'Successful reps were the dominant evidence in this session.',
    mainBreakdown: null,
    ownerCoachingTip: 'Keep cue and reward timing consistent so the behaviour stays clear as challenge increases.',
    nextSessionRecommendation: 'Progress only one challenge variable at a time and keep the rest of the setup stable.',
    safetyNote: null,
    cleanRepRate,
    ownerCorrectionRate,
  };
}
