import { Text, View } from 'react-native';

import { referencePalette, referenceScreenStyles } from '../theme/referenceStyles';

type SectionHeaderProps = {
  readonly title: string;
  readonly eyebrow?: string;
  readonly supportingText?: string;
  /**
   * Retained for source compatibility. The reference has no dark panels, so
   * headings always render in navy on a light surface.
   */
  readonly inverse?: boolean;
};

export function SectionHeader({ title, eyebrow, supportingText }: SectionHeaderProps): React.JSX.Element {
  return (
    <View style={{ gap: 3 }}>
      {eyebrow ? (
        <Text style={{ color: referencePalette.greenDark, fontSize: 9, lineHeight: 13, letterSpacing: 1.1, fontWeight: '900' }}>
          {eyebrow}
        </Text>
      ) : null}
      <Text accessibilityRole="header" style={referenceScreenStyles.blockTitle}>{title}</Text>
      {supportingText ? <Text style={referenceScreenStyles.blockIntro}>{supportingText}</Text> : null}
    </View>
  );
}
