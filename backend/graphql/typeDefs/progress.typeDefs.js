import gql from 'graphql-tag';

export default gql`
  # Progress type
  type Progress {
    userId: ID!
    roadmapId: ID!
    completionPercentage: Float!
    currentModule: Module
    currentLesson: Lesson
    completedModules: [CompletedModule!]!
    completedLessons: [CompletedLesson!]!
    streak: Streak!
    nextAction: NextAction!
    achievements: [Achievement!]!
    lastActivityDate: String!
  }

  # Completed module
  type CompletedModule {
    moduleId: ID!
    moduleName: String
    completedAt: String!
    score: Float
  }

  # Completed lesson
  type CompletedLesson {
    lessonId: ID!
    lessonName: String
    estimatedMinutes: Int
    completedAt: String!
  }

  # Streak
  type Streak {
    current: Int!
    longest: Int!
    lastActivityDate: String
  }

  # Achievement
  type Achievement {
    type: AchievementType!
    achievedAt: String!
    metadata: JSON
  }

  # Enums
  enum AchievementType {
    FIRST_LESSON
    FIRST_MODULE
    WEEK_STREAK
    MONTH_STREAK
    PERFECT_QUIZ
    FAST_LEARNER
    PERSISTENT
    COMPLETE_ROADMAP
  }

  # Scalar for JSON
  scalar JSON

  # Inputs
  input MarkLessonCompleteInput {
    lessonId: ID!
  }

  # Queries
  extend type Query {
    myProgress: Progress
    getProgress(roadmapId: ID!): Progress
  }

  # Mutations
  extend type Mutation {
    markLessonComplete(input: MarkLessonCompleteInput!): Progress!
    recordActivity: Progress!
  }
`;