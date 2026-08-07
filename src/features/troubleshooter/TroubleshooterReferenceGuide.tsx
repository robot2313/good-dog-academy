import { StyleSheet, Text, View } from 'react-native';

import { colorTokens, radiusTokens, spacingTokens, typographyTokens } from '../../theme/tokens';

export function TroubleshooterReferenceGuide(): React.JSX.Element {
  return (
    <View style={styles.guide}>
      <GuideSection title="The foundation">
        <GuideItem title="Reward-based only" text="Teach the behaviour you want using food, play, sniffing, movement, access, or calm social contact that your dog actually values." />
        <GuideItem title="Management is part of training" text="Distance, gates, leads, barriers, secure storage, and quieter routes prevent unsafe rehearsal while learning develops." />
        <GuideItem title="One change at a time" text="Increase duration, distance, or distraction separately. Return to an easier step if success drops below roughly four out of five." />
      </GuideSection>

      <GuideSection title="Equipment guide">
        <GuideItem title="Harness and fixed-length lead" text="Use a comfortable secure fit for walking and management. Equipment does not teach loose-lead walking by itself." />
        <GuideItem title="Long line" text="Attach to a body harness in open areas, keep it away from roads, and never wrap it around hands or legs." />
        <GuideItem title="Gate, pen, crate, or mat" text="Introduce positively. Stop if confinement causes panic or escape attempts. A mat should be comfortable and non-slip." />
        <GuideItem title="Basket muzzle" text="It must allow a full pant, drinking, and treats and needs gradual choice-based conditioning. A muzzle does not make close exposure safe or comfortable." />
        <GuideItem title="Avoid painful equipment" text="Prong, choke, and shock collars, leash jerks, intimidation, and flooding are not used in Good Dog Academy plans." />
      </GuideSection>

      <GuideSection title="Reward guide">
        <GuideItem title="Match the context" text="Kibble may work indoors while chicken, play, or permission to sniff is needed outdoors. Test what the dog values now." />
        <GuideItem title="Deliver where it helps" text="Feed beside the leg for loose-lead walking, between the paws for mat work, and away from a feared object to preserve choice." />
        <GuideItem title="Reward every new success" text="Once a skill is fluent, vary rewards gradually while continuing real-life and occasional high-value reinforcement." />
      </GuideSection>

      <GuideSection title="Stress and body language">
        <GuideItem title="Early signs" text="Head turns, lip licking, yawning, ears back, scanning, slower movement, or taking food harder mean reduce difficulty and offer space." />
        <GuideItem title="Moderate signs" text="Tucked posture, pacing, repeated avoidance, food refusal, whining, prolonged staring, or increased pulling mean stop and move to safety." />
        <GuideItem title="Severe signs" text="Freezing, frantic escape, lunging, snapping, growling, trembling, redirected behaviour, or self-injury mean end exposure and seek help." />
        <GuideItem title="Growling is communication" text="Do not punish it. A wagging tail does not always mean comfort; read the whole body and context." />
      </GuideSection>

      <GuideSection title="Choosing professional help">
        <GuideItem title="Veterinarian" text="Start here for sudden change, pain, sensory decline, urinary or digestive signs, medication questions, or medical concerns." />
        <GuideItem title="Veterinary behaviour professional" text="Appropriate for complex fear, anxiety, aggression, compulsive behaviour, panic, and cases that may need medical treatment." />
        <GuideItem title="Qualified reward-based consultant or trainer" text="Ask what happens when the dog is right and wrong, which tools are used, what credentials and insurance they hold, and when they refer to a veterinarian." />
        <GuideItem title="Warning signs" text="Avoid guarantees, alpha or pack-leader claims, punishment of growls, forced flooding, secrecy, pain-based tools, or discouraging veterinary input." />
      </GuideSection>

      <Text style={styles.disclaimer}>Educational reference only. Seek urgent veterinary care for injury, poisoning, choking, severe pain, breathing difficulty, collapse, or another emergency.</Text>
    </View>
  );
}

function GuideSection({ children, title }: React.PropsWithChildren<{ readonly title: string }>): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function GuideItem({ title, text }: { readonly title: string; readonly text: string }): React.JSX.Element {
  return (
    <View style={styles.item}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  guide: { gap: spacingTokens.sm },
  section: { gap: spacingTokens.xs, padding: spacingTokens.md, borderRadius: radiusTokens.xl, backgroundColor: colorTokens.surface.primary, borderWidth: 1, borderColor: colorTokens.border.subtle },
  sectionTitle: { ...typographyTokens.sectionTitle, color: colorTokens.text.primary },
  item: { gap: spacingTokens.xxs, paddingTop: spacingTokens.xs, borderTopWidth: 1, borderTopColor: colorTokens.border.subtle },
  itemTitle: { ...typographyTokens.cardTitle, color: colorTokens.brand.primary },
  body: { ...typographyTokens.body, color: colorTokens.text.primary },
  disclaimer: { ...typographyTokens.supporting, color: colorTokens.status.errorText, fontWeight: '700', textAlign: 'center', padding: spacingTokens.md },
});
