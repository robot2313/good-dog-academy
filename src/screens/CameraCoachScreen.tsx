import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { AppButton } from '../components/AppButton';
import { AppScreen } from '../components/AppScreen';
import { buildSessionDebrief, type SessionDebrief } from '../domain/analytics/SessionDebrief';
import {
  createLiveCoachSession,
  type LiveCoachSession,
  type SessionDirectorDecision,
} from '../domain/behaviour/LiveCoachEngine';
import { CameraCoachOrchestrator, type CameraCoachPendingConfirmation } from '../domain/camera/CameraCoachOrchestrator';
import { CameraCoachQaTelemetry, type CameraCoachQaEventType } from '../domain/camera/CameraCoachQaTelemetry';
import { expectedCueResponseForLesson } from '../domain/camera/ExpectedCueResponse';
import type { TrainingOutcome } from '../domain/models/TrainingSession';
import type { PoseShadowGroundTruth, PoseShadowValidationReport } from '../domain/vision/PoseShadowValidation';
import type { QuadrupedJointName } from '../domain/vision/QuadrupedPose';
import { analyseSmartFraming } from '../domain/vision/SmartFraming';
import { liveVisionStatus } from '../domain/vision/CameraCoachStatus';
import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { persistCompletedLiveCoachSession } from '../services/AdaptiveTrainingPersistenceService';
import { ExpoCameraFrameSource } from '../services/camera/ExpoCameraFrameSource';
import { ExpoCoachSpeech } from '../services/speech/ExpoCoachSpeech';
import { ExpoTrainingSpeechRecognizer } from '../services/speech/ExpoTrainingSpeechRecognizer';
import { HandsFreeCoachController } from '../services/speech/HandsFreeCoachController';
import { SpokenCoachController } from '../services/speech/SpokenCoachController';
import { ProductionDogVisionEngine } from '../services/vision/ProductionDogVisionEngine';
import { PoseShadowController, type PoseShadowObservation, type PoseShadowStatus } from '../services/vision/PoseShadowController';
import { loadPoseShadowValidationReport, recordPoseShadowValidationSample } from '../services/vision/PoseShadowValidationService';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraCoach'>;

type CameraFramingStatus =
  | 'waiting'
  | 'move-closer'
  | 'move-back'
  | 'move-left'
  | 'move-right'
  | 'good';

function getCameraFramingStatus(
  pose: PoseShadowObservation['pose'],
): CameraFramingStatus {
  if (!pose) return 'waiting';

  const points = Object.values(pose.keypoints).filter(
    (point) => point.confidence >= 0.55,
  );

  if (points.length < 6) return 'waiting';

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));

  const width = maxX - minX;
  const height = maxY - minY;
  const centerX = (minX + maxX) / 2;

  if (width < 0.28 || height < 0.28) return 'move-closer';
  if (width > 0.82 || height > 0.82) return 'move-back';
  if (centerX < 0.35) return 'move-right';
  if (centerX > 0.65) return 'move-left';

  return 'good';
}

type Diagnostics = {
  framesCaptured: number;
  framesAnalysed: number;
  lastFrameAt: string | null;
  lastResult: string;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';
type HandsFreeListenMode = 'confirmation' | 'next-rep' | 'paused';



const DEBUG_POSE_BONES: Array<[QuadrupedJointName, QuadrupedJointName]> = [
  ['left_eye', 'nose'],
  ['right_eye', 'nose'],
  ['nose', 'neck'],

  ['neck', 'left_shoulder'],
  ['neck', 'right_shoulder'],

  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_front_paw'],

  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_front_paw'],

  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],

  ['left_hip', 'tail_root'],
  ['right_hip', 'tail_root'],

  ['left_hip', 'left_knee'],
  ['left_knee', 'left_back_paw'],

  ['right_hip', 'right_knee'],
  ['right_knee', 'right_back_paw'],
];

