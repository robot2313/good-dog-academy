import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { IdentityHeader } from '../../../components/IdentityHeader';
import { ReferenceIcon } from '../../../components/ReferenceIcon';
import { getLessonImageSource } from '../coaching/lessonImageManifest';
import { referencePalette, referenceStyles } from '../../../theme/referenceStyles';
import type { MainTabParamList, RootStackParamList } from '../../../types/navigation';
import { lessonCollections, type LessonCollectionId } from './lessonDiscovery';

type StackProps = NativeStackScreenProps<RootStackParamList, 'DogStages'>;
type TabProps = CompositeScreenProps<BottomTabScreenProps<MainTabParamList, 'Dog'>, NativeStackScreenProps<RootStackParamList, 'Main'>>;

const stageCopy = {
  puppy: { age: '0–12 months', summary: 'Build a strong foundation with short, positive lessons.' },
  adult: { age: '1–7 years', summary: 'Maintain good habits and build reliable everyday skills.' },
  senior: { age: '7+ years', summary: 'Keep minds active and support confidence with gentle training.' },
  rescue: { age: 'Any age', summary: 'Patient, trust-building lessons for settling in and feeling secure.' },
} as const satisfies Record<LessonCollectionId, { readonly age: string; readonly summary: string }>;

export function DogStagesScreen({ navigation }: StackProps): React.JSX.Element {
  return <DogStagesContent onBack={() => navigation.goBack()} onOpenCollection={(collectionId) => navigation.navigate('LessonBrowse', { collectionId })} />;
}

export function DogStagesTabScreen({ navigation }: TabProps): React.JSX.Element {
  return <DogStagesContent onOpenCollection={(collectionId) => navigation.navigate('LessonBrowse', { collectionId })} />;
}

function DogStagesContent({ onBack, onOpenCollection }: { readonly onBack?: () => void; readonly onOpenCollection: (collectionId: LessonCollectionId) => void }): React.JSX.Element {
  return <SafeAreaView style={referenceStyles.screen}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={referenceStyles.scroll} showsVerticalScrollIndicator={false}>
      {onBack ? <View style={referenceStyles.headerRow}><Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={({ pressed }) => [referenceStyles.iconButton, pressed && referenceStyles.pressed]}><ReferenceIcon name="back" /></Pressable><View style={{ width: 38 }} /></View> : null}
      {onBack ? null : <IdentityHeader />}
      <View style={referenceStyles.header}><Text accessibilityRole="header" style={referenceStyles.title}>Training by Life Stage</Text><Text style={referenceStyles.subtitle}>Choose your dog’s stage</Text></View>
      <View style={referenceStyles.lifeStageList}>{lessonCollections.map((collection) => {
        const copy = stageCopy[collection.id];
        return <Pressable key={collection.id} accessibilityRole="button" accessibilityLabel={`${collection.label}. ${copy.age}. ${collection.lessonIds.length} lessons. ${copy.summary}`} onPress={() => onOpenCollection(collection.id)} style={({ pressed }) => [referenceStyles.lifeStageCard, pressed && referenceStyles.pressed]}>
          <View style={referenceStyles.lifeStageImage}><Image accessible={false} resizeMode="cover" source={getLessonImageSource(collection.anchorLessonId)} style={referenceStyles.cardSideImageFill} /></View>
          <View style={referenceStyles.lifeStageCopy}><Text style={referenceStyles.lifeStageTitle}>{collection.label}</Text><Text style={referenceStyles.lifeStageAge}>{copy.age}</Text><Text numberOfLines={3} style={referenceStyles.lifeStageDescription}>{copy.summary}</Text></View>
          <View style={referenceStyles.lifeStageChevron}><ReferenceIcon name="chevron" size={18} color={referencePalette.muted} /></View>
        </Pressable>;
      })}</View>
    </ScrollView>
  </SafeAreaView>;
}
