import { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import {
  colorTokens,
  shadowTokens,
  typographyTokens,
} from '../theme/tokens';

type DogAvatarProps = {
  dogName: string;
  photoUri: string | null;
  size: number;
  accessibilityLabel?: string;
  decorative?: boolean;
};

export function DogAvatar({
  dogName,
  photoUri,
  size,
  accessibilityLabel,
  decorative = false,
}: DogAvatarProps): React.JSX.Element {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [photoUri]);

  const trimmedName = dogName.trim();
  const initial = trimmedName.charAt(0).toUpperCase() || '?';
  const label =
    accessibilityLabel ??
    `${trimmedName || 'Dog'}'s profile photo`;

  const showPhoto = Boolean(photoUri && !hasImageError);

  return (
    <View
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      accessibilityLabel={decorative ? undefined : label}
      accessibilityRole={decorative ? undefined : 'image'}
      importantForAccessibility={
        decorative ? 'no-hide-descendants' : 'yes'
      }
      style={[
        styles.shadowContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <View
        style={[
          styles.frame,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        {showPhoto && photoUri ? (
          <Image
            accessible={false}
            source={{ uri: photoUri }}
            resizeMode="cover"
            onError={() => setHasImageError(true)}
            style={styles.image}
          />
        ) : (
          <View
            accessible={false}
            style={styles.initialFallback}
          >
            <Text
              accessible={false}
              style={[
                styles.initial,
                {
                  fontSize: Math.max(24, size * 0.34),
                  lineHeight: Math.max(30, size * 0.4),
                },
              ]}
            >
              {initial}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    ...shadowTokens.low,
  },
  frame: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colorTokens.surface.primary,
    backgroundColor: colorTokens.surface.primary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorTokens.brand.primary,
  },
  initial: {
    ...typographyTokens.sectionTitle,
    color: colorTokens.text.inverse,
    fontWeight: '900',
    textAlign: 'center',
  },
});