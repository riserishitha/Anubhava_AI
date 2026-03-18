import gql from 'graphql-tag';

export default gql`
  # Assessment type
  type Assessment {
    id: ID!
    type: AssessmentType!
    title: String!
    description: String
    questions: [Question!]!
    timeLimit: Int!
    passingScore: Int!
    totalMarks: Int!
    canAttempt: Boolean!
    totalAttempts: Int!
    bestScore: Float!
  }

  # Question type (without correct answer)
  type Question {
    id: ID!
    question: String!
    type: QuestionType!
    options: [String!]
    points: Int!
    difficulty: SkillLevel!
  }

  # Assessment result
  type AssessmentResult {
    assessmentId: ID!
    type: AssessmentType!
    score: Float!
    percentage: Float!
    passed: Boolean!
    totalQuestions: Int!
    correctAnswers: Int!
    passingScore: Int!
    feedback: String!
    nextAction: NextAction!
    recommendations: AssessmentRecommendations
  }

  # Recommendations based on assessment results
  type AssessmentRecommendations {
    skillLevel: SkillLevel!
    score: Float!
    strengths: [String!]!
    weaknesses: [String!]!
    nextSteps: [String!]!
    suggestedModules: [String!]!
  }

  # Enums
  enum AssessmentType {
    BASELINE
    MODULE_PRE
    MODULE_POST
    QUIZ
    FINAL
  }

  enum QuestionType {
    MULTIPLE_CHOICE
    TRUE_FALSE
    SHORT_ANSWER
    CODE_SNIPPET
  }

  # Inputs
  input SubmitAssessmentInput {
    assessmentId: ID!
    answers: [AnswerInput!]!
  }

  input AnswerInput {
    questionId: ID!
    selectedOption: String
    answer: String
  }

  # Queries
  extend type Query {
    getBaselineAssessment: Assessment!
    getModuleAssessment(moduleId: ID!): Assessment!
    getAssessment(id: ID!): Assessment!
  }

  # Mutations
  extend type Mutation {
    submitAssessment(input: SubmitAssessmentInput!): AssessmentResult!
    submitAssessmentAndGenerateRoadmap(input: SubmitAssessmentWithRoadmapInput!): AssessmentResultWithRoadmap!
  }

  # Input for combined baseline + roadmap generation
  input SubmitAssessmentWithRoadmapInput {
    assessmentId: ID!
    answers: [AnswerInput!]!
    roadmapDuration: Int!
  }

  # Result that includes both assessment + roadmap
  type AssessmentResultWithRoadmap {
    assessmentResult: AssessmentResult!
    roadmap: Roadmap!
  }
`;