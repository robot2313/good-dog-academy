import 'assessment_catalogue.dart';
import 'assessment_models.dart';

class AssessmentScoreResult {
  const AssessmentScoreResult({
    required this.responses,
    required this.calculatedScores,
    required this.unknownSkills,
  });

  final List<AssessmentResponseRecord> responses;
  final Map<String, int> calculatedScores;
  final List<String> unknownSkills;
}

class AssessmentScoringException implements Exception {
  const AssessmentScoringException(this.message);
  final String message;
}

int scoreQuestion(AssessmentQuestion question, AssessmentOption option) {
  final value = assessmentFrequencyValue(option);
  if (value == null) return 50;
  return question.scoringDirection == ScoringDirection.positive
      ? value * 25
      : (4 - value) * 25;
}

AssessmentScoreResult calculateAssessmentScores(
  Map<String, AssessmentOption> answers,
) {
  final scores = neutralSkillScores();
  final unknown = <String>[];
  final responses = <AssessmentResponseRecord>[];

  for (final question in assessmentQuestions) {
    final answer = answers[question.id];
    if (answer == null) {
      throw AssessmentScoringException('Missing response for ${question.id}.');
    }
    final frequency = assessmentFrequencyValue(answer);
    scores[question.skill] = scoreQuestion(question, answer);
    if (frequency == null) unknown.add(question.skill);
    responses.add(
      AssessmentResponseRecord(
        questionId: question.id,
        skill: question.skill,
        selectedOption: answer,
        frequencyValue: frequency,
        scoringDirection: question.scoringDirection,
      ),
    );
  }

  return AssessmentScoreResult(
    responses: List.unmodifiable(responses),
    calculatedScores: Map.unmodifiable(scores),
    unknownSkills: List.unmodifiable(unknown),
  );
}

bool hasSevereReactivityResponse(Map<String, AssessmentOption> answers) {
  final response = answers['reactivity'];
  return response == AssessmentOption.often ||
      response == AssessmentOption.almostAlways;
}
