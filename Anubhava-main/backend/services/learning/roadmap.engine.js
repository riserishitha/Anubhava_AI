import geminiService from "../ai/gemini.service.js";
import promptService from "../ai/prompt.service.js";
import responseParser from "../ai/response.parser.js";
import Roadmap from "../../models/Roadmap.model.js";
import Module from "../../models/Module.model.js";
import Lesson from "../../models/Lesson.model.js";
import Progress from "../../models/Progress.model.js";
import { GENERATION_CONFIG, PROMPT_VERSIONS } from "../../constants/index.js";
import { BusinessLogicError } from "../../utils/errors.js";
import logger from "../../utils/logger.js";

/**
 * Roadmap Engine
 * Generates and manages adaptive learning roadmaps
 * Core business logic for roadmap creation
 */
class RoadmapEngine {
  /**
   * Generate personalized roadmap
   */
  async generateRoadmap({
    userId,
    learningGoal,
    skillLevel,
    duration,
    baselineScore = null,
  }) {
    try {
      logger.info("Generating roadmap", { userId, learningGoal, skillLevel });

      // Step 1: Generate prompt
      const prompt = promptService.generateRoadmapPrompt({
        learningGoal,
        skillLevel,
        duration,
        baselineScore,
      });

      // Step 2: Call AI to generate roadmap
      const aiResponse = await geminiService.generateJSON(prompt, {
        // Lower temperature improves JSON compliance / determinism.
        temperature: 0.3,
        maxOutputTokens: 16000, // Increased from 8192 to handle large roadmaps
      });

      // Step 3: Parse and validate AI response
      const parsedRoadmap = responseParser.parseRoadmap(aiResponse);

      // Step 4: Create database records
      const roadmap = await this.createRoadmapInDatabase({
        userId,
        learningGoal,
        skillLevel,
        duration,
        baselineScore,
        aiResponse: parsedRoadmap,
      });

      // Step 5: Initialize progress tracking
      await this.initializeProgress(userId, roadmap._id);

      logger.info("Roadmap generated successfully", {
        userId,
        roadmapId: roadmap._id,
        modulesCount: roadmap.modules.length,
      });

      return roadmap;
    } catch (error) {
      logger.error("Roadmap generation failed:", error);
      throw error;
    }
  }

  /**
   * Create roadmap and related documents in database
   */
  async createRoadmapInDatabase({
    userId,
    learningGoal,
    skillLevel,
    duration,
    baselineScore,
    aiResponse,
  }) {
    try {
      // Create roadmap document
      const roadmap = await Roadmap.create({
        userId,
        title: aiResponse.title,
        description: aiResponse.description,
        learningGoal,
        targetSkillLevel: skillLevel,
        status: "DRAFT",
        estimatedDuration: aiResponse.estimatedDuration,
        difficulty: aiResponse.difficulty,
        prerequisites: aiResponse.prerequisites || [],
        learningOutcomes: aiResponse.learningOutcomes || [],
        generationMetadata: {
          aiModel: "gemini-pro",
          promptVersion: PROMPT_VERSIONS.ROADMAP_GENERATION,
          generatedAt: new Date(),
          baselineScore,
        },
      });

      // Create modules and lessons
      const moduleIds = [];

      for (const moduleData of aiResponse.modules) {
        const module = await this.createModule(roadmap._id, moduleData);
        moduleIds.push(module._id);
      }

      // Update roadmap with module references
      roadmap.modules = moduleIds;
      await roadmap.save();

      // Populate for return
      await roadmap.populate("modules");

      return roadmap;
    } catch (error) {
      logger.error("Database creation failed:", error);
      throw error;
    }
  }

  /**
   * Create module with lessons
   */
  async createModule(roadmapId, moduleData) {
    try {
      // Create module first (Lesson.moduleId is required)
      const module = await Module.create({
        roadmapId,
        title: moduleData.title,
        description: moduleData.description,
        order: moduleData.order,
        status: moduleData.order === 0 ? "UNLOCKED" : "LOCKED", // First module unlocked
        lessons: [],
        estimatedHours: moduleData.estimatedHours,
        difficulty: moduleData.difficulty,
        learningObjectives: moduleData.learningObjectives || [],
        unlockRules: {
          type: "SEQUENTIAL",
          previousModuleId: moduleData.order > 0 ? null : undefined, // Set in next step
        },
      });

      // Create lessons after module creation
      const lessonDocs = [];

      for (const lessonData of moduleData.lessons) {
        lessonDocs.push({
          moduleId: module._id,
          title: lessonData.title,
          description: lessonData.description,
          order: lessonData.order,
          contentType: lessonData.contentType,
          estimatedMinutes: lessonData.estimatedMinutes,
          difficulty: lessonData.difficulty,
          learningObjectives: lessonData.learningObjectives || [],
          keyTakeaways: lessonData.keyTakeaways || [],
          status: "NOT_STARTED",
        });
      }

      const createdLessons = await Lesson.insertMany(lessonDocs, {
        ordered: true,
      });
      module.lessons = createdLessons.map((l) => l._id);
      await module.save();

      return module;
    } catch (error) {
      logger.error("Module creation failed:", error);
      throw error;
    }
  }

