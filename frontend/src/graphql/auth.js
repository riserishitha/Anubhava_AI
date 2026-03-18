import { gql } from '@apollo/client';

// Auth Mutations
export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        firstName
        lastName
        fullName
        learningGoals
        skillLevel
        onboardingCompleted
        baselineAssessmentCompleted
      }
      token
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        firstName
        lastName
        fullName
        learningGoals
        skillLevel
        onboardingCompleted
        baselineAssessmentCompleted
        preferences {
          learningPace
          dailyGoalMinutes
          emailNotifications
        }
      }
      token
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      firstName
      lastName
      fullName
      learningGoals
      skillLevel
      preferences {
        learningPace
        dailyGoalMinutes
        emailNotifications
      }
    }
  }
`;

// Auth Queries
export const ME = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
      fullName
      learningGoals
      skillLevel
      onboardingCompleted
      baselineAssessmentCompleted
      preferences {
        learningPace
        dailyGoalMinutes
        emailNotifications
      }
      createdAt
      updatedAt
    }
  }
`;