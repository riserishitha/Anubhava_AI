import { gql } from '@apollo/client';

// Progress Queries
export const MY_PROGRESS = gql`
  query MyProgress {
    myProgress {
      userId
      roadmapId
      completionPercentage
      currentModule {
        id
        title
        description
        order
        status
        progress
      }
      currentLesson {
        id
        title
        description
        order
        status
      }
      completedModules {
        moduleId
        moduleName
        completedAt
        score
      }
      completedLessons {
        lessonId
        lessonName
        estimatedMinutes
        completedAt
      }
      streak {
        current
        longest
        lastActivityDate
      }
      nextAction
      achievements {
        type
        achievedAt
        metadata
      }
      lastActivityDate
    }
  }
`;

export const GET_PROGRESS = gql`
  query GetProgress($roadmapId: ID!) {
    getProgress(roadmapId: $roadmapId) {
      userId
      roadmapId
      completionPercentage
      currentModule {
        id
        title
      }
      currentLesson {
        id
        title
      }
      completedModules {
        moduleId
        moduleName
        completedAt
      }
      completedLessons {
        lessonId
        lessonName
        estimatedMinutes
        completedAt
      }
      streak {
        current
        longest
      }
      nextAction
      lastActivityDate
    }
  }
`;

// Progress Mutations
export const MARK_LESSON_COMPLETE = gql`
  mutation MarkLessonComplete($input: MarkLessonCompleteInput!) {
    markLessonComplete(input: $input) {
      userId
      roadmapId
      completionPercentage
      currentModule {
        id
        title
        status
        progress
      }
      currentLesson {
        id
        title
        status
      }
      completedLessons {
        lessonId
        lessonName
        completedAt
      }
      nextAction
    }
  }
`;

export const RECORD_ACTIVITY = gql`
  mutation RecordActivity {
    recordActivity {
      userId
      roadmapId
      streak {
        current
        longest
        lastActivityDate
      }
      lastActivityDate
    }
  }
`;