export function CameraCoachScreen({ route, navigation }: Props): React.JSX.Element {
  const { status } = useOnboarding();
  const dog = status?.state === 'complete' ? status.dog : null;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const cueAtRef = useRef<string | null>(null);
  const pausedRef = useRef(false);
  const sessionStartedAtRef = useRef<string | null>(null);
  const completedSessionRef = useRef<LiveCoachSession | null>(null);
  const persistedSessionIdRef = useRef<string | null>(null);
  const spokenCoach = useMemo(() => new SpokenCoachController(new ExpoCoachSpeech()), []);
  const speechRecognizer = useMemo(() => new ExpoTrainingSpeechRecognizer(), []);
  const handsFreeCoach = useMemo(() => new HandsFreeCoachController(speechRecognizer), [speechRecognizer]);
  const qaTelemetry = useMemo(() => new CameraCoachQaTelemetry(), []);
  const poseShadow = useMemo(() => new PoseShadowController(), []);
  const expectedCue = useMemo(
    () => expectedCueResponseForLesson(route.params.lessonId),
    [route.params.lessonId],
  );
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(0);
  const pinchStartDistanceRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef(0);

  const cameraPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (event) => event.nativeEvent.touches.length >= 2,
        onMoveShouldSetPanResponder: (event) => event.nativeEvent.touches.length >= 2,
        onPanResponderGrant: (event) => {
          const touches = event.nativeEvent.touches;
          if (touches.length < 2) return;

          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;

          pinchStartDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
          pinchStartZoomRef.current = cameraZoom;
        },
        onPanResponderMove: (event) => {
          const touches = event.nativeEvent.touches;
          const startDistance = pinchStartDistanceRef.current;

          if (touches.length < 2 || startDistance === null) return;

          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const currentDistance = Math.sqrt(dx * dx + dy * dy);

          const scale = currentDistance / Math.max(startDistance, 1);

          setCameraZoom(
            Math.max(
              0,
              Math.min(
                1,
                pinchStartZoomRef.current + (scale - 1) * 0.7,
              ),
            ),
          );
        },
        onPanResponderRelease: () => {
          pinchStartDistanceRef.current = null;
        },
        onPanResponderTerminate: () => {
          pinchStartDistanceRef.current = null;
        },
      }),
    [cameraZoom],
  );

  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [handsFreeAvailable, setHandsFreeAvailable] = useState<boolean | null>(null);
  const [handsFreeListening, setHandsFreeListening] = useState(false);
  const [handsFreeMessage, setHandsFreeMessage] = useState('Checking speech recognition…');
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [cueAt, setCueAt] = useState<string | null>(null);
  const [pending, setPending] = useState<CameraCoachPendingConfirmation | null>(null);
  const [lastDecision, setLastDecision] = useState<SessionDirectorDecision | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [debrief, setDebrief] = useState<SessionDebrief | null>(null);
  const [qaSnapshot, setQaSnapshot] = useState(() => qaTelemetry.getSnapshot());
  const [poseShadowStatus, setPoseShadowStatus] = useState<PoseShadowStatus>(() => poseShadow.getStatus());
  const [poseShadowObservation, setPoseShadowObservation] = useState<PoseShadowObservation | null>(null);
  const [latestVision, setLatestVision] = useState<ReturnType<CameraCoachOrchestrator['getLastVisionResult']>>(null);
  const [sessionSnapshot, setSessionSnapshot] = useState<LiveCoachSession | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [poseShadowLabelled, setPoseShadowLabelled] = useState(false);
  const [poseValidationReport, setPoseValidationReport] = useState<PoseShadowValidationReport | null>(null);
  const smartFraming = useMemo(
    () => analyseSmartFraming(latestVision?.dogBoundingBox ?? null, latestVision?.trackingConfidence ?? 0, latestVision?.trackingState ?? null),
    [latestVision?.dogBoundingBox, latestVision?.trackingConfidence],
  );
  const cameraFramingStatus = smartFraming.status;

  const [diagnostics, setDiagnostics] = useState<Diagnostics>({
    framesCaptured: 0,
    framesAnalysed: 0,
    lastFrameAt: null,
    lastResult: 'Idle',
  });

  const recordQa = useCallback((type: CameraCoachQaEventType, detail: string | null = null) => {
    setQaSnapshot(qaTelemetry.record(type, detail));
  }, [qaTelemetry]);

  useEffect(() => {
    cueAtRef.current = cueAt;
  }, [cueAt]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    let active = true;
    void handsFreeCoach.getAvailability().then((availability) => {
      if (!active) return;
      setHandsFreeAvailable(availability.available);
      setHandsFreeMessage(availability.available
        ? 'Ready. Voice control can confirm reps, pause, resume, and start the next rep.'
        : 'Button fallback active. Native listening requires a development or production build.');
    });

    return () => {
      active = false;
      void handsFreeCoach.abort();
      handsFreeCoach.dispose();
      speechRecognizer.dispose();
      void poseShadow.disable();
      void spokenCoach.stop();
    };
  }, [handsFreeCoach, poseShadow, speechRecognizer, spokenCoach]);

  const runtime = useMemo(() => {
    if (!dog) return null;

    const vision = new ProductionDogVisionEngine();
    const session = createLiveCoachSession({
      id: `camera-${dog.id}-${Date.now()}`,
      dogId: dog.id,
      lessonId: route.params.lessonId,
      targetReps: 5,
    });
    const orchestrator = new CameraCoachOrchestrator(session, vision, { minFrameIntervalMs: 650 });

    const source = new ExpoCameraFrameSource(async () => {
      if (!cameraReady || !cameraRef.current || pausedRef.current) return null;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.2,
          skipProcessing: false,
          shutterSound: false,
        });
        if (!photo?.uri) return null;
        return { uri: photo.uri, width: photo.width, height: photo.height };
      } catch {
        return null;
      }
    }, 800);

    return { source, orchestrator };
  }, [cameraReady, dog, route.params.lessonId]);

  const sessionComplete = runtime?.orchestrator.getSession().status === 'complete';

  const startHandsFreeListening = useCallback(async (mode: HandsFreeListenMode): Promise<void> => {
    if (handsFreeListening) return;
    setHandsFreeMessage('Starting microphone…');
    try {
      const started = await handsFreeCoach.start();
      setHandsFreeListening(started);
      setHandsFreeMessage(started
        ? mode === 'confirmation'
          ? 'Listening… say yes, partial, no, pause, repeat, or stop.'
          : mode === 'paused'
            ? 'Paused and listening… say resume or stop.'
            : 'Listening… say ready, next rep, pause, repeat, or stop.'
        : 'Speech recognition is unavailable or microphone permission was not granted.');
    } catch {
      setHandsFreeListening(false);
      setHandsFreeMessage('Could not start speech recognition. Use the buttons instead.');
    }
  }, [handsFreeCoach, handsFreeListening]);

  const persistIfComplete = useCallback(async (session: LiveCoachSession): Promise<void> => {
    if (session.status !== 'complete') return;
    completedSessionRef.current = session;
    if (persistedSessionIdRef.current === session.id) return;

    const startedAt = sessionStartedAtRef.current;
    if (!startedAt) return;

    const lesson = loadBundledLessonCatalogue().findById(route.params.lessonId);
    if (!lesson) {
      setSaveState('error');
      recordQa('save_failed', 'lesson_mapping');
      setDiagnostics((current) => ({ ...current, lastResult: 'Could not map this lesson to the curriculum for saving.' }));
      return;
    }

    persistedSessionIdRef.current = session.id;
    setSaveState('saving');
    try {
      await persistCompletedLiveCoachSession({
        session,
        skillId: lesson.skill,
        dailyPlanId: route.params.dailyPlanId ?? null,
        startedAt,
        notes: 'Completed with Camera Coach.',
      });
      recordQa('save_succeeded', session.id);
      setDebrief(buildSessionDebrief(session));
      setSaveState('saved');
      setDiagnostics((current) => ({ ...current, lastResult: 'Session saved to training memory and history.' }));
      await spokenCoach.announce({ type: 'session_finished' });
    } catch {
      persistedSessionIdRef.current = null;
      recordQa('save_failed', session.id);
      setSaveState('error');
      setDiagnostics((current) => ({ ...current, lastResult: 'Session finished but could not be saved safely.' }));
    }
  }, [recordQa, route.params.dailyPlanId, route.params.lessonId, spokenCoach]);

  const startNextRep = useCallback(() => {
    if (!runtime || pausedRef.current) return;
    if (runtime.orchestrator.getSession().status === 'complete') return;
    if (runtime.orchestrator.getPendingConfirmation()) return;
    if (cueAtRef.current) return;

    const startedAt = new Date().toISOString();
    const repNumber = runtime.orchestrator.getSession().reps.length + 1;
    cueAtRef.current = startedAt;
    setCueAt(startedAt);
    recordQa('rep_started', `rep-${repNumber}`);
    setHandsFreeMessage(`Rep ${repNumber} started. Give the cue once.`);
    void spokenCoach.announce({ type: 'rep_started', repNumber });
  }, [recordQa, runtime, spokenCoach]);

  const pauseTraining = useCallback(() => {
    if (!runtime || !running || pausedRef.current || sessionComplete) return;
    void handsFreeCoach.abort();
    setHandsFreeListening(false);
    if (cueAtRef.current) {
      cueAtRef.current = null;
      setCueAt(null);
      recordQa('rep_cancelled_for_pause', 'active_cue_cancelled');
    }
    pausedRef.current = true;
    setPaused(true);
    void runtime.source.stop();
    recordQa('session_paused');
    setHandsFreeMessage('Training paused. No rep will be scored while paused.');
    setDiagnostics((current) => ({ ...current, lastResult: 'Training paused by owner.' }));
    void spokenCoach.announce({ type: 'session_paused' }).then(() => {
      if (handsFreeAvailable) void startHandsFreeListening('paused');
    });
  }, [handsFreeAvailable, handsFreeCoach, recordQa, running, runtime, sessionComplete, spokenCoach, startHandsFreeListening]);

  const resumeTraining = useCallback(() => {
    if (!runtime || !running || !pausedRef.current || sessionComplete) return;
    void handsFreeCoach.abort();
    setHandsFreeListening(false);
    pausedRef.current = false;
    setPaused(false);
    void runtime.source.start();
    recordQa('session_resumed');
    setHandsFreeMessage('Training resumed. Continuing the same session.');
    setDiagnostics((current) => ({ ...current, lastResult: 'Training resumed.' }));
    void spokenCoach.announce({ type: 'session_resumed' }).then(() => {
      if (!handsFreeAvailable) return;
      if (runtime.orchestrator.getPendingConfirmation()) void startHandsFreeListening('confirmation');
      else void startHandsFreeListening('next-rep');
    });
  }, [handsFreeAvailable, handsFreeCoach, recordQa, running, runtime, sessionComplete, spokenCoach, startHandsFreeListening]);

  useEffect(() => {
    if (!runtime || !running) return;

    let active = true;
    const unsubscribe = runtime.source.subscribe((frame) => {
      if (!active || pausedRef.current) return;
      recordQa('frame_captured', frame.id);
      setDiagnostics((current) => ({
        ...current,
        framesCaptured: current.framesCaptured + 1,
        lastFrameAt: frame.capturedAt,
      }));

      if (poseShadow.getStatus().state === 'ready') {
        void poseShadow.analyse(frame).then((observation) => {
          if (!active) return;
          setPoseShadowStatus(poseShadow.getStatus());
          if (!observation) return;
          setPoseShadowObservation(observation);
          setPoseShadowLabelled(false);
        });
      }

      const activeCueAt = cueAtRef.current;
      if (runtime.orchestrator.getPendingConfirmation()) return;

      void runtime.orchestrator.processFrame(frame, {
        outcome: 'partial-success',
        expectedPosture: expectedCue?.expectedPosture ?? null,
        responseWindowMs: expectedCue?.responseWindowMs ?? null,
        observedAt: frame.capturedAt,
        cueAt: activeCueAt,
        responseAt: frame.capturedAt,
        markerAt: null,
        rewardAt: null,
        cueCount: 1,
        signal: null,
        notes: expectedCue
          ? `Camera Coach cue ${expectedCue.cueLabel}; response window ${expectedCue.responseWindowMs}ms.`
          : 'Camera Coach observation requires owner confirmation because this lesson has no certified posture-only success criterion.',
      }).then((result) => {
        if (!active || pausedRef.current) return;
        setLatestVision(runtime.orchestrator.getLastVisionResult());
        setSessionSnapshot(result.session);
        if (result.kind === 'dog_not_in_view') {
          setPending(null);
          setDiagnostics((current) => ({ ...current, lastResult: 'Dog not in view. No rep can be scored.' }));
        } else if (result.kind === 'owner_confirmation') {
          recordQa('frame_analysed', frame.id);
          recordQa('owner_confirmation_requested', result.pending.reason);
          setPending(result.pending);
          setDiagnostics((current) => ({
            ...current,
            framesAnalysed: current.framesAnalysed + 1,
            lastResult: `Owner confirmation: ${result.pending.reason}`,
          }));
          void spokenCoach.announce({ type: 'owner_confirmation', pending: result.pending }).then(() => {
            if (handsFreeAvailable) void startHandsFreeListening('confirmation');
          });
        } else if (result.kind === 'waiting_for_transition') {
          setDiagnostics((current) => ({
            ...current,
            lastResult: 'Waiting for the dog to leave the previous posture before scoring again.',
          }));
        } else if (result.kind === 'rep_recorded') {
          recordQa('frame_analysed', frame.id);
          recordQa('automatic_rep_recorded', result.rep.id);
          setLastDecision(result.decision);
          cueAtRef.current = null;
          setCueAt(null);
          setDiagnostics((current) => ({
            ...current,
            framesAnalysed: current.framesAnalysed + 1,
            lastResult: `Rep ${result.rep.repNumber} recorded`,
          }));
          void spokenCoach.announce({ type: 'director_decision', decision: result.decision }).then(() => {
            if (
              handsFreeAvailable &&
              result.session.status === 'active' &&
              result.decision.action !== 'break'
            ) {
              void startHandsFreeListening('next-rep');
            }
          });
          void persistIfComplete(result.session);
        }
      });
    });

    void runtime.orchestrator.warmup().then(() => {
      if (active && !pausedRef.current) return runtime.source.start();
      return undefined;
    });

    return () => {
      active = false;
      unsubscribe();
      void runtime.source.stop();
      void runtime.orchestrator.dispose();
      void handsFreeCoach.abort();
      setHandsFreeListening(false);
      void spokenCoach.stop();
    };
  }, [expectedCue, handsFreeAvailable, handsFreeCoach, persistIfComplete, poseShadow, recordQa, running, runtime, spokenCoach, startHandsFreeListening]);

  useEffect(() => {
    if (sessionComplete && runtime) void runtime.source.stop();
  }, [runtime, sessionComplete]);

  const startCoach = () => {
    const startedAt = new Date().toISOString();
    sessionStartedAtRef.current = startedAt;
    completedSessionRef.current = null;
    persistedSessionIdRef.current = null;
    qaTelemetry.reset();
    setQaSnapshot(qaTelemetry.record('session_started', route.params.lessonId, startedAt));
    pausedRef.current = false;
    setPaused(false);
    setDebrief(null);
    setLastTranscript(null);
    setLatestVision(null);
    setSessionSnapshot(runtime?.orchestrator.getSession() ?? null);
    setRunning(true);
    setSaveState('idle');
    void spokenCoach.announce({ type: 'session_started', dogName: dog?.name ?? 'your dog' }).then(() => {
      if (handsFreeAvailable) void startHandsFreeListening('next-rep');
    });
  };

  const confirm = useCallback((outcome: TrainingOutcome) => {
    if (!runtime || !pending || pausedRef.current) return;
    void handsFreeCoach.abort();
    setHandsFreeListening(false);
    const result = runtime.orchestrator.confirmPendingByOwner(outcome, new Date().toISOString());
    setPending(null);
    cueAtRef.current = null;
    setCueAt(null);
    if (result.kind === 'rep_recorded') {
      recordQa('owner_confirmation_recorded', result.rep.id);
      setLastDecision(result.decision);
      setDiagnostics((current) => ({ ...current, lastResult: `Rep ${result.rep.repNumber} owner-confirmed` }));
      void spokenCoach.announce({ type: 'director_decision', decision: result.decision }).then(() => {
        if (
          handsFreeAvailable &&
          result.session.status === 'active' &&
          result.decision.action !== 'break'
        ) {
          void startHandsFreeListening('next-rep');
        }
      });
      void persistIfComplete(result.session);
    }
  }, [handsFreeAvailable, handsFreeCoach, pending, persistIfComplete, recordQa, runtime, spokenCoach, startHandsFreeListening]);

  useEffect(() => handsFreeCoach.onEvent((event) => {
    if (event.type === 'error') {
      recordQa('voice_error', event.message);
      setHandsFreeListening(false);
      setHandsFreeMessage(`Listening error: ${event.message}. Use the buttons if needed.`);
      return;
    }

    setLastTranscript(event.transcript);
    setHandsFreeListening(false);
    void handsFreeCoach.stop();

    if (event.type === 'unclear') {
      recordQa('voice_unclear', event.transcript);
      setHandsFreeMessage(`I heard “${event.transcript}” but did not treat it as a training command.`);
      return;
    }

    recordQa('voice_command', event.intent);

    if (event.intent === 'repeat') {
      setHandsFreeMessage('Repeating the last coaching instruction.');
      void spokenCoach.repeatLast().then(() => {
        if (pausedRef.current && handsFreeAvailable) void startHandsFreeListening('paused');
        else if (pending && handsFreeAvailable) void startHandsFreeListening('confirmation');
        else if (running && !cueAtRef.current && !sessionComplete && handsFreeAvailable) void startHandsFreeListening('next-rep');
      });
      return;
    }

    if (event.intent === 'stop') {
      if (!runtime) return;
      const stopped = runtime.orchestrator.stopByOwner();
      setPending(null);
      cueAtRef.current = null;
      setCueAt(null);
      pausedRef.current = false;
      setPaused(false);
      setRunning(false);
      setHandsFreeMessage('Session stopped by owner voice command.');
      setDiagnostics((current) => ({ ...current, lastResult: 'Session stopped by owner.' }));
      if (stopped.reps.length > 0) void persistIfComplete(stopped);
      return;
    }

    if (event.intent === 'pause') {
      pauseTraining();
      return;
    }

    if (event.intent === 'resume') {
      if (!pausedRef.current) {
        setHandsFreeMessage('Training is not paused, so “resume” did not change anything.');
        return;
      }
      resumeTraining();
      return;
    }

    if (event.intent === 'next-rep') {
      if (!runtime || !running) {
        setHandsFreeMessage('The coach is not running, so “next rep” did not change anything.');
        return;
      }
      if (pausedRef.current) {
        setHandsFreeMessage('Training is paused. Say resume before starting another rep.');
        return;
      }
      if (pending) {
        setHandsFreeMessage('Confirm the current rep before starting another one.');
        return;
      }
      if (cueAtRef.current) {
        setHandsFreeMessage('A rep is already being watched.');
        return;
      }
      if (runtime.orchestrator.getSession().status === 'complete') {
        setHandsFreeMessage('This session is already complete.');
        return;
      }
      setHandsFreeMessage('Starting the next rep.');
      startNextRep();
      return;
    }

    if (pausedRef.current) {
      setHandsFreeMessage('Training is paused. Say resume before scoring or starting another rep.');
      return;
    }

    if (!pending) {
      setHandsFreeMessage('I heard a score, but no rep is waiting for confirmation, so nothing changed.');
      return;
    }

    if (event.intent === 'success') confirm('success');
    else if (event.intent === 'partial-success') confirm('partial-success');
    else if (event.intent === 'unsuccessful') confirm('unsuccessful');
  }), [confirm, handsFreeAvailable, handsFreeCoach, pauseTraining, pending, persistIfComplete, recordQa, resumeTraining, running, runtime, sessionComplete, spokenCoach, startHandsFreeListening, startNextRep]);

  const retrySave = () => {
    if (completedSessionRef.current) void persistIfComplete(completedSessionRef.current);
  };

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    void spokenCoach.setEnabled(next);
  };

  const togglePoseShadow = async () => {
    const current = poseShadow.getStatus();
    if (current.state === 'ready' || current.state === 'loading') {
      await poseShadow.disable();
      setPoseShadowStatus(poseShadow.getStatus());
      setPoseShadowObservation(null);
      setPoseShadowLabelled(false);
      setPoseValidationReport(null);
      return;
    }

    setPoseShadowStatus({ state: 'loading' });
    setPoseShadowObservation(null);
    setPoseShadowLabelled(false);
    setPoseValidationReport(null);
    const next = await poseShadow.enable();
    setPoseShadowStatus(next);
  };

  const labelPoseShadowPrediction = async (groundTruth: PoseShadowGroundTruth) => {
    if (!dog || !poseShadowObservation || poseShadowObservation.posture === 'unknown' || poseShadowObservation.postureConfidence === null || poseShadowLabelled) return;

    const posture = poseShadowObservation.posture;
    setPoseShadowLabelled(true);
    try {
      await recordPoseShadowValidationSample({
        id: `pose-shadow-${dog.id}-${Date.now()}`,
        dogId: dog.id,
        lessonId: route.params.lessonId,
        expectedPosture: posture,
        predictedPosture: posture,
        confidence: poseShadowObservation.postureConfidence,
        groundTruth,
        recordedAt: new Date().toISOString(),
      });
      setPoseValidationReport(await loadPoseShadowValidationReport(dog.id, posture));
      setDiagnostics((current) => ({ ...current, lastResult: `Pose calibration saved: AI ${posture}, owner ${groundTruth}.` }));
    } catch {
      setPoseShadowLabelled(false);
      setDiagnostics((current) => ({ ...current, lastResult: 'Could not save pose calibration label.' }));
    }
  };

  if (!permission) {
    return <AppScreen><Text style={styles.body}>Checking camera permission…</Text></AppScreen>;
  }

  if (!permission.granted) {
    return (
      <AppScreen>
        <View style={styles.card}>
          <Text style={styles.title}>Camera Coach</Text>
          <Text style={styles.body}>Camera access is required for live visual coaching. Video is not automatically scored unless evidence is confident enough.</Text>
          <AppButton title="Allow camera access" onPress={() => void requestPermission()} />
        </View>
      </AppScreen>
    );
  }

  const latestQaEvent = qaSnapshot.recentEvents[qaSnapshot.recentEvents.length - 1] ?? null;
  const visionDiagnostics = poseShadow.getDiagnostics();

  return (
    <AppScreen>
      <Text style={styles.title}>Camera Coach</Text>
      <Text style={styles.body}>{dog?.name ?? 'Your dog'} · {route.params.lessonId}</Text>
      <AppButton title={showDiagnostics ? 'Hide developer diagnostics' : 'Developer diagnostics'} onPress={() => setShowDiagnostics((current) => !current)} />

      <View style={styles.previewShell} {...cameraPanResponder.panHandlers}>
        <CameraView
          ref={cameraRef}
          style={styles.preview}
          facing="back"
          mode="picture"
          zoom={cameraZoom}
          onCameraReady={() => setCameraReady(true)}
        />
        {latestVision?.dogBoundingBox ? (
          <View
            pointerEvents="none"
            style={[
              styles.trackingBox,
              {
                left: `${latestVision.dogBoundingBox.left * 100}%`,
                top: `${latestVision.dogBoundingBox.top * 100}%`,
                width: `${latestVision.dogBoundingBox.width * 100}%`,
                height: `${latestVision.dogBoundingBox.height * 100}%`,
              },
            ]}
          />
        ) : null}
        <View pointerEvents="none" style={styles.poseGuideBox}>
          <Text style={styles.poseGuideText}>KEEP DOG INSIDE THIS SQUARE</Text>
        </View>
        <View pointerEvents="none" style={styles.visionStatus}>
          <Text style={styles.visionStatusText}>{liveVisionStatus(latestVision, smartFraming)}</Text>
        </View>

        <View pointerEvents="none" style={styles.framingStatus}>
          <Text style={styles.framingStatusText}>{smartFraming.instruction}</Text>
        </View>

        <View pointerEvents="none" style={styles.lessonOverlay}>
          <Text style={styles.lessonOverlayTitle}>{route.params.lessonId}</Text>
          <Text style={styles.lessonOverlayRep}>{sessionSnapshot ? `${sessionSnapshot.reps.length} / ${sessionSnapshot.targetReps}` : '0 / 5'} reps</Text>
          <Text style={styles.lessonOverlayInstruction}>{smartFraming.ready ? (cueAt ? 'Watching your dog…' : 'Ready when you are.') : smartFraming.instruction}</Text>
        </View>

        <View style={styles.zoomControls}>
          {[0, 0.5, 1].map((level, index) => {
            const selected = cameraZoom === level;

            return (
              <AppButton
                key={level}
                title={`${index + 1}×`}
                onPress={() => setCameraZoom(level)}
                disabled={selected}
              />
            );
          })}
        </View>

        {showDiagnostics && poseShadowObservation?.pose ? (
          <Svg
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            {DEBUG_POSE_BONES.map(([from, to]) => {
              const a = poseShadowObservation.pose?.keypoints[from];
              const b = poseShadowObservation.pose?.keypoints[to];

              if (!a || !b) return null;

              return (
                <Line
                  key={`${from}-${to}`}
                  x1={a.x * 1000}
                  y1={a.y * 1000}
                  x2={b.x * 1000}
                  y2={b.y * 1000}
                  stroke="#00E5FF"
                  strokeWidth={5}
                  opacity={Math.max(
                    0.2,
                    Math.min(a.confidence, b.confidence),
                  )}
                />
              );
            })}

            {Object.entries(poseShadowObservation.pose.keypoints).map(
              ([name, point]) => (
                <Circle
                  key={name}
                  cx={point.x * 1000}
                  cy={point.y * 1000}
                  r={10}
                  fill="#FFD54A"
                  stroke="#000000"
                  strokeWidth={3}
                  opacity={Math.max(0.3, point.confidence)}
                />
              ),
            )}
          </Svg>
        ) : null}

        {showDiagnostics ? <View pointerEvents="none" style={styles.poseDebugOverlay}>
          <Text style={styles.poseDebugText}>
            VISION: {poseShadowStatus.state}
          </Text>
          <Text style={styles.poseDebugText}>
            DOG: {poseShadowObservation?.detectionConfidence == null
              ? 'n/a'
              : poseShadowObservation.detectionConfidence.toFixed(2)}
          </Text>
          <Text style={styles.poseDebugText}>
            POSTURE: {poseShadowObservation?.posture ?? 'waiting'}
          </Text>
          <Text style={styles.poseDebugReason}>
            {poseShadowObservation?.postureReason ?? 'Waiting for pose analysis'}
          </Text>
        </View> : null}

        <View style={styles.cockpitControls}>
          {paused ? (
            <AppButton title="Resume" onPress={resumeTraining} />
          ) : running && !sessionComplete ? (
            <AppButton title="Pause" onPress={pauseTraining} />
          ) : null}
          {!paused && running && !cueAt && !pending && !sessionComplete ? (
            <AppButton title="Next rep" onPress={startNextRep} />
          ) : null}
        </View>
      </View>

      {showDiagnostics ? <>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Live diagnostics</Text>
        <Text style={styles.body}>Camera: {cameraReady ? 'ready' : 'starting'}</Text>
        <Text style={styles.body}>Session state: {paused ? 'paused' : running ? 'running' : sessionComplete ? 'complete' : 'idle'}</Text>
        <Text style={styles.body}>Spoken coach: {voiceEnabled ? 'on' : 'off'}</Text>
        <Text style={styles.body}>Hands-free control: {handsFreeAvailable === null ? 'checking' : handsFreeAvailable ? (handsFreeListening ? 'listening' : 'available') : 'button fallback'}</Text>
        <Text style={styles.body}>AI Vision: on-device 17-joint pose analysis</Text>
        <Text style={styles.body}>Automatic scoring: enabled only for certified posture lessons; otherwise owner confirmation remains authoritative</Text>
        <Text style={styles.body}>Session memory: {saveState === 'saved' ? 'saved' : saveState === 'saving' ? 'saving' : saveState === 'error' ? 'save error' : 'waiting for completion'}</Text>
        <Text style={styles.body}>Frames sampled: {diagnostics.framesCaptured}</Text>
        <Text style={styles.body}>Frames analysed: {diagnostics.framesAnalysed}</Text>
        <Text style={styles.body}>Last result: {diagnostics.lastResult}</Text>
        <AppButton title={voiceEnabled ? 'Turn spoken coaching off' : 'Turn spoken coaching on'} onPress={toggleVoice} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Real vision · shadow test</Text>
        <Text style={styles.body}>Shadow mode is an optional calibration tool. Live Camera Coach now uses the same on-device 17-joint ONNX pipeline; calibration labels never change training progress.</Text>
        <Text style={styles.body}>Status: {poseShadowStatus.state}{poseShadowStatus.state === 'error' ? ` · ${poseShadowStatus.message}` : ''}</Text>
        <Text style={styles.body}>Vision health: {visionDiagnostics.framesAnalysed}/{visionDiagnostics.framesRequested} completed · {visionDiagnostics.framesSkippedBusy} skipped busy · {visionDiagnostics.inferenceErrors} errors</Text>
        <Text style={styles.body}>Last inference: {visionDiagnostics.lastInferenceAt ?? 'none'} · ONNX {visionDiagnostics.lastInferenceMs ?? 'n/a'} ms · total {visionDiagnostics.lastTotalMs ?? 'n/a'} ms</Text>
        <Text style={styles.body}>Last confidence: dog {visionDiagnostics.lastDetectionConfidence === null ? 'n/a' : visionDiagnostics.lastDetectionConfidence.toFixed(2)} · posture {visionDiagnostics.lastPostureConfidence === null ? 'n/a' : visionDiagnostics.lastPostureConfidence.toFixed(2)}</Text>
        {poseShadowObservation ? (
          <>
            <Text style={styles.body}>Pose presence: {poseShadowObservation.dogDetected ? 'detected' : 'not reliable'} · confidence {poseShadowObservation.detectionConfidence === null ? 'n/a' : poseShadowObservation.detectionConfidence.toFixed(2)}</Text>
            <Text style={styles.body}>AI posture: {poseShadowObservation.posture} · confidence {poseShadowObservation.postureConfidence === null ? 'n/a' : poseShadowObservation.postureConfidence.toFixed(2)}</Text>
            <Text style={styles.body}>Posture reason: {poseShadowObservation.postureReason}</Text>
            <Text style={styles.body}>ONNX: {poseShadowObservation.inferenceMs ?? 'n/a'} ms · total pipeline: {poseShadowObservation.totalMs} ms</Text>
            {poseShadowObservation.posture !== 'unknown' && poseShadowObservation.postureConfidence !== null ? (
              <>
                <Text style={styles.body}>What was your dog actually doing? Label each prediction once. This does not change training progress.</Text>
                <AppButton title={poseShadowLabelled ? 'Ground truth saved' : 'Standing'} onPress={() => void labelPoseShadowPrediction('stand_like')} disabled={poseShadowLabelled} />
                <AppButton title="Sitting" onPress={() => void labelPoseShadowPrediction('sit_like')} disabled={poseShadowLabelled} />
                <AppButton title="Lying down" onPress={() => void labelPoseShadowPrediction('down_like')} disabled={poseShadowLabelled} />
                <AppButton title="No dog in frame" onPress={() => void labelPoseShadowPrediction('no_dog')} disabled={poseShadowLabelled} />
                <AppButton title="Unsure / skip" onPress={() => void labelPoseShadowPrediction('unsure')} disabled={poseShadowLabelled} />
              </>
            ) : null}
            {poseValidationReport ? (
              <>
                <Text style={styles.body}>Calibration samples for {poseShadowObservation.posture}: {poseValidationReport.labelledSamples}/50 usable · {poseValidationReport.unsureSamples} unsure</Text>
                <Text style={styles.body}>Precision: {poseValidationReport.precision === null ? 'n/a' : `${(poseValidationReport.precision * 100).toFixed(1)}%`} · false positives: {poseValidationReport.falsePositiveRate === null ? 'n/a' : `${(poseValidationReport.falsePositiveRate * 100).toFixed(1)}%`}</Text>
                <Text style={styles.body}>No-dog labels: {poseValidationReport.noDogSamples}</Text>
                <Text style={styles.body}>Auto-score certification: disabled until all production safety gates pass</Text>
              </>
            ) : null}
          </>
        ) : null}
        <Text style={styles.body}>First enable downloads the pinned ~13 MB model. Camera images stay on-device; only the model file is downloaded.</Text>
        <AppButton
          title={poseShadowStatus.state === 'ready' || poseShadowStatus.state === 'loading' ? 'Turn real vision shadow test off' : 'Enable real vision shadow test'}
          onPress={() => void togglePoseShadow()}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Real-device QA</Text>
        <Text style={styles.body}>Voice commands: {qaSnapshot.voiceCommands} · unclear: {qaSnapshot.unclearVoiceResults} · errors: {qaSnapshot.voiceErrors}</Text>
        <Text style={styles.body}>Owner confirmations: {qaSnapshot.ownerConfirmationsRecorded}/{qaSnapshot.ownerConfirmationsRequested}</Text>
        <Text style={styles.body}>Automatic reps: {qaSnapshot.automaticRepsRecorded} · pauses/resumes: {qaSnapshot.pauses}/{qaSnapshot.resumes}</Text>
        <Text style={styles.body}>Cancelled cues on pause: {qaSnapshot.repsCancelledForPause} · save failures: {qaSnapshot.saveFailures}</Text>
        <Text style={styles.body}>Latest QA event: {latestQaEvent ? `${latestQaEvent.type}${latestQaEvent.detail ? ` · ${latestQaEvent.detail}` : ''}` : 'none yet'}</Text>
        <Text style={styles.body}>QA diagnostics store counters/events only—no audio or camera frames.</Text>
      </View>

      </> : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hands-free owner control</Text>
        <Text style={styles.body}>{handsFreeMessage}</Text>
        {lastTranscript ? <Text style={styles.body}>Last heard: “{lastTranscript}”</Text> : null}
        {paused ? (
          <>
            <AppButton title="Resume training" onPress={resumeTraining} />
            {handsFreeAvailable && !handsFreeListening ? (
              <AppButton title="Listen for resume" onPress={() => void startHandsFreeListening('paused')} />
            ) : null}
          </>
        ) : null}
        {!paused && pending && handsFreeAvailable && !handsFreeListening ? (
          <AppButton title="Listen for my answer" onPress={() => void startHandsFreeListening('confirmation')} />
        ) : null}
        {!paused && running && !pending && !cueAt && !sessionComplete && handsFreeAvailable && !handsFreeListening ? (
          <AppButton title="Listen for next rep" onPress={() => void startHandsFreeListening('next-rep')} />
        ) : null}
        {running && !paused && !sessionComplete ? <AppButton title="Pause training" onPress={pauseTraining} /> : null}
      </View>

      {!running ? (
        <AppButton title="Start Camera Coach" onPress={startCoach} disabled={!cameraReady || !runtime || sessionComplete} />
      ) : !paused && !cueAt && !pending && !sessionComplete && saveState !== 'saving' ? (
        <AppButton title="Start next rep" onPress={startNextRep} />
      ) : null}

      {cueAt && !pending && !paused ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Watching this rep…</Text>
          <Text style={styles.body}>Give the cue once. Camera Coach is sampling the response.</Text>
        </View>
      ) : null}

      {pending ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Confirm what happened</Text>
          <Text style={styles.body}>Automatic evidence is not confident enough yet ({pending.reason}). Your answer becomes the authoritative score.</Text>
          {paused
            ? <Text style={styles.body}>This confirmation is preserved while paused. Resume before scoring it.</Text>
            : <Text style={styles.body}>Say “yes”, “partial”, “no”, “pause”, “repeat”, or “stop” when hands-free listening is available.</Text>}
          <AppButton title="Success" onPress={() => confirm('success')} disabled={paused} />
          <AppButton title="Partial success" onPress={() => confirm('partial-success')} disabled={paused} />
          <AppButton title="Not successful" onPress={() => confirm('unsuccessful')} disabled={paused} />
        </View>
      ) : null}

      {saveState === 'error' ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Session save needs retry</Text>
          <Text style={styles.body}>The completed session is still held in memory. Retrying will use the same session ID, so it will not create a duplicate.</Text>
          <AppButton title="Retry saving session" onPress={retrySave} />
        </View>
      ) : null}

      {saveState === 'saved' && debrief ? (
        <View style={debrief.safetyNote ? styles.safetyCard : styles.debriefCard}>
          <Text style={styles.eyebrow}>TRAINER DEBRIEF</Text>
          <Text style={styles.sectionTitle}>{debrief.headline}</Text>
          <Text style={styles.body}>{debrief.summary}</Text>
          <Text style={styles.debriefLabel}>What mattered most</Text>
          <Text style={styles.body}>{debrief.strongestSignal}</Text>
          {debrief.mainBreakdown ? <>
            <Text style={styles.debriefLabel}>Why it may have broken down</Text>
            <Text style={styles.body}>{debrief.mainBreakdown}</Text>
          </> : null}
          <Text style={styles.debriefLabel}>Coach tip for you</Text>
          <Text style={styles.body}>{debrief.ownerCoachingTip}</Text>
          <Text style={styles.debriefLabel}>Next session</Text>
          <Text style={styles.body}>{debrief.nextSessionRecommendation}</Text>
          {debrief.safetyNote ? <Text style={styles.safetyText}>{debrief.safetyNote}</Text> : null}
        </View>
      ) : null}

      {saveState === 'saved' ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Training memory updated</Text>
          <Text style={styles.body}>This session is now part of the evidence Good Dog Academy uses to adapt the next lessons and the remaining training week.</Text>
          <AppButton title="See updated 7-day program" onPress={() => navigation.navigate('AdaptiveProgram')} />
          <AppButton title="View training intelligence" onPress={() => navigation.navigate('TrainingIntelligence')} />
        </View>
      ) : null}

      {lastDecision ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{lastDecision.headline}</Text>
          <Text style={styles.body}>{lastDecision.instruction}</Text>
          <Text style={styles.body}>Director action: {lastDecision.action}</Text>
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', color: '#18212E' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#18212E' },
  eyebrow: { fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 1, color: '#2F8148' },
  debriefLabel: { fontSize: 12, lineHeight: 17, fontWeight: '800', color: '#0B2545', marginTop: 4 },
  body: { fontSize: 15, lineHeight: 21, color: '#66707C' },
  safetyText: { fontSize: 13, lineHeight: 19, fontWeight: '700', color: '#984B3E' },
  previewShell: { overflow: 'hidden', borderRadius: 20, minHeight: 360, backgroundColor: '#0B2545' },
  preview: { flex: 1, minHeight: 360 },
  poseGuideBox: { position: 'absolute', alignSelf: 'center', top: '8%', width: '84%', aspectRatio: 1, borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 18, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8 },
  poseGuideText: { fontSize: 10, lineHeight: 14, fontWeight: '900', letterSpacing: 0.8, color: '#FFFFFF', backgroundColor: 'rgba(11,37,69,0.72)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  visionStatus: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 16,
    alignItems: 'center',
  },
  visionStatusText: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: 'rgba(11,37,69,0.84)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  trackingBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  lessonOverlay: {
    position: 'absolute',
    left: 12,
    top: 64,
    maxWidth: '72%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(11,37,69,0.84)',
  },
  lessonOverlayTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  lessonOverlayRep: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 2 },
  lessonOverlayInstruction: { color: '#FFFFFF', fontSize: 13, lineHeight: 18, marginTop: 2 },
  framingStatus: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 64,
    alignItems: 'center',
  },
  framingStatusText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: 'rgba(11,37,69,0.82)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  cockpitControls: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  zoomControls: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomLabel: {
    minWidth: 48,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
  },
  poseDebugOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  poseDebugText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },
  poseDebugReason: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 16,
  },
  card: { gap: 10, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF' },
  debriefCard: { gap: 8, padding: 16, borderRadius: 18, backgroundColor: '#EDF5E9', borderWidth: 1, borderColor: '#CFE2C8' },
  safetyCard: { gap: 8, padding: 16, borderRadius: 18, backgroundColor: '#F8E7E2', borderWidth: 1, borderColor: '#E2C3BB' },
});