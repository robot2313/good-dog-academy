import { Image, Text, View, type ImageSourcePropType } from 'react-native';

import type { BehaviourSkill } from '../../../domain/models';
import { styles } from '../../../theme/styles';

interface LessonIllustrationDetails {
  readonly source: ImageSourcePropType;
  readonly accessibilityLabel: string;
  readonly caption: string;
}

import { getLessonImageSource } from './lessonImageManifest';

interface LessonIllustrationProps {
  readonly skill: BehaviourSkill;
  readonly lessonId?: string;
  readonly commonMistake?: string;
}

const lessonIllustrations: Readonly<Record<BehaviourSkill, LessonIllustrationDetails>> =
  Object.freeze({
    recall: Object.freeze({
      source: require('../../../../assets/lesson-images/recall.jpg'),
      accessibilityLabel:
        'Recall training illustration: a relaxed dog returns to a crouching owner in a secure garden while a long line stays loose.',
      caption:
        'Keep the long line loose, turn your body toward your dog and reward close to your legs when they arrive.',
    }),
    'loose-lead-walking': Object.freeze({
      source: require('../../../../assets/lesson-images/loose-lead-walking.jpg'),
      accessibilityLabel:
        'Loose-lead walking illustration: a relaxed dog walks beside an owner while the lead hangs in a soft curve.',
      caption:
        'Reward beside the leg you want your dog to follow, and keep both your hand and the lead relaxed.',
    }),
    focus: Object.freeze({
      source: require('../../../../assets/lesson-images/focus.jpg'),
      accessibilityLabel:
        'Focus training illustration: a dog voluntarily checks in with an owner while a cyclist remains far away.',
      caption:
        'Wait for freely offered attention, reward low and keep the distraction at a comfortable distance.',
    }),
    jumping: Object.freeze({
      source: require('../../../../assets/lesson-images/jumping.jpg'),
      accessibilityLabel:
        'Calm greeting illustration: a dog keeps four paws on the floor while an owner rewards low and a visitor waits calmly.',
      caption:
        'Deliver rewards near the ground, ask the visitor to stay still and keep a gate or exit ready if needed.',
    }),
    barking: Object.freeze({
      source: require('../../../../assets/lesson-images/barking.jpg'),
      accessibilityLabel:
        'Barking lesson illustration: a dog sees a delivery person through a window and receives a reward for a calm pause on a mat.',
      caption:
        'Keep the trigger outside and far away, and have a mat, curtain or exit route ready before practice.',
    }),
    chewing: Object.freeze({
      source: require('../../../../assets/lesson-images/chewing.jpg'),
      accessibilityLabel:
        'Chewing lesson illustration: a supervised dog rests on a mat with safe chew toys while shoes are stored away.',
      caption:
        'Make safe choices easy to reach and manage tempting household items before your dog can practise chewing them.',
    }),
    reactivity: Object.freeze({
      source: require('../../../../assets/lesson-images/reactivity.jpg'),
      accessibilityLabel:
        'Reactivity training illustration: a dog checks in with an owner behind a hedge while another dog remains very far away.',
      caption:
        'Use distance and a visual barrier, keep the lead slack and always leave yourself a clear path away.',
    }),
    'house-training': Object.freeze({
      source: require('../../../../assets/lesson-images/house-training.jpg'),
      accessibilityLabel:
        'House-training illustration: a dog receives an immediate reward in an outdoor toileting area beside an open back door.',
      caption:
        'Keep the route outside short and predictable, then reward immediately after your dog finishes.',
    }),
    confidence: Object.freeze({
      source: require('../../../../assets/lesson-images/confidence.jpg'),
      accessibilityLabel:
        'Confidence-building illustration: a dog voluntarily investigates a harmless box while the owner stays back and a retreat path remains open.',
      caption:
        'Let your dog choose the distance, use familiar flooring and keep a clear retreat path available.',
    }),
    'impulse-control': Object.freeze({
      source: require('../../../../assets/lesson-images/impulse-control.jpg'),
      accessibilityLabel:
        'Impulse-control illustration: a relaxed dog pauses before an open hand holding a reward without being physically restrained.',
      caption:
        'Ask for a tiny achievable pause, keep your hands open and relaxed, then deliver the next reward promptly.',
    }),
  });

export function lessonIllustrationForSkill(
  skill: BehaviourSkill,
): LessonIllustrationDetails {
  return lessonIllustrations[skill];
}

export function LessonIllustration({
  skill,
  lessonId,
  commonMistake,
}: LessonIllustrationProps) {
  const illustration = lessonIllustrationForSkill(skill);
  const imageSource = getLessonImageSource(lessonId ?? null, skill);

  return (
    <View style={styles.lessonIllustrationSection}>
      <Text accessibilityRole="header" style={styles.coachingSectionTitle}>
        Picture the task
      </Text>
      <View style={styles.lessonIllustrationCard}>
        <Image
          accessible
          accessibilityLabel={illustration.accessibilityLabel}
          accessibilityRole="image"
          resizeMode="contain"
          source={imageSource}
          style={styles.lessonIllustration}
        />
        <View style={styles.illustrationCopy}>
          <Text style={styles.illustrationLabel}>WHAT TO NOTICE</Text>
          <Text style={styles.illustrationText}>{illustration.caption}</Text>
          {commonMistake ? (
            <View style={styles.illustrationProblem}>
              <Text style={styles.illustrationProblemLabel}>PROBLEM TO PREVENT</Text>
              <Text style={styles.illustrationProblemText}>{commonMistake}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
