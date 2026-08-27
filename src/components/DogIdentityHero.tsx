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
  compact: 64,
  standard: 76,
  profile: 92,
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
  const titleIncludesName = title.toLowerCase().includes(displayName.toLowerCase());

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.avatarFrame}>
          <DogAvatar
            accessibilityLabel={`${displayName}'s profile photo`}
            dogName={dogName}
            photoUri={photoUri}
            size={avatarSize}
          />
        </View>
        <View style={styles.copy}>
          <View style={styles.contextRow}>
            {eyebrow.trim() ? (
              <Text style={styles.eyebrow}>
                {eyebrow.trim()}
              </Text>
            ) : null}
            {!titleIncludesName ? <Text style={styles.dogName}>{displayName}</Text> : null}
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {supportingText?.trim() ? (
            <Text style={styles.supportingText}>
              {supportingText.trim()}
            </Text>
          ) : null}
        </View>
      </View>

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
    padding: spacingTokens.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colorTokens.border.subtle,
    backgroundColor: colorTokens.surface.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.md,
  },
  avatarFrame: {
    flexShrink: 0,
    padding: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F0D6A6',
    backgroundColor: colorTokens.background.subtle,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacingTokens.xs,
  },
  eyebrow: {
    ...typographyTokens.label,
    color: '#1D6337',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  dogName: {
    ...typographyTokens.caption,
    color: colorTokens.text.secondary,
    paddingHorizontal: spacingTokens.xs,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colorTokens.surface.selected,
  },
  title: {
    ...typographyTokens.cardTitle,
    color: colorTokens.text.primary,
    letterSpacing: -0.25,
  },
  supportingText: {
    ...typographyTokens.supporting,
    color: colorTokens.text.secondary,
  },
  status: {
    alignItems: 'flex-start',
    marginTop: spacingTokens.md,
  },
  footer: {
    width: '100%',
    alignItems: 'flex-start',
    marginTop: spacingTokens.md,
    paddingTop: spacingTokens.md,
    borderTopWidth: 1,
    borderTopColor: colorTokens.border.subtle,
  },
});