  /**
   * Initialize progress tracking for new roadmap
   */
  async initializeProgress(userId, roadmapId) {
    try {
      const progress = await Progress.create({
        userId,
        roadmapId,
        completionPercentage: 0,
        totalTimeSpent: 0,
        nextAction: "START_BASELINE",
        streak: {
          current: 0,
          longest: 0,
        },
      });

      logger.info("Progress initialized", { userId, roadmapId });

      return progress;
    } catch (error) {
      logger.error("Progress initialization failed:", error);
      throw error;
    }
  }

  /**
   * Adjust roadmap based on performance
   */
  async adjustRoadmap({ roadmapId, userId, performance }) {
    try {
      logger.info("Adjusting roadmap", { roadmapId, userId });

      const roadmap = await Roadmap.findById(roadmapId).populate("modules");

      if (!roadmap) {
        throw new BusinessLogicError("Roadmap not found");
      }

      // Analyze performance
      const adjustments = await this.analyzePerformance(performance);

      // Apply adjustments
      if (adjustments.addRemediation) {
        await this.insertRemediationModule(
          roadmap,
          adjustments.remediationTopics,
        );
      }

      if (adjustments.skipModules) {
        await this.skipModules(roadmap, adjustments.modulesToSkip);
      }

      if (adjustments.compressSchedule) {
        await this.compressSchedule(roadmap, adjustments.compressionFactor);
      }

      logger.info("Roadmap adjusted", { roadmapId, adjustments });

      return roadmap;
    } catch (error) {
      logger.error("Roadmap adjustment failed:", error);
      throw error;
    }
  }

  /**
   * Analyze performance and determine adjustments
   */
  async analyzePerformance(performance) {
    const adjustments = {
      addRemediation: false,
      skipModules: false,
      compressSchedule: false,
      remediationTopics: [],
      modulesToSkip: [],
      compressionFactor: 1.0,
    };

    // Check for consistent failures
    if (performance.consecutiveFailures >= 2) {
      adjustments.addRemediation = true;
      adjustments.remediationTopics = performance.failedTopics || [];
    }

    // Check for exceptional performance
    if (performance.averageScore >= 95 && performance.completionSpeed > 1.5) {
      adjustments.compressSchedule = true;
      adjustments.compressionFactor = 0.8; // 20% faster
    }

    return adjustments;
  }

  /**
   * Insert remediation module
   */
  async insertRemediationModule(roadmap, topics) {
    // Implementation for inserting remedial content
    logger.info("Inserting remediation module", {
      roadmapId: roadmap._id,
      topics,
    });
  }

  /**
   * Skip modules based on performance
   */
  async skipModules(roadmap, modulesToSkip) {
    // Implementation for skipping modules
    logger.info("Skipping modules", {
      roadmapId: roadmap._id,
      modulesToSkip,
    });
  }

  /**
   * Compress schedule
   */
  async compressSchedule(roadmap, compressionFactor) {
    // Implementation for schedule compression
    logger.info("Compressing schedule", {
      roadmapId: roadmap._id,
      compressionFactor,
    });
  }

  /**
   * Get roadmap with progress
   */
  async getRoadmapWithProgress(roadmapId, userId) {
    try {
      let roadmap;

      // If roadmapId is not provided, return the latest roadmap for the user
      if (!roadmapId) {
        roadmap = await Roadmap.findOne({ userId })
          .sort({ createdAt: -1 })
          .populate({
            path: "modules",
            populate: { path: "lessons" },
          });

        // No roadmap yet is a valid state for new users
        if (!roadmap) {
          return { roadmap: null, progress: null };
        }
      } else {
        roadmap = await Roadmap.findById(roadmapId).populate({
          path: "modules",
          populate: { path: "lessons" },
        });

        if (!roadmap) {
          throw new BusinessLogicError("Roadmap not found");
        }

        // Prevent reading other users' roadmaps
        if (String(roadmap.userId) !== String(userId)) {
          throw new BusinessLogicError("Roadmap not found");
        }
      }

      const progress = await Progress.findOne({
        userId,
        roadmapId: roadmap._id,
      });

      return {
        roadmap,
        progress,
      };
    } catch (error) {
      logger.error("Get roadmap with progress failed:", error);
      throw error;
    }
  }
}

export default new RoadmapEngine();
