import { Text, View } from 'react-native';

import type { LessonDefinition } from '../../../domain/models';
import { styles } from '../../../theme/styles';
import { LessonIllustration } from './LessonIllustration';
import {
  createLessonFlow,
  lessonDiagramLabel,
  lessonEncouragement,
} from './lessonCoaching';

interface LessonCoachingGuideProps {
  readonly lesson: LessonDefinition;
}

const fallbackEquipment = Object.freeze(['Small rewards your dog enjoys']);

export function LessonCoachingGuide({ lesson }: LessonCoachingGuideProps) {
  const flow = createLessonFlow(lesson);
  const equipment = lesson.equipment.length > 0 ? lesson.equipment : fallbackEquipment;

  return (
    <View style={styles.lessonDetails}>
      <View style={styles.coachingGoalCard}>
        <Text style={styles.coachingKicker}>TODAY&apos;S GOAL</Text>
        <Text style={styles.lessonGoal}>{lesson.goal}</Text>
        <Text style={styles.coachingMeta}>
          About {lesson.estimatedMinutes} minutes · Level {lesson.difficultyLevel}
        </Text>
      </View>

      <LessonIllustration
        commonMistake={lesson.commonMistakes[0]}
        skill={lesson.skill}
      />

      <View>
        <Text accessibilityRole="header" style={styles.coachingSectionTitle}>
          Visual roadmap
        </Text>
        <Text style={styles.coachingSectionIntro}>
          Follow this simple sequence and keep each part relaxed.
        </Text>
      </View>
      <View
        accessible
        accessibilityLabel={lessonDiagramLabel(lesson)}
        accessibilityRole="image"
        style={styles.lessonDiagram}
      >
        {flow.map((stage, index) => (
          <View key={`${lesson.id}-flow-${stage.title}`} style={styles.diagramStageGroup}>
            <View style={styles.diagramStage}>
              <View style={styles.diagramNumber}>
                <Text style={styles.diagramNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.diagramCopy}>
                <Text style={styles.diagramTitle}>{stage.title}</Text>
                <Text style={styles.diagramText}>{stage.description}</Text>
              </View>
            </View>
            {index < flow.length - 1 ? (
              <Text accessible={false} style={styles.diagramArrow}>
                ↓
              </Text>
            ) : null}
          </View>
        ))}
      </View>

      <View>
        <Text accessibilityRole="header" style={styles.coachingSectionTitle}>
          Before you begin
        </Text>
        <Text style={styles.coachingSectionIntro}>
          Gather these items and choose a calm, safe place to practise.
        </Text>
      </View>
      <View style={styles.coachingListCard}>
        {equipment.map((item, index) => (
          <View key={`${lesson.id}-equipment-${index}`} style={styles.coachingListRow}>
            <Text accessible={false} style={styles.coachingBullet}>
              ✓
            </Text>
            <Text style={styles.coachingListText}>{item}</Text>
          </View>
        ))}
      </View>

      <View>
        <Text accessibilityRole="header" style={styles.coachingSectionTitle}>
          Step by step
        </Text>
        <Text style={styles.coachingSectionIntro}>
          Pause or make the task easier whenever your dog needs more space or time.
        </Text>
      </View>
      <View style={styles.lessonSteps}>
        {lesson.steps.map((step, index) => (
          <View key={`${lesson.id}-step-${index}`} style={styles.lessonStep}>
            <View style={styles.lessonStepNumber}>
              <Text style={styles.lessonStepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.lessonStepText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.coachingCheckIn}>
        <Text style={styles.coachingCheckInTitle}>COACH CHECK-IN</Text>
        <Text style={styles.coachingCheckInText}>
          Is your dog still relaxed, able to take food and choosing to stay involved? If not,
          add distance, lower the difficulty or take a break.
        </Text>
      </View>

      {lesson.tips.length > 0 ? (
        <View>
          <Text accessibilityRole="header" style={styles.coachingSectionTitle}>
            Helpful tips
          </Text>
          <View style={styles.coachingListCard}>
            {lesson.tips.map((tip, index) => (
              <View key={`${lesson.id}-tip-${index}`} style={styles.coachingListRow}>
                <Text accessible={false} style={styles.coachingTipIcon}>
                  ★
                </Text>
                <Text style={styles.coachingListText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {lesson.commonMistakes.length > 0 ? (
        <View>
          <Text accessibilityRole="header" style={styles.coachingSectionTitle}>
            Things that can go wrong
          </Text>
          <View style={styles.coachingPreventionCard}>
            {lesson.commonMistakes.map((mistake, index) => (
              <View key={`${lesson.id}-mistake-${index}`} style={styles.coachingListRow}>
                <Text accessible={false} style={styles.coachingWarningIcon}>
                  !
                </Text>
                <Text style={styles.coachingListText}>{mistake}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {lesson.troubleshooting.length > 0 ? (
        <View>
          <Text accessibilityRole="header" style={styles.coachingSectionTitle}>
            If you get stuck
          </Text>
          <View style={styles.troubleshootingList}>
            {lesson.troubleshooting.map((item, index) => (
              <View key={`${lesson.id}-troubleshooting-${index}`} style={styles.troubleshootingCard}>
                <Text style={styles.troubleshootingProblem}>{item.problem}</Text>
                <Text style={styles.troubleshootingSolution}>{item.solution}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {lesson.safetyNotes.length > 0 ? (
        <View style={styles.safetyCard}>
          <Text accessibilityRole="header" style={styles.safetyTitle}>
            Safety first
          </Text>
          {lesson.safetyNotes.map((note, index) => (
            <Text key={`${lesson.id}-safety-${index}`} style={styles.safetyText}>
              • {note}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.completionCard}>
        <Text accessibilityRole="header" style={styles.completionTitle}>
          Ready to finish when
        </Text>
        <Text style={styles.completionText}>{lesson.completionCriteria.description}</Text>
        <Text style={styles.completionMeta}>
          Aim for {lesson.completionCriteria.minimumSuccessfulCompletions} successful{' '}
          {lesson.completionCriteria.minimumSuccessfulCompletions === 1
            ? 'repetition'
            : 'repetitions'}
          .
        </Text>
      </View>

      <View style={styles.encouragementCard}>
        <Text style={styles.encouragementTitle}>YOU&apos;RE BUILDING A REAL SKILL</Text>
        <Text style={styles.encouragementText}>{lessonEncouragement(lesson)}</Text>
      </View>
    </View>
  );
}
