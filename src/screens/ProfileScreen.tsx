import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AppScreen } from '../components/AppScreen';
import { DogIdentityHero } from '../components/DogIdentityHero';
import { InlineValidationMessage } from '../components/InlineValidationMessage';
import { SecondaryTextButton } from '../components/SecondaryTextButton';
import { useOnboarding } from '../features/onboarding/OnboardingContext';
import { dogPhotoStorage } from '../features/onboarding/photo/dogPhotoStorageInstance';
import { domainRepositories } from '../services/domainRepositories';
import { styles } from '../theme/styles';

declare const require: (moduleName: string) => { DeveloperToolsSection: () => React.JSX.Element | null };
const DeveloperToolsSection = __DEV__
  ? require('../development/reset/DeveloperToolsSection').DeveloperToolsSection
  : null;

export function ProfileScreen(): React.JSX.Element {
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
        const persistentUri = await dogPhotoStorage.persist(result.assets[0].uri, dog.id);
        if (dog.photoUri && dog.photoUri !== persistentUri) {
          try {
            await dogPhotoStorage.remove(dog.photoUri);
          } catch {
            /* cleanup non-fatal */
          }
        }
        const updatedDog = {
          ...dog,
          photoUri: persistentUri,
          updatedAt: new Date().toISOString(),
        };
        await domainRepositories.dogs.save(updatedDog);
        await refreshApplicationStatus();
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
      try {
        await dogPhotoStorage.remove(dog.photoUri);
      } catch {
        /* cleanup non-fatal */
      }
      const updatedDog = {
        ...dog,
        photoUri: null,
        updatedAt: new Date().toISOString(),
      };
      await domainRepositories.dogs.save(updatedDog);
      await refreshApplicationStatus();
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
        <Text style={styles.membershipEyebrow}>FOUNDER ACCOUNT</Text>
        <Text style={styles.membershipTitle}>Lifetime All Access</Text>
        <Text style={styles.membershipBody}>Your owner account stays unlocked as premium features are added.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Current dog</Text>
        <Text style={styles.profileValue}>{dog?.name ?? 'Not selected'}</Text>
        <Text style={styles.label}>Breed or mix</Text>
        <Text style={styles.profileValue}>
          {dog ? (dog.breedUnknown ? 'Unknown' : dog.breed) : 'Not specified'}
        </Text>
        <Text style={styles.label}>Owner</Text>
        <Text style={styles.profileValue}>{owner?.displayName ?? 'Not specified'}</Text>
        <Text style={styles.label}>Current build</Text>
        <Text style={styles.profileValue}>Stable Foundation 1.0</Text>
      </View>
      {__DEV__ && DeveloperToolsSection ? <DeveloperToolsSection /> : null}
    </AppScreen>
  );
}
