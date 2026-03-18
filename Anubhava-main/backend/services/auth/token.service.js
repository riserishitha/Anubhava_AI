import jwt from 'jsonwebtoken';
import config from '../../config/environment.js';

/**
 * Token Service
 * Manages JWT token operations
 */
class TokenService {
  /**
   * Generate access token
   */
  generateAccessToken(userId, expiresIn = config.jwt.expiresIn) {
    return jwt.sign(
      {
        userId,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      },
      config.jwt.secret,
      { expiresIn }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      {
        userId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      },
      config.jwt.secret,
      { expiresIn: '30d' }
    );
  }

  /**
   * Verify token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Decode token without verification
   */
  decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      return decoded.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }
}

export default new TokenService();