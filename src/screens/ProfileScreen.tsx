import * as ImagePicker from 'expo-image-picker';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { AppButton } from '../components/AppButton';
import { DogIdentityHero } from '../components/DogIdentityHero';
import { InlineValidationMessage } from '../components/InlineValidationMessage';
import { PremiumCard } from '../components/PremiumCard';
import { SectionHeader } from '../components/SectionHeader';
import { SecondaryTextButton } from '../components/SecondaryTextButton';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { dogPhotoUpdateService } from '../features/onboarding/photo/dogPhotoUpdateServiceInstance';
import { styles } from '../theme/styles';
import type { RootStackParamList } from '../types/navigation';

declare const require: (moduleName: string) => { DeveloperToolsSection: () => React.JSX.Element | null };
const DeveloperToolsSection = __DEV__
  ? require('../development/reset/DeveloperToolsSection').DeveloperToolsSection
  : null;

export function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { status, refreshApplicationStatus } = useOnboarding();
  const dog = status && 'dog' in status ? status.dog : null;
  const owner = status && 'owner' in status ? status.owner : null;
  const dogName = dog?.name ?? 'My Dog';
  const photoUri = dog?.photoUri ?? null;

  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);

  const handleAddOrChangePhoto = async (): Promise<void> => {
    if (!dog) return;
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
    if (!result.canceled && result.assets[0]) {
      try {
        setIsUpdatingPhoto(true);
        await dogPhotoUpdateService.replacePhoto(
          dog,
          result.assets[0].uri,
          refreshApplicationStatus,
        );
      } catch {
        setPhotoError('Unable to save photo. Please try again.');
      } finally {
        setIsUpdatingPhoto(false);
      }
    }
  };

  const handleRemovePhoto = async (): Promise<void> => {
    if (!dog || !dog.photoUri) return;
    setPhotoError(null);
    try {
      setIsUpdatingPhoto(true);
      await dogPhotoUpdateService.removePhoto(dog, refreshApplicationStatus);
    } catch {
      setPhotoError('Unable to remove photo.');
    } finally {
      setIsUpdatingPhoto(false);
    }
  };

  return (
    <AppScreen>
      <DogIdentityHero
        dogName={dogName}
        photoUri={photoUri}
        eyebrow="DOG PROFILE"
        title={dogName}
        size="profile"
        footer={
          dog ? (
            <View style={styles.photoActionRow}>
              <SecondaryTextButton
                title={photoUri ? 'Change photo' : 'Add photo'}
                onPress={() => {
                  if (!isUpdatingPhoto) void handleAddOrChangePhoto();
                }}
              />
              {photoUri ? (
                <SecondaryTextButton
                  title="Remove photo"
                  onPress={() => {
                    if (!isUpdatingPhoto) void handleRemovePhoto();
                  }}
                />
              ) : null}
            </View>
          ) : null
        }
      />
      {photoError ? <InlineValidationMessage message={photoError} /> : null}
      <View style={styles.membershipCard}>
        <View style={styles.membershipTopRow}>
          <Text style={styles.membershipEyebrow}>FOUNDER ACCOUNT</Text>
          <View style={styles.membershipBadge}><Text style={styles.membershipBadgeText}>LIFETIME</Text></View>
        </View>
        <Text style={styles.membershipTitle}>Lifetime All Access</Text>
        <Text style={styles.membershipBody}>Your academy access stays unlocked as the training experience grows.</Text>
      </View>
      <PremiumCard tone="elevated">
        <SectionHeader eyebrow="PROFILE" title="Your training partnership" />
        <ProfileDetailRow label="Dog" value={dog?.name ?? 'Not selected'} />
        <ProfileDetailRow label="Breed or mix" value={dog ? (dog.breedUnknown ? 'Unknown' : dog.breed) : 'Not specified'} />
        <ProfileDetailRow label="Owner" value={owner?.displayName ?? 'Not specified'} last />
      </PremiumCard>
      <PremiumCard>
        <SectionHeader
          eyebrow="YOUR CONTROL"
          title="Privacy and your data"
          supportingText="See what is stored on this device or permanently delete all app data."
        />
        <AppButton title="Privacy and Your Data" variant="secondary" onPress={() => navigation.navigate('Privacy')} />
      </PremiumCard>
      {__DEV__ && DeveloperToolsSection ? <DeveloperToolsSection /> : null}
    </AppScreen>
  );
}

function ProfileDetailRow({ label, value, last = false }: { label: string; value: string; last?: boolean }): React.JSX.Element {
  return (
    <View style={[styles.profileDetailRow, last && styles.profileDetailRowLast]}>
      <Text style={styles.profileDetailLabel}>{label}</Text>
      <Text style={styles.profileDetailValue}>{value}</Text>
    </View>
  );
}
