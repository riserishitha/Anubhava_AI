import gql from 'graphql-tag';

export default gql`
  # User type
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    fullName: String!
    learningGoals: [String!]!
    skillLevel: SkillLevel!
    onboardingCompleted: Boolean!
    baselineAssessmentCompleted: Boolean!
    preferences: UserPreferences!
    createdAt: String!
    updatedAt: String!
  }

  # User preferences
  type UserPreferences {
    learningPace: LearningPace!
    dailyGoalMinutes: Int!
    emailNotifications: Boolean!
  }

  # Auth payload
  type AuthPayload {
    user: User!
    token: String!
  }

  # Enums
  enum SkillLevel {
    BEGINNER
    INTERMEDIATE
    ADVANCED
    EXPERT
  }

  enum LearningPace {
    SLOW
    MODERATE
    FAST
    CUSTOM
  }

  # Inputs
  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    learningGoal: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    learningGoals: [String!]
    skillLevel: SkillLevel
    preferences: UserPreferencesInput
  }

  input UserPreferencesInput {
    learningPace: LearningPace
    dailyGoalMinutes: Int
    emailNotifications: Boolean
  }

  # Queries
  extend type Query {
    me: User!
  }

  # Mutations
  extend type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    updateProfile(input: UpdateProfileInput!): User!
  }
`;