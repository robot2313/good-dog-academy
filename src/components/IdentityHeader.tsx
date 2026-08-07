import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Pressable, Text, View } from 'react-native';

import type { Dog } from '../domain/models/Dog';
import { useLessonLibraryData } from '../features/lessons/library/LessonLibraryContext';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { dogPhotoUpdateService } from '../features/onboarding/photo/dogPhotoUpdateServiceInstance';
import { referencePalette, referenceScreenStyles, referenceStyles } from '../theme/referenceStyles';
import { DogAvatar } from './DogAvatar';
import { ReferenceIcon } from './ReferenceIcon';

type IdentityHeaderProps = {
  /** Small line above the names. Defaults to a time-of-day greeting. */
  readonly eyebrow?: string;
  /** Optional back control shown to the left of the names. */
  readonly onBack?: () => void;
  readonly backLabel?: string;
};

/**
 * The persistent header used across every screen: the owner and dog names sit
 * top left, and the dog's photo sits top right. Tapping the photo opens the
 * photo library so the owner can add or change it from anywhere in the app.
 */
export function IdentityHeader({
  eyebrow,
  onBack,
  backLabel = 'Back',
}: IdentityHeaderProps): React.JSX.Element {
  const identity = useIdentity();
  const dog = identity?.dog ?? null;
  const refresh = identity?.refresh ?? (async () => undefined);
  const dogName = (dog?.name ?? '').trim() || 'Your dog';
  const ownerName = identity?.ownerName?.trim().split(' ')[0] || 'You';
  const photoUri = dog?.photoUri ?? null;

  const [photoError, setPhotoError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const changePhoto = async (): Promise<void> => {
    if (!dog || updating) return;
    setPhotoError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError('Photo access was not granted.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    try {
      setUpdating(true);
      await dogPhotoUpdateService.replacePhoto(dog, result.assets[0].uri, refresh);
    } catch {
      setPhotoError('Unable to save photo. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={{ gap: 4 }}>
      <View style={referenceScreenStyles.identityRow}>
        <View style={referenceScreenStyles.identityBackRow}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={backLabel}
              hitSlop={8}
              onPress={onBack}
              style={({ pressed }) => [referenceStyles.iconButton, pressed && referenceStyles.pressed]}
            >
              <ReferenceIcon name="back" />
            </Pressable>
          ) : null}
          <View style={referenceScreenStyles.identityCopy}>
            <Text style={referenceScreenStyles.identityEyebrow}>{eyebrow ?? greeting()}</Text>
            <Text accessibilityRole="header" numberOfLines={1} style={referenceScreenStyles.identityNames}>
              {dogName} &amp; {ownerName}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={photoUri ? `Change ${dogName}'s photo` : `Add a photo of ${dogName}`}
          accessibilityHint="Opens your photo library"
          accessibilityState={{ disabled: !dog || updating }}
          disabled={!dog || updating}
          onPress={() => { void changePhoto(); }}
          style={({ pressed }) => [referenceScreenStyles.identityAvatarWrap, pressed && referenceStyles.pressed]}
        >
          <View style={referenceScreenStyles.identityAvatar}>
            <DogAvatar decorative dogName={dogName} photoUri={photoUri} size={48} />
          </View>
          <View style={referenceScreenStyles.identityAvatarBadge}>
            <ReferenceIcon name={photoUri ? 'camera' : 'plus'} size={11} color="#FFFFFF" strokeWidth={2.4} />
          </View>
        </Pressable>
      </View>
      {photoError ? (
        <Text accessibilityRole="alert" style={referenceScreenStyles.identityError}>{photoError}</Text>
      ) : null}
    </View>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

type Identity = {
  readonly dog: Dog | null;
  readonly ownerName: string | null;
  readonly refresh: () => Promise<void>;
};

function useIdentity(): Identity | null {
  const onboarding = useOnboardingIdentity();
  const libraryDog = useLibraryDog();
  const dog = onboarding?.dog ?? libraryDog;
  if (!dog && !onboarding) return null;
  return {
    dog,
    ownerName: onboarding?.ownerName ?? null,
    refresh: onboarding?.refresh ?? (async () => undefined),
  };
}

function useOnboardingIdentity(): Identity | null {
  try {
    const { status, refreshApplicationStatus } = useOnboarding();
    if (!status || !('dog' in status) || !('owner' in status)) return null;
    return {
      dog: status.dog ?? null,
      ownerName: status.owner?.displayName ?? null,
      refresh: refreshApplicationStatus ?? (async () => undefined),
    };
  } catch {
    return null;
  }
}

function useLibraryDog(): Dog | null {
  try {
    const { selectedDog } = useLessonLibraryData();
    return selectedDog ?? null;
  } catch {
    return null;
  }
}

// Avoids an unused-import warning while keeping the palette available for
// future header variants without another import round-trip.
export const identityHeaderAccent = referencePalette.green;
