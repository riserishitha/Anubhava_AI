/**
 * Response Formatters
 * Standardized response formatting for consistency
 */

/**
 * Format success response
 */
export const formatSuccess = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Format error response
 */
export const formatError = (error, message = 'An error occurred') => {
  return {
    success: false,
    message,
    error: {
      name: error.name,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Format paginated response
 */
export const formatPaginatedResponse = (data, page, limit, total) => {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Format user object (remove sensitive data)
 */
export const formatUser = (user) => {
  const userObj = user?.toObject ? user.toObject() : user;

  const firstName = userObj?.firstName || '';
  const lastName = userObj?.lastName || '';

  const preferences = userObj?.preferences || {};

  return {
    id: (userObj?._id?.toString?.() || userObj?._id || userObj?.id),
    email: userObj?.email,
    firstName,
    lastName,
    fullName: userObj?.fullName || `${firstName} ${lastName}`.trim(),

    learningGoals: userObj?.learningGoals ?? [],
    skillLevel: userObj?.skillLevel ?? 'BEGINNER',

    onboardingCompleted: Boolean(userObj?.onboardingCompleted),
    baselineAssessmentCompleted: Boolean(userObj?.baselineAssessmentCompleted),

    preferences: {
      learningPace: preferences.learningPace ?? 'MODERATE',
      dailyGoalMinutes: preferences.dailyGoalMinutes ?? 30,
      emailNotifications: preferences.emailNotifications ?? true,
    },

    createdAt: userObj?.createdAt
      ? new Date(userObj.createdAt).toISOString()
      : new Date().toISOString(),
    updatedAt: userObj?.updatedAt
      ? new Date(userObj.updatedAt).toISOString()
      : new Date().toISOString(),
  };
};

/**
 * Format roadmap with computed fields
 */
export const formatRoadmap = (roadmap, progress = null) => {
  const roadmapObj = roadmap.toObject ? roadmap.toObject() : roadmap;

  const completedLessonIds = new Set(
    (progress?.completedLessons || []).map((l) => String(l.lessonId))
  );

  const modules = (roadmapObj.modules || []).map((m) => {
    const lessons = m?.lessons || [];
    const totalLessons = lessons.length;

    const completedCount = lessons.reduce((count, lesson) => {
      const lessonId = lesson?._id || lesson?.id;
      return lessonId && completedLessonIds.has(String(lessonId)) ? count + 1 : count;
    }, 0);

    const moduleProgress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0;

    return formatModule(m, (m?.status || 'LOCKED') !== 'LOCKED', moduleProgress);
  });

  const currentModule = progress?.currentModuleId
    ? modules.find((m) => String(m.id) === String(progress.currentModuleId)) || null
    : null;

  return {
    id: roadmapObj._id,
    title: roadmapObj.title,
    description: roadmapObj.description,
    status: roadmapObj.status,
    modules,
    estimatedDuration: roadmapObj.estimatedDuration,
    difficulty: roadmapObj.difficulty || roadmapObj.targetSkillLevel || 'BEGINNER',
    learningOutcomes: roadmapObj.learningOutcomes || [],
    completionPercentage: progress?.completionPercentage || 0,
    currentModule,
    nextAction: progress?.nextAction || 'START_BASELINE',
    createdAt: roadmapObj.createdAt ? new Date(roadmapObj.createdAt).toISOString() : null,
  };
};

/**
 * Format module with unlock status
 */
export const formatModule = (module, isUnlocked = false, progress = 0) => {
  const moduleObj = module.toObject ? module.toObject() : module;

  const lessons = (moduleObj.lessons || []).map((lesson) => {
    const lessonObj = lesson?.toObject ? lesson.toObject() : lesson;
    return {
      id: lessonObj._id,
      title: lessonObj.title,
      description: lessonObj.description,
      order: lessonObj.order,
      contentType: lessonObj.contentType,
      estimatedMinutes: lessonObj.estimatedMinutes,
      difficulty: lessonObj.difficulty,
      status: lessonObj.status,
      learningObjectives: lessonObj.learningObjectives || [],
      keyTakeaways: lessonObj.keyTakeaways || [],
    };
  });

  return {
    id: moduleObj._id,
    title: moduleObj.title,
    description: moduleObj.description,
    order: moduleObj.order,
    status: isUnlocked ? moduleObj.status : 'LOCKED',
    lessons,
    estimatedHours: moduleObj.estimatedHours,
    difficulty: moduleObj.difficulty,
    learningObjectives: moduleObj.learningObjectives || [],
    isUnlocked,
    progress,
  };
};

/**
 * Format assessment result
 */
export const formatAssessmentResult = (assessment, score, passed) => {
  return {
    assessmentId: assessment._id,
    type: assessment.type,
    score,
    passed,
    totalQuestions: assessment.questions.length,
    correctAnswers: Math.round((score / 100) * assessment.questions.length),
    passingScore: assessment.passingScore,
    feedback: generateFeedback(score, passed),
    nextAction: determineNextAction(passed, assessment.type),
  };
};

/**
 * Format progress summary
 */
export const formatProgressSummary = (progress) => {
  return {
    userId: progress.userId,
    roadmapId: progress.roadmapId,
    completionPercentage: progress.completionPercentage,
    currentModule: progress.currentModule,
    completedModules: progress.completedModules,
    totalTimeSpent: progress.totalTimeSpent,
    streak: progress.streak,
    lastActivityDate: progress.lastActivityDate,
    nextAction: progress.nextAction,
    achievements: progress.achievements || [],
  };
};

/**
 * Format AI explanation
 */
export const formatAIExplanation = (explanation, context = {}) => {
  return {
    explanation,
    context,
    generatedAt: new Date().toISOString(),
    source: 'AI',
  };
};

/**
 * Generate feedback based on score
 */
const generateFeedback = (score, passed) => {
  if (score >= 90) {
    return 'Excellent work! You have a strong understanding of the material.';
  } else if (score >= 80) {
    return 'Great job! You have a good grasp of the concepts.';
  } else if (score >= 70) {
    return 'Well done! You passed the assessment.';
  } else if (score >= 60) {
    return 'You\'re close! Review the material and try again.';
  } else {
    return 'Don\'t worry! Let\'s review the concepts together.';
  }
};

/**
 * Determine next action based on assessment result
 */
const determineNextAction = (passed, assessmentType) => {
  if (passed) {
    if (assessmentType === 'BASELINE') {
      return 'START_NEXT_MODULE';
    }
    return 'CONTINUE_LESSON';
  } else {
    return 'REMEDIATE';
  }
};

/**
 * Format quiz question (remove correct answers)
 */
export const formatQuizQuestion = (question) => {
  return {
    id: question._id,
    question: question.question,
    type: question.type,
    options: question.options,
    points: question.points,
    // correctAnswer is intentionally excluded
  };
};

/**
 * Format date to readable string
 */
export const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (part, total) => {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
};

export default {
  formatSuccess,
  formatError,
  formatPaginatedResponse,
  formatUser,
  formatRoadmap,
  formatModule,
  formatAssessmentResult,
  formatProgressSummary,
  formatAIExplanation,
  formatQuizQuestion,
  formatDate,
  calculatePercentage,
};