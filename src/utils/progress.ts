export function calculateProgress(completedCount: number, lessonCount: number): number {
  if (lessonCount === 0) {
    return 0;
  }

  return Math.round((completedCount / lessonCount) * 100);
}
