import { gql } from '@apollo/client';

// Assessment Queries
export const GET_BASELINE_ASSESSMENT = gql`
  query GetBaselineAssessment {
    getBaselineAssessment {
      id
      type
      title
      description
      timeLimit
      passingScore
      totalMarks
      canAttempt
      totalAttempts
      bestScore
      questions {
        id
        question
        type
        options
        points
        difficulty
      }
    }
  }
`;

export const GET_MODULE_ASSESSMENT = gql`
  query GetModuleAssessment($moduleId: ID!) {
    getModuleAssessment(moduleId: $moduleId) {
      id
      type
      title
      description
      timeLimit
      passingScore
      totalMarks
      canAttempt
      totalAttempts
      bestScore
      questions {
        id
        question
        type
        options
        points
        difficulty
      }
    }
  }
`;

export const GET_ASSESSMENT = gql`
  query GetAssessment($id: ID!) {
    getAssessment(id: $id) {
      id
      type
      title
      description
      timeLimit
      passingScore
      totalMarks
      canAttempt
      totalAttempts
      bestScore
      questions {
        id
        question
        type
        options
        points
        difficulty
      }
    }
  }
`;

// Assessment Mutations
export const SUBMIT_ASSESSMENT = gql`
  mutation SubmitAssessment($input: SubmitAssessmentInput!) {
    submitAssessment(input: $input) {
      assessmentId
      type
      score
      percentage
      passed
      totalQuestions
      correctAnswers
      passingScore
      feedback
      nextAction
      recommendations {
        skillLevel
        score
        strengths
        weaknesses
        nextSteps
        suggestedModules
      }
    }
  }
`;

export const SUBMIT_ASSESSMENT_AND_GENERATE_ROADMAP = gql`
  mutation SubmitAssessmentAndGenerateRoadmap($input: SubmitAssessmentWithRoadmapInput!) {
    submitAssessmentAndGenerateRoadmap(input: $input) {
      assessmentResult {
        assessmentId
        type
        score
        percentage
        passed
        totalQuestions
        correctAnswers
        passingScore
        feedback
        nextAction
        recommendations {
          skillLevel
          score
          strengths
          weaknesses
          nextSteps
          suggestedModules
        }
      }
      roadmap {
        id
        title
        description
        status
        estimatedDuration {
          weeks
          hours
        }
        difficulty
        learningOutcomes
        completionPercentage
        currentModule {
          id
          title
          description
          order
          status
          estimatedHours
          difficulty
          learningObjectives
          isUnlocked
          progress
        }
        nextAction
        modules {
          id
          title
          description
          order
          status
          estimatedHours
          difficulty
          learningObjectives
          isUnlocked
          progress
          lessons {
            id
            title
            description
            order
            contentType
            estimatedMinutes
            difficulty
            status
            learningObjectives
            keyTakeaways
          }
        }
        createdAt
      }
    }
  }
`;