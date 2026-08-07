import { StyleSheet } from 'react-native';

export const referencePalette = {
  background: '#FAF7F0', surface: '#FFFFFF', surfaceWarm: '#FFFDF8', navy: '#0B2545', text: '#18212E', muted: '#66707C',
  green: '#2F8148', greenDark: '#1D6337', greenSoft: '#EDF5E9', gold: '#D99A22', line: '#E4DED3', inactive: '#A9A69E', shadow: '#243245',
} as const;

export const referenceStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: referencePalette.background },
  scroll: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 112, gap: 18 },
  compactScroll: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 112, gap: 14 },
  header: { gap: 3, paddingVertical: 4 },
  title: { color: referencePalette.navy, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: referencePalette.text, fontSize: 14, lineHeight: 20 },
  smallSubtitle: { color: referencePalette.muted, fontSize: 12, lineHeight: 17 },
  headerRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  overlayIconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(19,25,28,0.76)', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.78 },
  tabBar: { minHeight: 72, flexDirection: 'row', alignItems: 'stretch', backgroundColor: referencePalette.surface, borderTopWidth: 1, borderTopColor: referencePalette.line, paddingHorizontal: 2, paddingTop: 7, paddingBottom: 7 },
  tabButton: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 10 },
  tabIcon: { height: 25, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { color: referencePalette.inactive, fontSize: 9, lineHeight: 12, fontWeight: '700', textAlign: 'center' },
  tabLabelActive: { color: referencePalette.navy, fontWeight: '900' },
  homeHeader: { gap: 6 },
  homeUtilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeGreetingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  homeGreetingCopy: { flex: 1, minWidth: 0, gap: 1 },
  homeGreeting: { color: referencePalette.text, fontSize: 14, lineHeight: 19 },
  homeNames: { color: referencePalette.navy, fontSize: 22, lineHeight: 27, fontWeight: '900' },
  avatarRing: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', borderWidth: 2, borderColor: '#F0D6A6', backgroundColor: referencePalette.surface },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: referencePalette.navy, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  sectionLink: { color: referencePalette.greenDark, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  todayCard: { flexDirection: 'row', overflow: 'hidden', minHeight: 118, backgroundColor: referencePalette.surface, borderRadius: 14, borderWidth: 1, borderColor: referencePalette.line },
  todayImage: { width: 92, alignSelf: 'stretch', backgroundColor: referencePalette.greenSoft },
  todayCopy: { flex: 1, minWidth: 0, padding: 12, gap: 3 },
  cardKicker: { color: referencePalette.greenDark, fontSize: 9, lineHeight: 12, fontWeight: '800', textTransform: 'capitalize' },
  cardTitle: { color: referencePalette.navy, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  cardMeta: { color: referencePalette.muted, fontSize: 10, lineHeight: 14 },
  progressTrack: { height: 4, borderRadius: 999, overflow: 'hidden', backgroundColor: '#E5E9E4', marginTop: 4 },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: referencePalette.green },
  compactGreenButton: { minHeight: 34, borderRadius: 7, backgroundColor: referencePalette.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 4 },
  compactGreenButtonText: { color: '#FFFFFF', fontSize: 11, lineHeight: 15, fontWeight: '900' },
  recommendationCard: { flexDirection: 'row', minHeight: 86, overflow: 'hidden', backgroundColor: referencePalette.surfaceWarm, borderRadius: 13, borderWidth: 1, borderColor: '#E7DDCC' },
  recommendationImage: { width: 78, alignSelf: 'stretch', backgroundColor: referencePalette.greenSoft },
  recommendationCopy: { flex: 1, minWidth: 0, paddingHorizontal: 11, paddingVertical: 10, justifyContent: 'center', gap: 2 },
  jumpBackCard: { flexDirection: 'row', minHeight: 96, overflow: 'hidden', backgroundColor: referencePalette.surface, borderRadius: 13, borderWidth: 1, borderColor: referencePalette.line },
  jumpBackImage: { width: 82, alignSelf: 'stretch' },
  categoryPillsRow: { flexDirection: 'row', gap: 12, paddingRight: 6 },
  categoryPill: { width: 58, alignItems: 'center', gap: 5 },
  categoryPillIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  categoryPillLabel: { color: referencePalette.navy, fontSize: 9, lineHeight: 12, fontWeight: '700', textAlign: 'center' },
  helpStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 13, backgroundColor: '#FFF4DF', borderRadius: 12, borderWidth: 1, borderColor: '#ECD4A8' },
  helpStripCopy: { flex: 1, minWidth: 0 }, helpStripTitle: { color: '#704C11', fontSize: 13, lineHeight: 18, fontWeight: '900' }, helpStripBody: { color: '#8B6A34', fontSize: 10, lineHeight: 14 },
  categoryList: { gap: 8 },
  categoryRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, paddingVertical: 10, backgroundColor: referencePalette.surface, borderRadius: 10, borderWidth: 1, borderColor: referencePalette.line },
  categoryIconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  categoryRowTitle: { flex: 1, minWidth: 0, color: referencePalette.navy, fontSize: 14, lineHeight: 19, fontWeight: '800' },
  categoryCount: { color: referencePalette.muted, fontSize: 10, lineHeight: 14 },
  categoryFooter: { padding: 14, gap: 8, backgroundColor: referencePalette.surface, borderRadius: 12, borderWidth: 1, borderColor: referencePalette.line },
  browseHeaderIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 }, browseTitleCopy: { flex: 1, minWidth: 0 },
  browseHero: { overflow: 'hidden', backgroundColor: referencePalette.surface, borderRadius: 14, borderWidth: 1, borderColor: referencePalette.line },
  browseHeroImage: { width: '100%', height: 150, backgroundColor: referencePalette.greenSoft }, browseHeroCopy: { padding: 13, gap: 3 }, browseHeroDescription: { color: referencePalette.text, fontSize: 12, lineHeight: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, filterChip: { minHeight: 32, borderRadius: 999, borderWidth: 1, borderColor: referencePalette.line, backgroundColor: referencePalette.surface, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' }, filterChipActive: { borderColor: referencePalette.green, backgroundColor: referencePalette.greenSoft }, filterChipText: { color: referencePalette.text, fontSize: 10, lineHeight: 14, fontWeight: '700' }, filterChipTextActive: { color: referencePalette.greenDark, fontWeight: '900' },
  lessonList: { gap: 7 }, lessonRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, backgroundColor: referencePalette.surface, borderRadius: 10, borderWidth: 1, borderColor: referencePalette.line }, lessonRowNumber: { width: 18, color: referencePalette.navy, fontSize: 13, lineHeight: 18, fontWeight: '900', textAlign: 'center' }, lessonRowImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: referencePalette.greenSoft }, lessonRowCopy: { flex: 1, minWidth: 0, gap: 1 }, lessonRowTitle: { color: referencePalette.navy, fontSize: 13, lineHeight: 17, fontWeight: '800' }, lessonRowMeta: { color: referencePalette.muted, fontSize: 10, lineHeight: 14 }, lessonRowState: { color: referencePalette.greenDark, fontSize: 9, lineHeight: 12, fontWeight: '800' },
  detailSafe: { flex: 1, backgroundColor: referencePalette.background }, detailScrollContent: { paddingBottom: 110 }, detailHero: { height: 286, backgroundColor: referencePalette.greenSoft }, detailHeroImage: { width: '100%', height: '100%' }, detailOverlayTop: { position: 'absolute', top: 12, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, detailContent: { paddingHorizontal: 20, paddingTop: 15, gap: 15 }, detailKicker: { color: referencePalette.greenDark, fontSize: 10, lineHeight: 14, letterSpacing: 0.8, fontWeight: '900' }, detailTitle: { color: referencePalette.navy, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.5 }, detailChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, detailChip: { borderRadius: 999, backgroundColor: '#F1EEE7', paddingHorizontal: 10, paddingVertical: 5 }, detailChipText: { color: referencePalette.text, fontSize: 10, lineHeight: 14, fontWeight: '700' }, detailGoal: { color: referencePalette.text, fontSize: 14, lineHeight: 21 }, detailSectionTitle: { color: referencePalette.navy, fontSize: 18, lineHeight: 23, fontWeight: '900' }, detailBulletList: { gap: 9 }, detailBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, detailBulletIcon: { width: 19, height: 19, borderRadius: 10, backgroundColor: referencePalette.green, alignItems: 'center', justifyContent: 'center', marginTop: 1 }, detailBulletText: { flex: 1, minWidth: 0, color: referencePalette.text, fontSize: 13, lineHeight: 19 }, detailNotice: { padding: 13, borderRadius: 12, backgroundColor: '#FFF5DF', borderWidth: 1, borderColor: '#E9D4AA', gap: 4 }, detailNoticeTitle: { color: '#755018', fontSize: 13, lineHeight: 18, fontWeight: '900' }, detailNoticeBody: { color: '#765F3A', fontSize: 11, lineHeight: 16 }, detailEquipmentCard: { padding: 14, borderRadius: 12, backgroundColor: referencePalette.surface, borderWidth: 1, borderColor: referencePalette.line, gap: 8 }, detailFooter: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 10, backgroundColor: referencePalette.surface, borderTopWidth: 1, borderTopColor: referencePalette.line }, largeGreenButton: { minHeight: 52, borderRadius: 9, backgroundColor: referencePalette.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }, largeGreenButtonText: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, fontWeight: '900' },
  journeyIntro: { color: referencePalette.text, fontSize: 12, lineHeight: 18 }, stageList: { gap: 10 }, stageCard: { overflow: 'hidden', backgroundColor: referencePalette.surface, borderRadius: 12, borderWidth: 1, borderColor: referencePalette.line }, stageHeader: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 11 }, stageNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: referencePalette.greenSoft, borderWidth: 1, borderColor: '#CFE2C8' }, stageNumberActive: { backgroundColor: referencePalette.green, borderColor: referencePalette.green }, stageNumberText: { color: referencePalette.greenDark, fontSize: 12, lineHeight: 16, fontWeight: '900' }, stageNumberTextActive: { color: '#FFFFFF' }, stageHeaderCopy: { flex: 1, minWidth: 0, gap: 2 }, stageTitle: { color: referencePalette.navy, fontSize: 14, lineHeight: 19, fontWeight: '900' }, stageProgress: { color: referencePalette.muted, fontSize: 10, lineHeight: 14 }, stageBody: { borderTopWidth: 1, borderTopColor: referencePalette.line, paddingHorizontal: 13, paddingVertical: 6 }, stageLessonRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: '#EEE9DF', paddingVertical: 7 }, stageLessonMarker: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#CFCAC0', backgroundColor: referencePalette.surface }, stageLessonMarkerComplete: { backgroundColor: referencePalette.green, borderColor: referencePalette.green }, stageLessonMarkerCurrent: { borderColor: referencePalette.navy, borderWidth: 2 }, stageLessonTitle: { flex: 1, minWidth: 0, color: referencePalette.navy, fontSize: 11, lineHeight: 15, fontWeight: '800' }, stageLessonMeta: { color: referencePalette.muted, fontSize: 9, lineHeight: 12 },
  lifeStageList: { gap: 10 }, lifeStageCard: { minHeight: 118, flexDirection: 'row', overflow: 'hidden', backgroundColor: referencePalette.surface, borderRadius: 12, borderWidth: 1, borderColor: referencePalette.line }, lifeStageImage: { width: '44%', alignSelf: 'stretch', backgroundColor: referencePalette.greenSoft }, lifeStageCopy: { flex: 1, minWidth: 0, justifyContent: 'center', paddingHorizontal: 13, paddingVertical: 10, gap: 3 }, lifeStageTitle: { color: referencePalette.navy, fontSize: 17, lineHeight: 22, fontWeight: '900' }, lifeStageAge: { color: referencePalette.text, fontSize: 10, lineHeight: 14, fontWeight: '700' }, lifeStageDescription: { color: referencePalette.text, fontSize: 11, lineHeight: 16 }, lifeStageChevron: { alignSelf: 'center', paddingRight: 10 },
});

