import { gql } from '@apollo/client';

// AI Queries
export const ASK_QUESTION = gql`
  query AskQuestion($input: AskQuestionInput!) {
    askQuestion(input: $input) {
      explanation
      examples
      relatedConcepts
      furtherReading
      sources {
        lessonId
        relevance
      }
    }
  }
`;

// AI Mutations
export const RESOLVE_DOUBT = gql`
  mutation ResolveDoubt($input: ResolveDoubtInput!) {
    resolveDoubt(input: $input) {
      answer
      examples
      tips
      nextSteps
    }
  }
`;