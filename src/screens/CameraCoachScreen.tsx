import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppScreen } from '../components/AppScreen';
import {
  createLiveCoachSession,
  type LiveCoachSession,
  type SessionDirectorDecision,
} from '../domain/behaviour/LiveCoachEngine';
import { CameraCoachOrchestrator, type CameraCoachPendingConfirmation } from '../domain/camera/CameraCoachOrchestrator';
import type { TrainingOutcome } from '../domain/models/TrainingSession';
import { loadBundledLessonCatalogue } from '../features/lessons/catalogue';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { persistCompletedLiveCoachSession } from '../services/AdaptiveTrainingPersistenceService';
import { ExpoCameraFrameSource } from '../services/camera/ExpoCameraFrameSource';
import { ExpoCoachSpeech } from '../services/speech/ExpoCoachSpeech';
import { SpokenCoachController } from '../services/speech/SpokenCoachController';
import { OwnerFallbackVisionEngine } from '../services/vision/OwnerFallbackVisionEngine';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraCoach'>;

type Diagnostics = {
  framesCaptured: number;
  framesAnalysed: number;
  lastFrameAt: string | null;
  lastResult: string;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function CameraCoachScreen({ route, navigation }: Props): React.JSX.Element {
  const { status } = useOnboarding();
  const dog = status?.state === 'complete' ? status.dog : null;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const cueAtRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<string | null>(null);
  const completedSessionRef = useRef<LiveCoachSession | null>(null);
  const persistedSessionIdRef = useRef<string | null>(null);
  const spokenCoach = useMemo(() => new SpokenCoachController(new ExpoCoachSpeech()), []);
  const [cameraReady, setCameraReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [cueAt, setCueAt] = useState<string | null>(null);
  const [pending, setPending] = useState<CameraCoachPendingConfirmation | null>(null);
  const [lastDecision, setLastDecision] = useState<SessionDirectorDecision | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [diagnostics, setDiagnostics] = useState<Diagnostics>({
    framesCaptured: 0,
    framesAnalysed: 0,
    lastFrameAt: null,
    lastResult: 'Idle',
  });

  useEffect(() => {
    cueAtRef.current = cueAt;
  }, [cueAt]);

  useEffect(() => () => {
    void spokenCoach.stop();
  }, [spokenCoach]);

  const runtime = useMemo(() => {
    if (!dog) return null;

    const vision = new OwnerFallbackVisionEngine();
    const session = createLiveCoachSession({
      id: `camera-${dog.id}-${Date.now()}`,
      dogId: dog.id,
      lessonId: route.params.lessonId,
      targetReps: 5,
    });
    const orchestrator = new CameraCoachOrchestrator(session, vision, { minFrameIntervalMs: 650 });

    const source = new ExpoCameraFrameSource(async () => {
      if (!cameraReady || !cameraRef.current) return null;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.2,
          skipProcessing: true,
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

  const persistIfComplete = useCallback(async (session: LiveCoachSession): Promise<void> => {
    if (session.status !== 'complete') return;
    completedSessionRef.current = session;
    if (persistedSessionIdRef.current === session.id) return;

    const startedAt = sessionStartedAtRef.current;
    if (!startedAt) return;

    const lesson = loadBundledLessonCatalogue().findById(route.params.lessonId);
    if (!lesson) {
      setSaveState('error');
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
      setSaveState('saved');
      setDiagnostics((current) => ({ ...current, lastResult: 'Session saved to training memory and history.' }));
      void spokenCoach.announce({ type: 'session_finished' });
    } catch {
      persistedSessionIdRef.current = null;
      setSaveState('error');
      setDiagnostics((current) => ({ ...current, lastResult: 'Session finished but could not be saved safely.' }));
    }
  }, [route.params.dailyPlanId, route.params.lessonId, spokenCoach]);

  useEffect(() => {
    if (!runtime || !running) return;

    let active = true;
    const unsubscribe = runtime.source.subscribe((frame) => {
      if (!active) return;
      setDiagnostics((current) => ({
        ...current,
        framesCaptured: current.framesCaptured + 1,
        lastFrameAt: frame.capturedAt,
      }));

      const activeCueAt = cueAtRef.current;
      if (!activeCueAt || runtime.orchestrator.getPendingConfirmation()) return;

      void runtime.orchestrator.processFrame(frame, {
        outcome: 'partial-success',
        observedAt: frame.capturedAt,
        cueAt: activeCueAt,
        responseAt: frame.capturedAt,
        markerAt: null,
        rewardAt: null,
        cueCount: 1,
        signal: null,
        notes: 'Camera Coach native preview observation.',
      }).then((result) => {
        if (!active) return;
        if (result.kind === 'owner_confirmation') {
          setPending(result.pending);
          void spokenCoach.announce({ type: 'owner_confirmation', pending: result.pending });
          setDiagnostics((current) => ({
            ...current,
            framesAnalysed: current.framesAnalysed + 1,
            lastResult: `Owner confirmation: ${result.pending.reason}`,
          }));
        } else if (result.kind === 'rep_recorded') {
          setLastDecision(result.decision);
          void spokenCoach.announce({ type: 'director_decision', decision: result.decision });
          cueAtRef.current = null;
          setCueAt(null);
          setDiagnostics((current) => ({
            ...current,
            framesAnalysed: current.framesAnalysed + 1,
            lastResult: `Rep ${result.rep.repNumber} recorded`,
          }));
          void persistIfComplete(result.session);
        }
      });
    });

    void runtime.orchestrator.warmup().then(() => {
      if (active) return runtime.source.start();
      return undefined;
    });

    return () => {
      active = false;
      unsubscribe();
      void runtime.source.stop();
      void runtime.orchestrator.dispose();
      void spokenCoach.stop();
    };
  }, [persistIfComplete, running, runtime, spokenCoach]);

  useEffect(() => {
    if (sessionComplete && runtime) void runtime.source.stop();
  }, [runtime, sessionComplete]);

  const startCoach = () => {
    const startedAt = new Date().toISOString();
    sessionStartedAtRef.current = startedAt;
    completedSessionRef.current = null;
    persistedSessionIdRef.current = null;
    setRunning(true);
    setSaveState('idle');
    void spokenCoach.announce({ type: 'session_started', dogName: dog?.name ?? 'your dog' });
  };

  const startNextRep = () => {
    const startedAt = new Date().toISOString();
    const repNumber = (runtime?.orchestrator.getSession().reps.length ?? 0) + 1;
    cueAtRef.current = startedAt;
    setCueAt(startedAt);
    void spokenCoach.announce({ type: 'rep_started', repNumber });
  };

  const confirm = (outcome: TrainingOutcome) => {
    if (!runtime || !pending) return;
    const result = runtime.orchestrator.confirmPendingByOwner(outcome, new Date().toISOString());
    setPending(null);
    cueAtRef.current = null;
    setCueAt(null);
    if (result.kind === 'rep_recorded') {
      setLastDecision(result.decision);
      void spokenCoach.announce({ type: 'director_decision', decision: result.decision });
      setDiagnostics((current) => ({ ...current, lastResult: `Rep ${result.rep.repNumber} owner-confirmed` }));
      void persistIfComplete(result.session);
    }
  };

  const retrySave = () => {
    if (completedSessionRef.current) void persistIfComplete(completedSessionRef.current);
  };

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    void spokenCoach.setEnabled(next);
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

  return (
    <AppScreen>
      <Text style={styles.title}>Camera Coach</Text>
      <Text style={styles.body}>{dog?.name ?? 'Your dog'} · {route.params.lessonId}</Text>

      <View style={styles.previewShell}>
        <CameraView
          ref={cameraRef}
          style={styles.preview}
          facing="back"
          mode="picture"
          onCameraReady={() => setCameraReady(true)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Live diagnostics</Text>
        <Text style={styles.body}>Camera: {cameraReady ? 'ready' : 'starting'}</Text>
        <Text style={styles.body}>Voice coach: {voiceEnabled ? 'on' : 'off'}</Text>
        <Text style={styles.body}>Session memory: {saveState === 'saved' ? 'saved' : saveState === 'saving' ? 'saving' : saveState === 'error' ? 'save error' : 'waiting for completion'}</Text>
        <Text style={styles.body}>Frames sampled: {diagnostics.framesCaptured}</Text>
        <Text style={styles.body}>Frames analysed: {diagnostics.framesAnalysed}</Text>
        <Text style={styles.body}>Last result: {diagnostics.lastResult}</Text>
        <AppButton title={voiceEnabled ? 'Turn voice coaching off' : 'Turn voice coaching on'} onPress={toggleVoice} />
      </View>

      {!running ? (
        <AppButton title="Start Camera Coach" onPress={startCoach} disabled={!cameraReady || !runtime} />
      ) : !cueAt && !pending && !sessionComplete && saveState !== 'saving' ? (
        <AppButton title="Start next rep" onPress={startNextRep} />
      ) : null}

      {cueAt && !pending ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Watching this rep…</Text>
          <Text style={styles.body}>Give the cue once. Camera Coach is sampling the response.</Text>
        </View>
      ) : null}

      {pending ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Confirm what happened</Text>
          <Text style={styles.body}>Automatic evidence is not confident enough yet ({pending.reason}). Your answer becomes the authoritative score.</Text>
          <AppButton title="Success" onPress={() => confirm('success')} />
          <AppButton title="Partial success" onPress={() => confirm('partial-success')} />
          <AppButton title="Not successful" onPress={() => confirm('unsuccessful')} />
        </View>
      ) : null}

      {saveState === 'error' ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Session save needs retry</Text>
          <Text style={styles.body}>The completed session is still held in memory. Retrying will use the same session ID, so it will not create a duplicate.</Text>
          <AppButton title="Retry saving session" onPress={retrySave} />
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
  body: { fontSize: 15, lineHeight: 21, color: '#66707C' },
  previewShell: { overflow: 'hidden', borderRadius: 20, minHeight: 360, backgroundColor: '#0B2545' },
  preview: { flex: 1, minHeight: 360 },
  card: { gap: 10, padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF' },
});