// ---------------------------------------------------------------------------
// Shared reference-language styles applied across every remaining screen so the
// whole app matches the approved six-screen reference.
// ---------------------------------------------------------------------------
export const referenceScreenStyles = StyleSheet.create({
  // Persistent identity header: owner + dog name on the left, dog photo right.
  identityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 2, paddingBottom: 2 },
  identityCopy: { flex: 1, minWidth: 0, gap: 1 },
  identityEyebrow: { color: referencePalette.muted, fontSize: 12, lineHeight: 17 },
  identityNames: { color: referencePalette.navy, fontSize: 20, lineHeight: 25, fontWeight: '900' },
  identityBackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  identityAvatar: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', borderWidth: 2, borderColor: '#F0D6A6', backgroundColor: referencePalette.surface },
  identityAvatarWrap: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  identityAvatarBadge: { position: 'absolute', right: 0, bottom: 0, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: referencePalette.green, borderWidth: 2, borderColor: referencePalette.background },
  identityError: { color: '#984B3E', fontSize: 11, lineHeight: 16, fontWeight: '700' },

  // Page shell + headings
  pageHeader: { gap: 3, paddingTop: 2 },
  pageTitle: { color: referencePalette.navy, fontSize: 26, lineHeight: 32, fontWeight: '900', letterSpacing: -0.5 },
  pageSubtitle: { color: referencePalette.muted, fontSize: 12.5, lineHeight: 18 },
  blockTitle: { color: referencePalette.navy, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  blockIntro: { color: referencePalette.text, fontSize: 12.5, lineHeight: 18 },
  meta: { color: referencePalette.muted, fontSize: 11, lineHeight: 16 },

  // Generic reference card
  card: { backgroundColor: referencePalette.surface, borderRadius: 12, borderWidth: 1, borderColor: referencePalette.line, padding: 14, gap: 8 },
  cardWarm: { backgroundColor: referencePalette.surfaceWarm, borderRadius: 12, borderWidth: 1, borderColor: '#E7DDCC', padding: 14, gap: 8 },
  cardSelected: { backgroundColor: referencePalette.greenSoft, borderRadius: 12, borderWidth: 1, borderColor: '#CFE2C8', padding: 14, gap: 8 },
  listGap: { gap: 10 },

  // Row with leading icon + trailing chevron (settings, links, options)
  actionRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 13, paddingVertical: 11, backgroundColor: referencePalette.surface, borderRadius: 10, borderWidth: 1, borderColor: referencePalette.line },
  actionRowCopy: { flex: 1, minWidth: 0, gap: 1 },
  actionRowTitle: { color: referencePalette.navy, fontSize: 14, lineHeight: 19, fontWeight: '800' },
  actionRowMeta: { color: referencePalette.muted, fontSize: 11, lineHeight: 15 },

  // Label / value rows (session detail, profile details)
  dataRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottomWidth: 1, borderBottomColor: '#EEE9DF', paddingVertical: 9 },
  dataRowLast: { borderBottomWidth: 0 },
  dataLabel: { flex: 1, color: referencePalette.muted, fontSize: 12, lineHeight: 17 },
  dataValue: { flex: 1.3, color: referencePalette.navy, fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'right' },

  // Stat tiles (progress snapshot)
  statRow: { flexDirection: 'row', gap: 9 },
  statTile: { flex: 1, minWidth: 0, alignItems: 'center', gap: 2, paddingVertical: 13, paddingHorizontal: 6, backgroundColor: referencePalette.surface, borderRadius: 12, borderWidth: 1, borderColor: referencePalette.line },
  statValue: { color: referencePalette.greenDark, fontSize: 22, lineHeight: 27, fontWeight: '900', fontVariant: ['tabular-nums'] },
  statLabel: { color: referencePalette.muted, fontSize: 10, lineHeight: 14, fontWeight: '700', textAlign: 'center' },

  // Notices
  noticeInfo: { padding: 13, borderRadius: 12, backgroundColor: referencePalette.greenSoft, borderWidth: 1, borderColor: '#CFE2C8', gap: 4 },
  noticeInfoTitle: { color: referencePalette.greenDark, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  noticeInfoBody: { color: referencePalette.text, fontSize: 11.5, lineHeight: 17 },
  noticeWarn: { padding: 13, borderRadius: 12, backgroundColor: '#FFF4DF', borderWidth: 1, borderColor: '#ECD4A8', gap: 4 },
  noticeWarnTitle: { color: '#704C11', fontSize: 13, lineHeight: 18, fontWeight: '900' },
  noticeWarnBody: { color: '#8B6A34', fontSize: 11.5, lineHeight: 17 },
  noticeAlert: { padding: 13, borderRadius: 12, backgroundColor: '#F8E7E2', borderWidth: 1, borderColor: '#E2C3BB', gap: 4 },
  noticeAlertTitle: { color: '#984B3E', fontSize: 13, lineHeight: 18, fontWeight: '900' },
  noticeAlertBody: { color: '#7C5952', fontSize: 11.5, lineHeight: 17 },

  // Buttons
  primaryButton: { minHeight: 52, borderRadius: 9, backgroundColor: referencePalette.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, flexDirection: 'row', gap: 8 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, lineHeight: 19, fontWeight: '900' },
  secondaryButton: { minHeight: 52, borderRadius: 9, backgroundColor: referencePalette.surface, borderWidth: 1, borderColor: referencePalette.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, flexDirection: 'row', gap: 8 },
  secondaryButtonText: { color: referencePalette.greenDark, fontSize: 14, lineHeight: 19, fontWeight: '900' },
  destructiveButton: { minHeight: 52, borderRadius: 9, backgroundColor: '#F8E7E2', borderWidth: 1, borderColor: '#D9B0A9', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, flexDirection: 'row', gap: 8 },
  destructiveButtonText: { color: '#984B3E', fontSize: 14, lineHeight: 19, fontWeight: '900' },
  textButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 4 },
  textButtonLabel: { color: referencePalette.greenDark, fontSize: 13, lineHeight: 18, fontWeight: '900' },

  // Inputs and selections (onboarding, assessment, troubleshooter)
  fieldGroup: { gap: 6 },
  fieldLabel: { color: referencePalette.navy, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  input: { minHeight: 48, borderWidth: 1, borderColor: referencePalette.line, borderRadius: 10, backgroundColor: referencePalette.surface, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, color: referencePalette.text },
  inputInvalid: { borderColor: '#C4796C', borderWidth: 1.5 },
  optionRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderColor: referencePalette.line, borderRadius: 10, backgroundColor: referencePalette.surface, paddingHorizontal: 13, paddingVertical: 10 },
  optionRowSelected: { borderColor: referencePalette.green, backgroundColor: referencePalette.greenSoft },
  optionText: { flex: 1, color: referencePalette.navy, fontSize: 13.5, lineHeight: 19, fontWeight: '700' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.6, borderColor: '#CFCAC0', alignItems: 'center', justifyContent: 'center', backgroundColor: referencePalette.surface },
  radioOuterSelected: { borderColor: referencePalette.green, borderWidth: 2 },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: referencePalette.green },

  // States
  centerState: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 22 },
  centerStateText: { color: referencePalette.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  emptyCard: { padding: 18, borderRadius: 12, backgroundColor: referencePalette.surface, borderWidth: 1, borderColor: referencePalette.line, gap: 6, alignItems: 'center' },
  emptyTitle: { color: referencePalette.navy, fontSize: 15, lineHeight: 20, fontWeight: '900', textAlign: 'center' },
  emptyBody: { color: referencePalette.muted, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },

  // Timeline (progress evidence)
  timelineRow: { flexDirection: 'row', gap: 11, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#EEE9DF' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: referencePalette.green },
  timelineCopy: { flex: 1, minWidth: 0, gap: 1 },
  timelineTitle: { color: referencePalette.navy, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  timelineMeta: { color: referencePalette.muted, fontSize: 11, lineHeight: 15 },

  // Guided session
  sessionTimerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderRadius: 12, backgroundColor: referencePalette.navy, paddingHorizontal: 15, paddingVertical: 12 },
  sessionTimerLabel: { color: '#F0D6A6', fontSize: 9, lineHeight: 13, letterSpacing: 1, fontWeight: '900' },
  sessionTimerValue: { color: '#FFFFFF', fontSize: 26, lineHeight: 31, fontWeight: '900', fontVariant: ['tabular-nums'] },
  sessionTimerButton: { minWidth: 82, minHeight: 42, borderRadius: 9, backgroundColor: referencePalette.green, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  sessionTimerButtonText: { color: '#FFFFFF', fontSize: 13, lineHeight: 18, fontWeight: '900' },
  sessionStepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 8 },
  sessionStepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: referencePalette.green },
  sessionStepNumberText: { color: '#FFFFFF', fontSize: 12, lineHeight: 16, fontWeight: '900' },
  sessionStepText: { flex: 1, color: referencePalette.text, fontSize: 13.5, lineHeight: 19 },

  // Onboarding
  onboardingMark: { width: 84, height: 84, alignSelf: 'center', borderRadius: 24, backgroundColor: referencePalette.surface, borderWidth: 1, borderColor: referencePalette.line, alignItems: 'center', justifyContent: 'center' },
  onboardingTitle: { color: referencePalette.navy, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -0.5 },
  onboardingBody: { color: referencePalette.muted, fontSize: 14, lineHeight: 21 },
  onboardingTrack: { height: 5, borderRadius: 999, backgroundColor: '#EDE8DE', overflow: 'hidden' },
  onboardingFill: { height: '100%', borderRadius: 999, backgroundColor: referencePalette.green },
  onboardingStep: { color: referencePalette.muted, fontSize: 10, lineHeight: 14, letterSpacing: 1.1, fontWeight: '900' },
});
