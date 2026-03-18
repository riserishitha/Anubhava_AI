import { gql } from '@apollo/client';

// Roadmap Queries
export const MY_ROADMAP = gql`
  query MyRoadmap {
    myRoadmap {
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
`;

export const GET_ROADMAP = gql`
  query GetRoadmap($id: ID!) {
    getRoadmap(id: $id) {
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
      }
      createdAt
    }
  }
`;

export const GET_MODULE = gql`
  query GetModule($id: ID!) {
    getModule(id: $id) {
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
  }
`;

export const GET_LESSON = gql`
  query GetLesson($id: ID!) {
    getLesson(id: $id) {
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
`;

// Roadmap Mutations
export const GENERATE_ROADMAP = gql`
  mutation GenerateRoadmap($input: GenerateRoadmapInput!) {
    generateRoadmap(input: $input) {
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
      }
      createdAt
    }
  }
`;

export const START_ROADMAP = gql`
  mutation StartRoadmap($roadmapId: ID!) {
    startRoadmap(roadmapId: $roadmapId) {
      id
      status
      currentModule {
        id
        title
        status
      }
      nextAction
    }
  }
`;