import type { ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  colorTokens,
  spacingTokens,
  typographyTokens,
} from '../theme/tokens';
import { CurvedDogName } from './CurvedDogName';
import { DogAvatar } from './DogAvatar';

type DogIdentityHeroSize =
  | 'compact'
  | 'standard'
  | 'profile';

type DogIdentityHeroProps = {
  dogName: string;
  photoUri: string | null;
  eyebrow: string;
  title: string;
  supportingText?: string;
  size?: DogIdentityHeroSize;
  status?: ReactNode;
  footer?: ReactNode;
};

const avatarSizes: Record<DogIdentityHeroSize, number> = {
  compact: 224,
  standard: 272,
  profile: 320,
};

const identitySizes: Record<DogIdentityHeroSize, number> = {
  compact: 280,
  standard: 336,
  profile: 392,
};

export function DogIdentityHero({
  dogName,
  photoUri,
  eyebrow,
  title,
  supportingText,
  size = 'standard',
  status,
  footer,
}: DogIdentityHeroProps): React.JSX.Element {
  const trimmedName = dogName.trim();
  const displayName = trimmedName || 'Dog';
  const avatarSize = avatarSizes[size];
  const identitySize = identitySizes[size];
  const avatarOffset = (identitySize - avatarSize) / 2;

  const titleIncludesName = title.toLowerCase().includes(displayName.toLowerCase());

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityLabel={`${displayName}'s profile`}
        accessibilityRole="image"
        style={[
          styles.identity,
          {
            width: identitySize,
            height: identitySize,
          },
        ]}
      >
        {!titleIncludesName ? <Text style={styles.srOnly}>{displayName}</Text> : null}
        <View
          style={[
            styles.avatarPosition,
            {
              top: avatarOffset,
              left: avatarOffset,
            },
          ]}
        >
          <DogAvatar
            decorative
            dogName={dogName}
            photoUri={photoUri}
            size={avatarSize}
          />
        </View>

        <CurvedDogName
          dogName={dogName}
          size={identitySize}
          compact={size === 'compact'}
          standard={size === 'standard'}
          profile={size === 'profile'}
        />
      </View>

      {eyebrow.trim() ? (
        <Text style={styles.eyebrow}>
          {eyebrow.trim()}
        </Text>
      ) : null}

      <Text
        accessibilityRole="header"
        style={styles.title}
      >
        {title}
      </Text>

      {supportingText?.trim() ? (
        <Text style={styles.supportingText}>
          {supportingText.trim()}
        </Text>
      ) : null}

      {status ? (
        <View style={styles.status}>
          {status}
        </View>
      ) : null}

      {footer ? (
        <View style={styles.footer}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.md,
  },
  identity: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingTokens.sm,
  },
  avatarPosition: {
    position: 'absolute',
  },
  eyebrow: {
    ...typographyTokens.label,
    color: colorTokens.text.accent,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacingTokens.xs,
  },
  title: {
    ...typographyTokens.sectionTitle,
    color: colorTokens.text.primary,
    textAlign: 'center',
  },
  supportingText: {
    ...typographyTokens.supporting,
    color: colorTokens.text.secondary,
    textAlign: 'center',
    maxWidth: 320,
    marginTop: spacingTokens.xs,
  },
  status: {
    alignItems: 'center',
    marginTop: spacingTokens.sm,
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacingTokens.md,
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
});
