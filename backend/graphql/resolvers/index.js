import authResolvers from './auth.resolvers.js';
import roadmapResolvers from './roadmap.resolvers.js';
import assessmentResolvers from './assessment.resolvers.js';
import progressResolvers from './progress.resolvers.js';
import aiResolvers from './ai.resolvers.js';

/**
 * Combined Resolvers
 * Merges all resolver modules
 */
export default {
  Query: {
    ...authResolvers.Query,
    ...roadmapResolvers.Query,
    ...assessmentResolvers.Query,
    ...progressResolvers.Query,
    ...aiResolvers.Query,
  },

  Mutation: {
    ...authResolvers.Mutation,
    ...roadmapResolvers.Mutation,
    ...assessmentResolvers.Mutation,
    ...progressResolvers.Mutation,
    ...aiResolvers.Mutation,
  },
};