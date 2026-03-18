import gql from 'graphql-tag';

export default gql`
  # Roadmap type
  type Roadmap {
    id: ID!
    title: String!
    description: String!
    status: RoadmapStatus!
    modules: [Module!]!
    estimatedDuration: Duration!
    difficulty: SkillLevel!
    learningOutcomes: [String!]!
    completionPercentage: Float!
    currentModule: Module
    nextAction: NextAction!
    createdAt: String!
  }

  # Module type
  type Module {
    id: ID!
    title: String!
    description: String!
    order: Int!
    status: ModuleStatus!
    lessons: [Lesson!]!
    estimatedHours: Float!
    difficulty: SkillLevel!
    learningObjectives: [String!]!
    isUnlocked: Boolean!
    progress: Float!
  }

  # Lesson type
  type Lesson {
    id: ID!
    title: String!
    description: String!
    order: Int!
    contentType: ContentType!
    estimatedMinutes: Int!
    difficulty: SkillLevel!
    status: LessonStatus!
    learningObjectives: [String!]!
    keyTakeaways: [String!]!
  }

  # Duration type
  type Duration {
    weeks: Int!
    hours: Float!
  }

  # Enums
  enum RoadmapStatus {
    DRAFT
    ACTIVE
    PAUSED
    COMPLETED
    ARCHIVED
  }

  enum ModuleStatus {
    LOCKED
    UNLOCKED
    IN_PROGRESS
    COMPLETED
    SKIPPED
  }

  enum LessonStatus {
    NOT_STARTED
    IN_PROGRESS
    COMPLETED
    REVIEW_NEEDED
  }

  enum ContentType {
    VIDEO
    ARTICLE
    INTERACTIVE
    QUIZ
    PROJECT
    EXERCISE
  }

  enum NextAction {
    START_BASELINE
    CONTINUE_LESSON
    TAKE_QUIZ
    REVIEW_MODULE
    START_NEXT_MODULE
    COMPLETE_ASSESSMENT
    REMEDIATE
  }

  # Inputs
  input GenerateRoadmapInput {
    learningGoal: String!
    skillLevel: SkillLevel!
    duration: Int!
  }

  # Queries
  extend type Query {
    myRoadmap: Roadmap
    getRoadmap(id: ID!): Roadmap!
    getModule(id: ID!): Module!
    getLesson(id: ID!): Lesson!
  }

  # Mutations
  extend type Mutation {
    generateRoadmap(input: GenerateRoadmapInput!): Roadmap!
    generateRoadmapFromBaseline(duration: Int!): Roadmap!
    startRoadmap(roadmapId: ID!): Roadmap!
  }
`;
