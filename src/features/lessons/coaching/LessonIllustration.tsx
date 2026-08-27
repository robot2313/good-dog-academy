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
      source: require('../../../../assets/lesson-images/by-lesson/recall-name-response.jpg'),
      accessibilityLabel:
        'Recall training photograph: a relaxed dog returns to a crouching owner in a secure garden while a long line stays loose.',
      caption:
        'Keep the long line loose, turn your body toward your dog and reward close to your legs when they arrive.',
    }),
    'loose-lead-walking': Object.freeze({
      source: require('../../../../assets/lesson-images/by-lesson/loose-lead-reward-zone.jpg'),
      accessibilityLabel:
        'Loose-lead walking photograph: a relaxed dog walks beside an owner while the lead hangs in a soft curve.',
      caption:
        'Reward beside the leg you want your dog to follow, and keep both your hand and the lead relaxed.',
    }),
    focus: Object.freeze({
      source: require('../../../../assets/lesson-images/by-lesson/focus-check-in.jpg'),
      accessibilityLabel:
        'Focus training photograph: a dog voluntarily checks in with an owner while a cyclist remains far away.',
      caption:
        'Wait for freely offered attention, reward low and keep the distraction at a comfortable distance.',
    }),
    jumping: Object.freeze({
      source: require('../../../../assets/lesson-images/by-lesson/jumping-four-paws-down.jpg'),
      accessibilityLabel:
        'Calm greeting photograph: a dog keeps four paws on the floor while an owner rewards low and a visitor waits calmly.',
      caption:
        'Deliver rewards near the ground, ask the visitor to stay still and keep a gate or exit ready if needed.',
    }),
    barking: Object.freeze({
      source: require('../../../../assets/lesson-images/by-lesson/barking-identify-triggers.jpg'),
      accessibilityLabel:
        'Barking lesson photograph: a dog sees a delivery person through a window and receives a reward for a calm pause on a mat.',
      caption:
        'Keep the trigger outside and far away, and have a mat, curtain or exit route ready before practice.',
    }),
    chewing: Object.freeze({
      source: require('../../../../assets/lesson-images/by-lesson/chewing-appropriate-items.jpg'),
      accessibilityLabel:
        'Chewing lesson photograph: a supervised dog rests on a mat with safe chew toys while shoes are stored away.',
      caption:
        'Make safe choices easy to reach and manage tempting household items before your dog can practise chewing them.',
    }),
    reactivity: Object.freeze({
      source: require('../../../../assets/lesson-images/by-lesson/reactivity-safe-distance.jpg'),
      accessibilityLabel:
        'Reactivity training photograph: a dog checks in with an owner behind a hedge while another dog remains very far away.',
      caption:
        'Use distance and a visual barrier, keep the lead slack and always leave yourself a clear path away.',
    }),
    'house-training': Object.freeze({
      source: require('../../../../assets/lesson-images/by-lesson/house-training-routine.jpg'),
      accessibilityLabel:
        'House-training photograph: a dog receives an immediate reward in an outdoor toileting area beside an open back door.',
      caption:
        'Keep the route outside short and predictable, then reward immediately after your dog finishes.',
    }),
    confidence: Object.freeze({
      source: require('../../../../assets/lesson-images/by-lesson/confidence-choice-and-exploration.jpg'),
      accessibilityLabel:
        'Confidence-building photograph: a dog voluntarily investigates a harmless box while the owner stays back and a retreat path remains open.',
      caption:
        'Let your dog choose the distance, use familiar flooring and keep a clear retreat path available.',
    }),
    'impulse-control': Object.freeze({
      source: require('../../../../assets/lesson-images/by-lesson/impulse-control-wait-for-reward.jpg'),
      accessibilityLabel:
        'Impulse-control photograph: a relaxed dog pauses before an open hand holding a reward without being physically restrained.',
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
        <View style={styles.lessonIllustrationFrame}>
          <Image
            accessible
            accessibilityLabel={illustration.accessibilityLabel}
            accessibilityRole="image"
            resizeMode="cover"
            source={imageSource}
            style={styles.lessonIllustration}
          />
          <View pointerEvents="none" style={styles.lessonIllustrationTone} />
        </View>
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
