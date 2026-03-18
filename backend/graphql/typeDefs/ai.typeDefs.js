import gql from 'graphql-tag';

export default gql`
  # AI Explanation type
  type AIExplanation {
    explanation: String!
    examples: [String!]!
    relatedConcepts: [String!]!
    furtherReading: [String!]!
    sources: [Source!]!
  }

  # Source reference
  type Source {
    lessonId: ID!
    relevance: Float!
  }

  # Doubt resolution
  type DoubtResolution {
    answer: String!
    examples: [String!]!
    tips: [String!]!
    nextSteps: [String!]!
  }

  # Inputs
  input AskQuestionInput {
    question: String!
    lessonId: ID
  }

  input ResolveDoubtInput {
    doubt: String!
    currentLessonId: ID
  }

  # Queries
  extend type Query {
    askQuestion(input: AskQuestionInput!): AIExplanation!
  }

  # Mutations
  extend type Mutation {
    resolveDoubt(input: ResolveDoubtInput!): DoubtResolution!
  }
`;