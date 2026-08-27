import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { IdentityHeader } from '../components/IdentityHeader';
import { ReferenceIcon } from '../components/ReferenceIcon';
import { trainingCategories } from '../features/lessons/discovery';
import { useLessonLibraryData } from '../features/lessons/library/LessonLibraryContext';
import { referencePalette, referenceStyles } from '../theme/referenceStyles';
import type { RootStackParamList } from '../types/navigation';

const categoryTones = [
  ['#EEF4E9', '#477B43'], ['#FFF0D9', '#A7660E'], ['#E8F2FA', '#2C719C'], ['#FFF0E5', '#B76823'], ['#E8F5EE', '#2B8050'],
  ['#F5EAF8', '#7A4A88'], ['#E9F2FB', '#2D6E9C'], ['#FFF4DB', '#A77914'], ['#EAF4EC', '#39754A'], ['#FBE9EC', '#B64C62'],
] as const;

export function AcademyScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { catalogue } = useLessonLibraryData();
  const categoryCounts = new Map(trainingCategories.map((category) => [category.skill, catalogue.definitions.filter((lesson) => lesson.skill === category.skill && lesson.isActive).length]));

  return <SafeAreaView style={referenceStyles.screen}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={referenceStyles.scroll} showsVerticalScrollIndicator={false}>
      <IdentityHeader />
      <View style={referenceStyles.header}><Text accessibilityRole="header" style={referenceStyles.title}>Categories</Text><Text style={referenceStyles.subtitle}>Explore training topics</Text></View>
      <View style={referenceStyles.categoryList}>{trainingCategories.map((category, index) => {
        const [backgroundColor, iconColor] = categoryTones[index % categoryTones.length]!;
        const count = categoryCounts.get(category.skill) ?? 0;
        return <Pressable key={category.skill} accessibilityRole="button" accessibilityLabel={`${category.label}. ${count} lessons. ${category.description}`} onPress={() => navigation.navigate('LessonBrowse', { skill: category.skill })} style={({ pressed }) => [referenceStyles.categoryRow, pressed && referenceStyles.pressed]}>
          <View style={[referenceStyles.categoryIconBox, { backgroundColor }]}><ReferenceIcon name={category.skill} size={21} color={iconColor} /></View>
          <Text style={referenceStyles.categoryRowTitle}>{category.label}</Text><Text style={referenceStyles.categoryCount}>{count} lessons</Text><ReferenceIcon name="chevron" size={16} color={referencePalette.inactive} />
        </Pressable>;
      })}</View>
    </ScrollView>
  </SafeAreaView>;
}
