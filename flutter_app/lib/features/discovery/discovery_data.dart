import 'package:flutter/material.dart';

class TrainingCategoryData {
  const TrainingCategoryData({
    required this.id,
    required this.label,
    required this.shortLabel,
    required this.description,
    required this.lessonCount,
    required this.icon,
    required this.backgroundColor,
    required this.iconColor,
  });

  final String id;
  final String label;
  final String shortLabel;
  final String description;
  final int lessonCount;
  final IconData icon;
  final Color backgroundColor;
  final Color iconColor;
}

class DogStageData {
  const DogStageData({
    required this.id,
    required this.label,
    required this.age,
    required this.summary,
    required this.lessonCount,
    required this.icon,
  });

  final String id;
  final String label;
  final String age;
  final String summary;
  final int lessonCount;
  final IconData icon;
}

const trainingCategories = <TrainingCategoryData>[
  TrainingCategoryData(
    id: 'house-training',
    label: 'House Training',
    shortLabel: 'House',
    description: 'Toileting routines, signals and reliability.',
    lessonCount: 6,
    icon: Icons.home_outlined,
    backgroundColor: Color(0xFFEEF4E9),
    iconColor: Color(0xFF477B43),
  ),
  TrainingCategoryData(
    id: 'chewing',
    label: 'Chewing',
    shortLabel: 'Chewing',
    description: 'Safe chew choices, redirection and prevention.',
    lessonCount: 6,
    icon: Icons.toys_outlined,
    backgroundColor: Color(0xFFFFF0D9),
    iconColor: Color(0xFFA7660E),
  ),
  TrainingCategoryData(
    id: 'barking',
    label: 'Barking',
    shortLabel: 'Barking',
    description: 'Understand triggers and build calmer responses.',
    lessonCount: 6,
    icon: Icons.volume_up_outlined,
    backgroundColor: Color(0xFFE8F2FA),
    iconColor: Color(0xFF2C719C),
  ),
  TrainingCategoryData(
    id: 'jumping',
    label: 'Jumping Up',
    shortLabel: 'Jumping',
    description: 'Four paws down and calmer greetings.',
    lessonCount: 6,
    icon: Icons.vertical_align_top_rounded,
    backgroundColor: Color(0xFFFFF0E5),
    iconColor: Color(0xFFB76823),
  ),
  TrainingCategoryData(
    id: 'recall',
    label: 'Recall',
    shortLabel: 'Recall',
    description: 'Name response and reliable returns.',
    lessonCount: 6,
    icon: Icons.keyboard_return_rounded,
    backgroundColor: Color(0xFFE8F5EE),
    iconColor: Color(0xFF2B8050),
  ),
  TrainingCategoryData(
    id: 'loose-lead-walking',
    label: 'Loose-Lead Walking',
    shortLabel: 'Loose Lead',
    description: 'Relaxed walking without constant pulling.',
    lessonCount: 6,
    icon: Icons.directions_walk_rounded,
    backgroundColor: Color(0xFFF5EAF8),
    iconColor: Color(0xFF7A4A88),
  ),
  TrainingCategoryData(
    id: 'focus',
    label: 'Focus',
    shortLabel: 'Focus',
    description: 'Attention, check-ins and distraction skills.',
    lessonCount: 6,
    icon: Icons.visibility_outlined,
    backgroundColor: Color(0xFFE9F2FB),
    iconColor: Color(0xFF2D6E9C),
  ),
  TrainingCategoryData(
    id: 'impulse-control',
    label: 'Impulse Control',
    shortLabel: 'Self-Control',
    description: 'Waiting, settling and thoughtful choices.',
    lessonCount: 6,
    icon: Icons.self_improvement_rounded,
    backgroundColor: Color(0xFFFFF4DB),
    iconColor: Color(0xFFA77914),
  ),
  TrainingCategoryData(
    id: 'confidence',
    label: 'Confidence',
    shortLabel: 'Confidence',
    description: 'Safer exploration and recovery from surprises.',
    lessonCount: 6,
    icon: Icons.explore_outlined,
    backgroundColor: Color(0xFFEAF4EC),
    iconColor: Color(0xFF39754A),
  ),
  TrainingCategoryData(
    id: 'reactivity',
    label: 'Reactivity',
    shortLabel: 'Reactivity',
    description: 'Distance, recovery and safe trigger work.',
    lessonCount: 6,
    icon: Icons.shield_outlined,
    backgroundColor: Color(0xFFFBE9EC),
    iconColor: Color(0xFFB64C62),
  ),
];

const dogStages = <DogStageData>[
  DogStageData(
    id: 'puppy',
    label: 'Puppy',
    age: '0–12 months',
    summary: 'Build a strong foundation with short, positive lessons.',
    lessonCount: 18,
    icon: Icons.pets_rounded,
  ),
  DogStageData(
    id: 'adult',
    label: 'Adult Dog',
    age: '1–7 years',
    summary: 'Maintain good habits and build reliable everyday skills.',
    lessonCount: 18,
    icon: Icons.pets_rounded,
  ),
  DogStageData(
    id: 'senior',
    label: 'Senior Dog',
    age: '7+ years',
    summary: 'Keep minds active and support confidence with gentle training.',
    lessonCount: 15,
    icon: Icons.favorite_outline_rounded,
  ),
  DogStageData(
    id: 'rescue',
    label: 'Rescue Dog',
    age: 'Any age',
    summary:
        'Patient, trust-building lessons for settling in and feeling secure.',
    lessonCount: 18,
    icon: Icons.volunteer_activism_outlined,
  ),
];
