import gql from 'graphql-tag';
import authTypeDefs from './auth.typeDefs.js';
import roadmapTypeDefs from './roadmap.typeDefs.js';
import assessmentTypeDefs from './assessment.typeDefs.js';
import progressTypeDefs from './progress.typeDefs.js';
import aiTypeDefs from './ai.typeDefs.js';

/**
 * Base type definitions
 * Defines root Query and Mutation types
 */
const baseTypeDefs = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  # Health check
  type Health {
    status: String!
    timestamp: String!
    services: Services!
  }

  type Services {
    database: ServiceStatus!
    gemini: ServiceStatus!
    pinecone: ServiceStatus!
  }

  type ServiceStatus {
    status: String!
  }
`;

/**
 * Combine all type definitions
 */
export default [
  baseTypeDefs,
  authTypeDefs,
  roadmapTypeDefs,
  assessmentTypeDefs,
  progressTypeDefs,
  aiTypeDefs,
];