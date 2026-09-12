import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { AppScreen } from '../components/AppScreen';
import { createLiveCoachSession, type SessionDirectorDecision } from '../domain/behaviour/LiveCoachEngine';
import { CameraCoachOrchestrator, type CameraCoachPendingConfirmation } from '../domain/camera/CameraCoachOrchestrator';
import type { TrainingOutcome } from '../domain/models/TrainingSession';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { ExpoCameraFrameSource } from '../services/camera/ExpoCameraFrameSource';
import { OwnerFallbackVisionEngine } from '../services/vision/OwnerFallbackVisionEngine';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CameraCoach'>;

type Diagnostics = {
  framesCaptured: number;
  framesAnalysed: number;
  lastFrameAt: string | null;
  lastResult: string;
};

export function CameraCoachScreen({ route }: Props): React.JSX.Element {
  const { status } = useOnboarding();
  const dog = status?.state === 'complete' ? status.dog : null;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [cueAt, setCueAt] = useState<string | null>(null);
  const [pending, setPending] = useState<CameraCoachPendingConfirmation | null>(null);
  const [lastDecision, setLastDecision] = useState<SessionDirectorDecision | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics>({
    framesCaptured: 0,
    framesAnalysed: 0,
    lastFrameAt: null,
    lastResult: 'Idle',
  });

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

      if (!cueAt || runtime.orchestrator.getPendingConfirmation()) return;

      void runtime.orchestrator.processFrame(frame, {
        outcome: 'partial-success',
        observedAt: frame.capturedAt,
        cueAt,
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
          setDiagnostics((current) => ({
            ...current,
            framesAnalysed: current.framesAnalysed + 1,
            lastResult: `Owner confirmation: ${result.pending.reason}`,
          }));
        } else if (result.kind === 'rep_recorded') {
          setLastDecision(result.decision);
          setCueAt(null);
          setDiagnostics((current) => ({
            ...current,
            framesAnalysed: current.framesAnalysed + 1,
            lastResult: `Rep ${result.rep.repNumber} recorded`,
          }));
        }
      });
    });

    void runtime.orchestrator.warmup().then(() => runtime.source.start());

    return () => {
      active = false;
      unsubscribe();
      void runtime.source.stop();
      void runtime.orchestrator.dispose();
    };
  }, [cueAt, running, runtime]);

  const confirm = (outcome: TrainingOutcome) => {
    if (!runtime || !pending) return;
    const result = runtime.orchestrator.confirmPendingByOwner(outcome, new Date().toISOString());
    setPending(null);
    setCueAt(null);
    if (result.kind === 'rep_recorded') {
      setLastDecision(result.decision);
      setDiagnostics((current) => ({ ...current, lastResult: `Rep ${result.rep.repNumber} owner-confirmed` }));
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
        <Text style={styles.body}>Frames sampled: {diagnostics.framesCaptured}</Text>
        <Text style={styles.body}>Frames analysed: {diagnostics.framesAnalysed}</Text>
        <Text style={styles.body}>Last result: {diagnostics.lastResult}</Text>
      </View>

      {!running ? (
        <AppButton title="Start Camera Coach" onPress={() => setRunning(true)} disabled={!cameraReady || !runtime} />
      ) : !cueAt && !pending ? (
        <AppButton title="Start next rep" onPress={() => setCueAt(new Date().toISOString())} />
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
