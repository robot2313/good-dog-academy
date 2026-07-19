import type { Lesson } from '../types/domain';

export const lessons: Lesson[] = [
  {
    id: 'marker',
    title: 'Build a Marker Word',
    course: 'Foundations',
    duration: 8,
    summary: 'Teach “Yes” to clearly mark the exact behaviour that earned a reward.',
  },
  {
    id: 'name',
    title: 'Name Response',
    course: 'Foundations',
    duration: 10,
    summary: 'Teach your dog to look at you after hearing its name once.',
  },
  {
    id: 'lead',
    title: 'Loose-Lead Foundations',
    course: 'Walking',
    duration: 12,
    summary: 'Teach your dog that a loose lead makes forward movement continue.',
  },
  {
    id: 'recall',
    title: 'Indoor Recall',
    course: 'Recall',
    duration: 10,
    summary: 'Build a fast, happy recall from a short distance indoors.',
  },
];
