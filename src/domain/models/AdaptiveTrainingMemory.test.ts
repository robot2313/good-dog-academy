import { correctTrainingRep, type TrainingRep } from './TrainingEvidence';
import { createLiveCoachSession, addRepToLiveSession } from '../behaviour/LiveCoachEngine';
import { emptyAdaptiveTrainingMemory, summariseLiveCoachSession, updateAdaptiveTrainingMemory } from './AdaptiveTrainingMemory';

const rep = (id:string, outcome:'success'|'partial-success'|'unsuccessful', overrides:Partial<TrainingRep['evidence']>={}):TrainingRep => ({
  id,
  repNumber:Number(id.replace(/\D/g,''))||1,
  evidence:{
    source:'camera_auto',
    confidence:.84,
    observedOutcome:outcome,
    observedAt:'2026-09-12T10:00:00.000Z',
    cueAt:'2026-09-12T10:00:00.000Z',
    responseAt:'2026-09-12T10:00:01.000Z',
    markerAt:null,
    rewardAt:null,
    cueCount:1,
    signal:null,
    posture:null,
    poseConfidence:null,
    notes:null,
    ...overrides,
  },
  correction:null,
});

describe('AdaptiveTrainingMemory',()=>{
  it('uses owner-corrected outcomes in clean-rep summaries',()=>{
    let session=createLiveCoachSession({id:'s1',dogId:'d1',lessonId:'recall-short-distance',targetReps:2});
    const machineWrong=correctTrainingRep(rep('r1','unsuccessful'),'success','2026-09-12T10:00:02.000Z','Owner confirmed dog completed the rep');
    session=addRepToLiveSession(session,machineWrong);
    session=addRepToLiveSession(session,rep('r2','success'));
    const summary=summariseLiveCoachSession(session,'recall','2026-09-12T10:05:00.000Z');
    expect(summary.cleanRepRate).toBe(1);
    expect(summary.correctedRepRate).toBe(.5);
  });

  it('tracks cue repetition, slow responses and stress signals separately',()=>{
    let session=createLiveCoachSession({id:'s2',dogId:'d1',lessonId:'recall-short-distance',targetReps:3});
    session=addRepToLiveSession(session,rep('r1','success',{cueCount:2}));
    session=addRepToLiveSession(session,rep('r2','partial-success',{responseAt:'2026-09-12T10:00:05.000Z'}));
    session=addRepToLiveSession(session,rep('r3','unsuccessful',{signal:'stress_signal'}));
    const summary=summariseLiveCoachSession(session,'recall','2026-09-12T10:05:00.000Z');
    expect(summary.repeatedCueRate).toBeCloseTo(1/3);
    expect(summary.slowResponseRate).toBeCloseTo(1/3);
    expect(summary.stressSignalRate).toBeCloseTo(1/3);
  });

  it('blends repeated sessions into long-term skill memory',()=>{
    const initial=emptyAdaptiveTrainingMemory('d1');
    const first=updateAdaptiveTrainingMemory(initial,{
      id:'s1',dogId:'d1',lessonId:'l1',skillId:'recall',completedAt:'2026-09-10T10:00:00.000Z',totalReps:4,
      cleanRepRate:1,repeatedCueRate:0,slowResponseRate:0,stressSignalRate:0,correctedRepRate:0,endedEarly:false,endReason:'target_reached',
      startingDifficulty:{distance:1,duration:1,distraction:1},endingDifficulty:{distance:1,duration:2,distraction:1},
    });
    const second=updateAdaptiveTrainingMemory(first,{
      id:'s2',dogId:'d1',lessonId:'l1',skillId:'recall',completedAt:'2026-09-12T10:00:00.000Z',totalReps:4,
      cleanRepRate:.5,repeatedCueRate:.5,slowResponseRate:.25,stressSignalRate:0,correctedRepRate:.25,endedEarly:false,endReason:'target_reached',
      startingDifficulty:{distance:1,duration:2,distraction:1},endingDifficulty:{distance:2,duration:2,distraction:1},
    });
    expect(second.totalSessions).toBe(2);
    expect(second.skills.recall.sessionsCompleted).toBe(2);
    expect(second.skills.recall.totalReps).toBe(8);
    expect(second.skills.recall.cleanRepRate).toBe(.75);
    expect(second.skills.recall.repeatedCueRate).toBe(.25);
    expect(second.skills.recall.recommendedDifficulty.distance).toBe(2);
  });
});
